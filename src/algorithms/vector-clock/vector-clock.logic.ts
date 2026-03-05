export type VectorClockEvent = {
  node: string
  type: 'local' | 'send' | 'receive'
  partner?: string
  label: string
}

export type VectorClockArrow = {
  from: string
  to: string
  fromTime: number
  toTime: number
}

export type VectorClockStep = {
  nodes: { id: string; clock: number[] }[]
  events: VectorClockEvent[]
  currentEvent: number
  arrows: VectorClockArrow[]
  description: string
}

// Node indices: A=0, B=1, C=2
const NODE_IDS = ['A', 'B', 'C']

function cloneNodes(nodes: { id: string; clock: number[] }[]): { id: string; clock: number[] }[] {
  return nodes.map(n => ({ id: n.id, clock: [...n.clock] }))
}

export function* vectorClockSteps(): Generator<VectorClockStep> {
  const nodes = NODE_IDS.map(id => ({ id, clock: [0, 0, 0] }))
  const events: VectorClockEvent[] = []
  const arrows: VectorClockArrow[] = []

  function emit(description: string): VectorClockStep {
    return {
      nodes: cloneNodes(nodes),
      events: [...events],
      currentEvent: events.length - 1,
      arrows: [...arrows],
      description,
    }
  }

  // Helper: index of a node by id
  function idx(id: string) {
    return NODE_IDS.indexOf(id)
  }

  // Helper: local event on node
  function localEvent(nodeId: string, label: string) {
    const i = idx(nodeId)
    nodes[i].clock[i]++
    events.push({ node: nodeId, type: 'local', label })
  }

  // Helper: send from nodeId, returns the clock snapshot at send time
  function sendEvent(nodeId: string, toId: string, label: string): number[] {
    const i = idx(nodeId)
    nodes[i].clock[i]++
    events.push({ node: nodeId, type: 'send', partner: toId, label })
    return [...nodes[i].clock]
  }

  // Helper: receive at nodeId from senderId, merge with sentClock
  function receiveEvent(nodeId: string, fromId: string, sentClock: number[], label: string) {
    const i = idx(nodeId)
    // element-wise max, then increment own counter
    for (let k = 0; k < 3; k++) {
      nodes[i].clock[k] = Math.max(nodes[i].clock[k], sentClock[k])
    }
    nodes[i].clock[i]++
    events.push({ node: nodeId, type: 'receive', partner: fromId, label })
  }

  // --- Step 0: intro ---
  yield {
    nodes: cloneNodes(nodes),
    events: [],
    currentEvent: -1,
    arrows: [],
    description:
      'Three distributed nodes A, B, C each maintain a vector clock — one counter per node. All start at [0, 0, 0].',
  }

  // --- Step 1: A local event ---
  localEvent('A', 'e₁: A local')
  yield emit('A performs a local event (e₁). A increments only its own counter → A: [1,0,0].')

  // --- Step 2: B local event ---
  localEvent('B', 'e₂: B local')
  yield emit('B performs a local event (e₂) independently. B increments its counter → B: [0,1,0]. These two events are concurrent — neither caused the other.')

  // --- Step 3: A sends to B ---
  const sentAtoB = sendEvent('A', 'B', 'e₃: A→B send')
  const arrowAtoB: VectorClockArrow = {
    from: 'A',
    to: 'B',
    fromTime: events.length - 1,
    toTime: events.length, // will point to next event index
  }
  yield emit('A sends a message to B (e₃). A increments its own counter before sending → A: [2,0,0]. The message carries A\'s full vector clock.')

  // --- Step 4: B receives from A ---
  arrowAtoB.toTime = events.length
  arrows.push(arrowAtoB)
  receiveEvent('B', 'A', sentAtoB, 'e₄: B←A recv')
  yield emit('B receives A\'s message (e₄). Merge rule: take element-wise max([0,1,0], [2,0,0]) = [2,1,0], then increment B\'s own → B: [2,2,0]. B now knows about everything that happened before A sent.')

  // --- Step 5: B local event ---
  localEvent('B', 'e₅: B local')
  yield emit('B does another local event (e₅). Only B\'s own counter advances → B: [2,3,0].')

  // --- Step 6: C local event (independent) ---
  localEvent('C', 'e₆: C local')
  yield emit('C performs a local event (e₆) in isolation → C: [0,0,1]. C has not communicated with anyone yet, so it is concurrent with A\'s and B\'s events.')

  // --- Step 7: B sends to C ---
  const sentBtoC = sendEvent('B', 'C', 'e₇: B→C send')
  const arrowBtoC: VectorClockArrow = {
    from: 'B',
    to: 'C',
    fromTime: events.length - 1,
    toTime: events.length,
  }
  yield emit('B sends a message to C (e₇). B\'s counter increments → B: [2,4,0]. The message carries [2,4,0], letting C learn the entire causal history visible to B.')

  // --- Step 8: C receives from B ---
  arrowBtoC.toTime = events.length
  arrows.push(arrowBtoC)
  receiveEvent('C', 'B', sentBtoC, 'e₈: C←B recv')
  yield emit('C receives B\'s message (e₈). Merge: max([0,0,1], [2,4,0]) = [2,4,1], then increment C → C: [2,4,2]. C now has a causal picture of the whole system up to B\'s send.')

  // --- Step 9: C local event ---
  localEvent('C', 'e₉: C local')
  yield emit('C does a local event (e₉) after the merge → C: [2,4,3]. This event causally depends on everything B knew when it sent the message.')

  // --- Step 10: A local event ---
  localEvent('A', 'e₁₀: A local')
  yield emit('A does another local event (e₁₀) without communicating → A: [3,0,0]. This is concurrent with e₅ through e₉ on B and C.')

  // --- Step 11: causality explanation ---
  yield {
    nodes: cloneNodes(nodes),
    events: [...events],
    currentEvent: -1,
    arrows: [...arrows],
    description:
      'Causality rule: event e₁ happened-before e₂ (written e₁→e₂) if every component of VC(e₁) ≤ VC(e₂) and at least one is strictly less. Otherwise the events are concurrent.',
  }

  // --- Step 12: concurrent events callout ---
  yield {
    nodes: cloneNodes(nodes),
    events: [...events],
    currentEvent: -1,
    arrows: [...arrows],
    description:
      'Example — e₁ (A:[1,0,0]) vs e₂ (B:[0,1,0]): neither dominates the other. They are concurrent (∥). Vector clocks identify this without a global clock.',
  }

  // --- Step 13: happened-before callout ---
  yield {
    nodes: cloneNodes(nodes),
    events: [...events],
    currentEvent: -1,
    arrows: [...arrows],
    description:
      'Example — e₃ (A sends, [2,0,0]) happened-before e₄ (B receives, [2,2,0]): every component of [2,0,0] ≤ [2,2,0]. Vector clocks faithfully capture the message causal edge.',
  }

  // --- Step 14: final summary ---
  yield {
    nodes: cloneNodes(nodes),
    events: [...events],
    currentEvent: -1,
    arrows: [...arrows],
    description:
      'Final state — A: [3,0,0], B: [2,4,0], C: [2,4,3]. Vector clocks give each node a consistent view of causality across the distributed system — no shared clock required.',
  }
}
