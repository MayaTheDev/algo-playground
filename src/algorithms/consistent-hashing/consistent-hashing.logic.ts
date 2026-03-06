export type ConsistentHashStep = {
  servers: { id: string; position: number; color: string }[]
  dataItems: { key: string; position: number; assignedTo: string | null }[]
  ringSize: number
  phase: 'place-servers' | 'place-data' | 'add-server' | 'remove-server'
  activeItem: string | null
  movedItems: string[]
  description: string
}

// Simple deterministic hash: maps a string to [0, ringSize)
function hashToRing(key: string, ringSize: number): number {
  let h = 0
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0
  }
  return h % ringSize
}

// Find the server a data item maps to (clockwise walk)
function findServer(
  position: number,
  servers: { id: string; position: number }[],
  ringSize: number,
): string | null {
  if (servers.length === 0) return null
  const sorted = [...servers].sort((a, b) => a.position - b.position)
  // Find first server at or after position (clockwise)
  for (const s of sorted) {
    if (s.position >= position) return s.id
  }
  // Wrap around
  return sorted[0].id
}

const SERVER_COLORS = ['#34d399', '#60a5fa', '#f472b6', '#a78bfa']

const INITIAL_SERVER_NAMES = ['S1', 'S2', 'S3']
const DATA_KEYS = ['gamma', 'cache:a', 'msg:5', 'token:1', 'photo:9', 'profile:1', 'alpha']
const NEW_SERVER = 'S4'

export function* consistentHashSteps(): Generator<ConsistentHashStep> {
  const RING = 360

  // ── Phase 1: Place servers ──────────────────────────────────────────────────
  const serverPositions: Record<string, number> = {
    S1: 80,
    S2: 180,
    S3: 300,
  }

  let servers: ConsistentHashStep['servers'] = []
  let dataItems: ConsistentHashStep['dataItems'] = []

  yield {
    servers: [],
    dataItems: [],
    ringSize: RING,
    phase: 'place-servers',
    activeItem: null,
    movedItems: [],
    description:
      'Consistent hashing maps both servers and keys onto the same circular ring. ' +
      'We start with an empty ring of size 360 (one degree per unit).',
  }

  for (let i = 0; i < INITIAL_SERVER_NAMES.length; i++) {
    const name = INITIAL_SERVER_NAMES[i]
    servers = [
      ...servers,
      { id: name, position: serverPositions[name], color: SERVER_COLORS[i] },
    ]
    yield {
      servers: [...servers],
      dataItems: [],
      ringSize: RING,
      phase: 'place-servers',
      activeItem: name,
      movedItems: [],
      description:
        `Place ${name} at ring position ${serverPositions[name]}°. ` +
        'In production this position comes from hash(serverId); here we pin positions so the arcs are readable.',
    }
  }

  yield {
    servers: [...servers],
    dataItems: [],
    ringSize: RING,
    phase: 'place-servers',
    activeItem: null,
    movedItems: [],
    description:
      'Three servers divide the ring into three arcs. ' +
      'A key belongs to the first server clockwise from its hashed position.',
  }

  // ── Phase 2: Place data items ───────────────────────────────────────────────
  for (const key of DATA_KEYS) {
    const pos = hashToRing(key, RING)
    const assignedTo = findServer(pos, servers, RING)
    dataItems = [...dataItems, { key, position: pos, assignedTo }]
    yield {
      servers: [...servers],
      dataItems: [...dataItems],
      ringSize: RING,
      phase: 'place-data',
      activeItem: key,
      movedItems: [],
      description:
        `"${key}" hashes to ${pos}°. Walking clockwise hits ${assignedTo} → assigned there.`,
    }
  }

  yield {
    servers: [...servers],
    dataItems: [...dataItems],
    ringSize: RING,
    phase: 'place-data',
    activeItem: null,
    movedItems: [],
    description:
      'All keys are distributed across three servers. ' +
      'Each server owns the arc from its predecessor up to itself.',
  }

  // ── Phase 3: Add a server ───────────────────────────────────────────────────
  const newPos = 270
  const newServer = { id: NEW_SERVER, position: newPos, color: SERVER_COLORS[3] }

  yield {
    servers: [...servers],
    dataItems: [...dataItems],
    ringSize: RING,
    phase: 'add-server',
    activeItem: NEW_SERVER,
    movedItems: [],
    description:
      `Adding ${NEW_SERVER} at ${newPos}°. Only keys in the arc between S2 and ${NEW_SERVER} need to move — ` +
      'everything else stays exactly where it is.',
  }

  servers = [...servers, newServer]

  // Recompute assignments; collect items that moved
  const prevAssignments: Record<string, string | null> = {}
  for (const item of dataItems) prevAssignments[item.key] = item.assignedTo

  const updatedItems = dataItems.map(item => ({
    ...item,
    assignedTo: findServer(item.position, servers, RING),
  }))
  dataItems = updatedItems

  const movedAfterAdd = dataItems
    .filter(item => item.assignedTo !== prevAssignments[item.key])
    .map(item => item.key)

  yield {
    servers: [...servers],
    dataItems: [...dataItems],
    ringSize: RING,
    phase: 'add-server',
    activeItem: NEW_SERVER,
    movedItems: movedAfterAdd,
    description:
      `${NEW_SERVER} is live. Only ${movedAfterAdd.length} of ${DATA_KEYS.length} keys redistributed ` +
      `(${movedAfterAdd.join(', ')}). The rest stayed put — that's minimal disruption.`,
  }

  yield {
    servers: [...servers],
    dataItems: [...dataItems],
    ringSize: RING,
    phase: 'add-server',
    activeItem: null,
    movedItems: [],
    description:
      'With a naive modular hash (key mod N), adding one server would reshuffle most keys. ' +
      'Consistent hashing moved only the keys that fall in the new server\'s arc.',
  }

  // ── Phase 4: Remove a server ────────────────────────────────────────────────
  const removedId = 'S2'

  yield {
    servers: [...servers],
    dataItems: [...dataItems],
    ringSize: RING,
    phase: 'remove-server',
    activeItem: removedId,
    movedItems: [],
    description:
      `Simulating ${removedId} going offline. Its keys will walk clockwise to the next live server. ` +
      'No other keys are disturbed.',
  }

  const prevAssignments2: Record<string, string | null> = {}
  for (const item of dataItems) prevAssignments2[item.key] = item.assignedTo

  servers = servers.filter(s => s.id !== removedId)
  dataItems = dataItems.map(item => ({
    ...item,
    assignedTo: findServer(item.position, servers, RING),
  }))

  const movedAfterRemove = dataItems
    .filter(item => item.assignedTo !== prevAssignments2[item.key])
    .map(item => item.key)

  yield {
    servers: [...servers],
    dataItems: [...dataItems],
    ringSize: RING,
    phase: 'remove-server',
    activeItem: removedId,
    movedItems: movedAfterRemove,
    description:
      `${removedId} removed. Only ${movedAfterRemove.length} key${movedAfterRemove.length !== 1 ? 's' : ''} ` +
      `(${movedAfterRemove.join(', ')}) had to move. Every other key kept its server.`,
  }

  yield {
    servers: [...servers],
    dataItems: [...dataItems],
    ringSize: RING,
    phase: 'remove-server',
    activeItem: null,
    movedItems: [],
    description:
      'Consistent hashing: O(K/N) keys move on average when a server is added or removed, ' +
      'versus O(K) for a naive hash. This makes it the backbone of distributed caches and load balancers.',
  }
}
