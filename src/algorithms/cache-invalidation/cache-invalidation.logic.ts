export type CacheActor = 'svc-a' | 'svc-b' | 'cache' | 'db' | 'bus'

export type CacheStrategy =
  | 'write-through'
  | 'write-back'
  | 'direct-write'
  | 'pub-sub'

export type CacheOp = {
  from: CacheActor
  to: CacheActor
  label: string
  kind: 'read' | 'write' | 'flush' | 'event' | 'evict' | 'fill'
}

export type LogLine = {
  text: string
  kind: 'ok' | 'stale' | 'event' | 'note'
}

export type CacheInvalidationStep = {
  strategy: CacheStrategy
  /** null = key not present in cache (a miss) */
  cache: Record<string, { value: string; dirty: boolean } | null>
  db: Record<string, string>
  keys: string[]
  activeKey: string | null
  op: CacheOp | null
  /** Invalidation events currently on the pub/sub channel */
  bus: { key: string; from: CacheActor }[]
  /** Logical clock — one tick per operation */
  tick: number
  /** Tick at which cache and db started disagreeing, or null when they agree */
  staleSince: number | null
  /** Ticks the system has spent serving a value that disagrees with the database */
  staleTicks: number
  /** Longest stale window observed so far */
  worstWindow: number
  /** Value a reader would get right now, and whether it is wrong */
  servedValue: string | null
  servedIsStale: boolean
  log: LogLine[]
  description: string
}

const KEY = 'user:42'
const KEYS = [KEY, 'plan:42']

const STRATEGY_TITLES: Record<CacheStrategy, string> = {
  'write-through': 'write-through',
  'write-back': 'write-back',
  'direct-write': 'the disagreement',
  'pub-sub': 'pub/sub invalidation',
}

export function strategyTitle(s: CacheStrategy): string {
  return STRATEGY_TITLES[s]
}

export function* cacheInvalidationSteps(): Generator<CacheInvalidationStep> {
  const cache: CacheInvalidationStep['cache'] = { [KEY]: null, 'plan:42': null }
  const db: Record<string, string> = { [KEY]: 'Maya', 'plan:42': 'free' }
  let bus: CacheInvalidationStep['bus'] = []
  let log: LogLine[] = []
  let tick = 0
  let staleSince: number | null = null
  let staleTicks = 0
  let worstWindow = 0

  /** cache and db disagree on any key the cache currently holds */
  const isDiverged = () =>
    KEYS.some(k => cache[k] !== null && cache[k]!.value !== db[k])

  function emit(
    strategy: CacheStrategy,
    description: string,
    opts: {
      op?: CacheOp | null
      activeKey?: string | null
      logLine?: LogLine
      advanceTick?: boolean
      servedValue?: string | null
    } = {},
  ): CacheInvalidationStep {
    if (opts.advanceTick !== false) tick += 1

    if (isDiverged()) {
      if (staleSince === null) staleSince = tick
      staleTicks = tick - staleSince + 1
      worstWindow = Math.max(worstWindow, staleTicks)
    } else {
      staleSince = null
      staleTicks = 0
    }

    if (opts.logLine) log = [...log, opts.logLine].slice(-8)

    const activeKey = opts.activeKey === undefined ? KEY : opts.activeKey
    const served =
      opts.servedValue !== undefined
        ? opts.servedValue
        : activeKey && cache[activeKey]
          ? cache[activeKey]!.value
          : null

    return {
      strategy,
      cache: { ...cache },
      db: { ...db },
      keys: KEYS,
      activeKey,
      op: opts.op ?? null,
      bus: [...bus],
      tick,
      staleSince,
      staleTicks,
      worstWindow,
      servedValue: served,
      servedIsStale:
        served !== null && activeKey !== null && served !== db[activeKey],
      log: [...log],
      description,
    }
  }

  // ── Act 0: cold cache ───────────────────────────────────────────────────────
  yield emit(
    'write-through',
    'A cache sits between the services and the database. It is empty. The database is the source of truth: ' +
      `${KEY} = "${db[KEY]}".`,
    { op: null, logLine: { text: 'cache cold — every read is a miss', kind: 'note' } },
  )

  cache[KEY] = { value: db[KEY], dirty: false }
  yield emit(
    'write-through',
    `Service A reads ${KEY}. Cache miss → read from the database → store the result. ` +
      'Standard cache-aside fill.',
    {
      op: { from: 'db', to: 'cache', label: `fill ${KEY} = "${db[KEY]}"`, kind: 'fill' },
      logLine: { text: `MISS ${KEY} → filled from db`, kind: 'ok' },
    },
  )

  // ── Act 1: write-through ────────────────────────────────────────────────────
  yield emit(
    'write-through',
    'WRITE-THROUGH: every write goes to the cache and the database in the same operation. ' +
      'The write does not return until both are updated.',
    { op: null, logLine: { text: 'strategy → write-through', kind: 'note' } },
  )

  cache[KEY] = { value: 'Maya R.', dirty: false }
  db[KEY] = 'Maya R.'
  yield emit(
    'write-through',
    `Service A writes ${KEY} = "Maya R.". Cache and database are updated together. ` +
      'They never disagree — there is no window where a reader can see the old value.',
    {
      op: { from: 'svc-a', to: 'db', label: `write-through ${KEY}`, kind: 'write' },
      logLine: { text: `WRITE ${KEY} → cache + db (sync)`, kind: 'ok' },
    },
  )

  yield emit(
    'write-through',
    'The cost is latency: every write pays the full database round trip, even for data nobody reads. ' +
      'Consistency bought with time.',
    { op: null },
  )

  // ── Act 2: write-back ───────────────────────────────────────────────────────
  yield emit(
    'write-back',
    'WRITE-BACK: the write lands in the cache and returns immediately. The database is updated later, ' +
      'on a flush. Fast — and now a window exists.',
    { op: null, logLine: { text: 'strategy → write-back', kind: 'note' } },
  )

  cache[KEY] = { value: 'Maya Rao', dirty: true }
  yield emit(
    'write-back',
    `Service A writes ${KEY} = "Maya Rao". The cache accepts it and marks the entry dirty. ` +
      `The database still holds "${db[KEY]}". The stale window is open.`,
    {
      op: { from: 'svc-a', to: 'cache', label: `write ${KEY} (dirty)`, kind: 'write' },
      logLine: { text: `WRITE ${KEY} → cache only · db lags`, kind: 'stale' },
    },
  )

  yield emit(
    'write-back',
    'Anything that reads the database directly — a reporting job, a replica, a second service — now sees ' +
      `"${db[KEY]}" while the cache serves "Maya Rao". Two truths.`,
    {
      op: { from: 'svc-b', to: 'db', label: `read ${KEY} → "${db[KEY]}"`, kind: 'read' },
      logLine: { text: `svc-b read db → "${db[KEY]}" (behind)`, kind: 'stale' },
    },
  )

  db[KEY] = 'Maya Rao'
  cache[KEY] = { value: 'Maya Rao', dirty: false }
  yield emit(
    'write-back',
    'Flush. The dirty entry is written down to the database and the window closes. ' +
      'Write-back trades a guaranteed inconsistency window for write throughput.',
    {
      op: { from: 'cache', to: 'db', label: `flush ${KEY}`, kind: 'flush' },
      logLine: { text: `FLUSH ${KEY} → db · window closed`, kind: 'ok' },
    },
  )

  // ── Act 3: the real problem — a second writer ───────────────────────────────
  yield emit(
    'direct-write',
    'The harder case is not one service. It is two. Service B owns billing and writes straight to the ' +
      'database — it has never heard of this cache.',
    { op: null, logLine: { text: 'svc-b writes direct to db', kind: 'note' } },
  )

  db[KEY] = 'Maya R. Rao'
  yield emit(
    'direct-write',
    `Service B updates ${KEY} = "Maya R. Rao" in the database. The cache still holds "Maya Rao" and has ` +
      'no idea anything changed. Nothing told it.',
    {
      op: { from: 'svc-b', to: 'db', label: `write ${KEY} (bypasses cache)`, kind: 'write' },
      logLine: { text: `WRITE ${KEY} → db only · cache unaware`, kind: 'stale' },
    },
  )

  for (let i = 0; i < 3; i++) {
    yield emit(
      'direct-write',
      `Service A reads ${KEY} and gets a cache HIT — "${cache[KEY]!.value}". Confidently wrong. ` +
        'A hit is not the same as correct.',
      {
        op: { from: 'svc-a', to: 'cache', label: `read ${KEY} → HIT (stale)`, kind: 'read' },
        logLine: { text: `HIT ${KEY} → "${cache[KEY]!.value}" ✗ stale`, kind: 'stale' },
      },
    )
  }

  yield emit(
    'direct-write',
    `The window has been open for ${staleTicks} ticks and nothing is going to close it. ` +
      'Without a TTL it stays wrong forever; with a TTL it stays wrong until the TTL expires. ' +
      'Polling the database would close it — at the cost of querying constantly for a change that rarely comes.',
    { op: null },
  )

  // ── Act 4: pub/sub invalidation ────────────────────────────────────────────
  yield emit(
    'pub-sub',
    'PUB/SUB INVALIDATION. Every service publishes an invalidation event on write. The cache subscribes. ' +
      'No polling, no guessing — the database and the cache get a communication channel.',
    { op: null, logLine: { text: 'cache SUBSCRIBE invalidate:*', kind: 'event' } },
  )

  // reset to a consistent baseline so the pub/sub run starts clean
  cache[KEY] = { value: db[KEY], dirty: false }
  yield emit(
    'pub-sub',
    'Refill the cache so both sides agree again, then repeat the exact scenario that just broke.',
    {
      op: { from: 'db', to: 'cache', label: `fill ${KEY} = "${db[KEY]}"`, kind: 'fill' },
      logLine: { text: `FILL ${KEY} → cache in sync`, kind: 'ok' },
    },
  )

  db[KEY] = 'M. R. Rao'
  bus = [{ key: KEY, from: 'svc-b' }]
  yield emit(
    'pub-sub',
    `Service B writes ${KEY} = "M. R. Rao" to the database and publishes invalidate("${KEY}") in the ` +
      'same operation. The window opens — but something is already on its way to close it.',
    {
      op: { from: 'svc-b', to: 'bus', label: `PUBLISH invalidate ${KEY}`, kind: 'event' },
      logLine: { text: `PUBLISH invalidate ${KEY}`, kind: 'event' },
    },
  )

  yield emit(
    'pub-sub',
    'The cache is subscribed to the channel. The event arrives on the next hop — not on the next poll interval.',
    {
      op: { from: 'bus', to: 'cache', label: `deliver invalidate ${KEY}`, kind: 'event' },
      logLine: { text: `DELIVER invalidate ${KEY} → cache`, kind: 'event' },
    },
  )

  bus = []
  cache[KEY] = null
  yield emit(
    'pub-sub',
    `The cache evicts ${KEY}. It does not try to guess the new value — it just stops claiming to know. ` +
      'Stale window closed.',
    {
      op: { from: 'cache', to: 'cache', label: `evict ${KEY}`, kind: 'evict' },
      logLine: { text: `EVICT ${KEY} · window closed`, kind: 'ok' },
      servedValue: null,
    },
  )

  cache[KEY] = { value: db[KEY], dirty: false }
  yield emit(
    'pub-sub',
    `The next read from Service A misses, refills from the database, and gets "${db[KEY]}". Correct. ` +
      'One extra read, paid once, instead of an unbounded window of wrong answers.',
    {
      op: { from: 'db', to: 'cache', label: `refill ${KEY} = "${db[KEY]}"`, kind: 'fill' },
      logLine: { text: `MISS ${KEY} → refill → "${db[KEY]}" ✓`, kind: 'ok' },
    },
  )

  yield emit(
    'pub-sub',
    `Worst stale window observed: ${worstWindow} ticks — all of it in the polling-free run before pub/sub. ` +
      'Write-through pays on every write. Write-back pays in inconsistency. Pub/sub pays only when data ' +
      'actually changes.',
    { op: null, logLine: { text: 'invalidation is a message, not a schedule', kind: 'note' } },
  )
}
