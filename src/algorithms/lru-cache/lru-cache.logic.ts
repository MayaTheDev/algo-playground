export type LruOperation =
  | { type: 'put'; key: string; value: number; label: string }
  | { type: 'get'; key: string; label: string }

export type LruNode = {
  key: string
  value: number
  prev: string | null
  next: string | null
}

export type LruStats = {
  hits: number
  misses: number
  evictions: number
  operations: number
}

export type LruStep = {
  capacity: number
  operation: LruOperation | null
  beforeOrder: string[]
  beforeValues: Record<string, number>
  order: string[]
  values: Record<string, number>
  nodes: LruNode[]
  currentKey: string | null
  evicted: string | null
  result: 'start' | 'hit' | 'miss' | 'insert' | 'update' | 'evict'
  stats: LruStats
  interviewPrompt: string
  tradeoff: {
    title: string
    body: string
  }
  description: string
}

type CacheState = {
  capacity: number
  order: string[]
  values: Record<string, number>
  stats: LruStats
}

const OPERATIONS: LruOperation[] = [
  { type: 'put', key: 'profile', value: 41, label: 'put(profile, 41)' },
  { type: 'put', key: 'feed', value: 17, label: 'put(feed, 17)' },
  { type: 'put', key: 'search', value: 33, label: 'put(search, 33)' },
  { type: 'get', key: 'profile', label: 'get(profile)' },
  { type: 'put', key: 'checkout', value: 92, label: 'put(checkout, 92)' },
  { type: 'get', key: 'feed', label: 'get(feed)' },
  { type: 'put', key: 'pricing', value: 28, label: 'put(pricing, 28)' },
  { type: 'get', key: 'search', label: 'get(search)' },
  { type: 'put', key: 'feed', value: 18, label: 'put(feed, 18)' },
]

const TRADEOFFS = [
  {
    title: 'Performance',
    body: 'A hash map gives O(1) lookup. A recency list makes the eviction candidate visible without scanning the cache.',
  },
  {
    title: 'Memory',
    body: 'Exact LRU stores metadata for every cached item. Real systems often approximate LRU to cut memory and CPU overhead.',
  },
  {
    title: 'Concurrency',
    body: 'Every hit mutates recency. In a multi-threaded service, that means locks, sharding, or accepting approximate ordering.',
  },
  {
    title: 'TTL vs recency',
    body: 'LRU answers what was used least recently. TTL answers what is stale. Production caches often need both ideas.',
  },
]

function cloneValues(values: Record<string, number>): Record<string, number> {
  return { ...values }
}

function toNodes(order: string[], values: Record<string, number>): LruNode[] {
  return order.map((key, index) => ({
    key,
    value: values[key],
    prev: order[index - 1] ?? null,
    next: order[index + 1] ?? null,
  }))
}

function hitRate(stats: LruStats): number {
  const attempts = stats.hits + stats.misses
  return attempts === 0 ? 0 : Math.round((stats.hits / attempts) * 100)
}

function snapshot({
  state,
  operation,
  beforeOrder,
  beforeValues,
  currentKey,
  evicted,
  result,
  description,
  tradeoffIndex,
}: {
  state: CacheState
  operation: LruOperation | null
  beforeOrder: string[]
  beforeValues: Record<string, number>
  currentKey: string | null
  evicted: string | null
  result: LruStep['result']
  description: string
  tradeoffIndex: number
}): LruStep {
  const tradeoff = TRADEOFFS[tradeoffIndex % TRADEOFFS.length]
  const interviewPrompt =
    operation === null
      ? 'The interviewer asks: what two structures make LRU O(1)?'
      : result === 'evict'
        ? `Before ${operation.label}, which key should be evicted?`
        : result === 'miss'
          ? `${operation.label}: is this a hit or a miss?`
          : `${operation.label}: what changes in the recency list?`

  return {
    capacity: state.capacity,
    operation,
    beforeOrder: [...beforeOrder],
    beforeValues: cloneValues(beforeValues),
    order: [...state.order],
    values: cloneValues(state.values),
    nodes: toNodes(state.order, state.values),
    currentKey,
    evicted,
    result,
    stats: { ...state.stats },
    interviewPrompt,
    tradeoff,
    description,
  }
}

export function lruCacheOperations(): LruOperation[] {
  return OPERATIONS
}

export function* lruCacheSteps(): Generator<LruStep> {
  const state: CacheState = {
    capacity: 3,
    order: [],
    values: {},
    stats: { hits: 0, misses: 0, evictions: 0, operations: 0 },
  }

  const moveToFront = (key: string) => {
    state.order = [key, ...state.order.filter((candidate) => candidate !== key)]
  }

  yield snapshot({
    state,
    operation: null,
    beforeOrder: [],
    beforeValues: {},
    currentKey: null,
    evicted: null,
    result: 'start',
    tradeoffIndex: 0,
    description:
      'LRU cache interview mode: predict hits, misses, and evictions while the map and recency list update.',
  })

  for (const [index, operation] of OPERATIONS.entries()) {
    const beforeOrder = [...state.order]
    const beforeValues = cloneValues(state.values)
    let evicted: string | null = null
    let result: LruStep['result'] = 'hit'

    state.stats.operations += 1

    if (operation.type === 'get') {
      if (operation.key in state.values) {
        state.stats.hits += 1
        moveToFront(operation.key)
        result = 'hit'
      } else {
        state.stats.misses += 1
        result = 'miss'
      }
    } else {
      if (operation.key in state.values) {
        state.values[operation.key] = operation.value
        moveToFront(operation.key)
        result = 'update'
      } else {
        if (state.order.length === state.capacity) {
          evicted = state.order[state.order.length - 1]
          delete state.values[evicted]
          state.order = state.order.slice(0, -1)
          state.stats.evictions += 1
          result = 'evict'
        } else {
          result = 'insert'
        }
        state.values[operation.key] = operation.value
        moveToFront(operation.key)
      }
    }

    const rate = hitRate(state.stats)
    const description =
      result === 'evict'
        ? `${operation.label}: cache is full, so ${evicted} leaves from the LRU tail. Hit rate is now ${rate}%.`
        : result === 'hit'
          ? `${operation.label}: hit. Move ${operation.key} to MRU so the next eviction protects it. Hit rate is now ${rate}%.`
          : result === 'miss'
            ? `${operation.label}: miss. The cache cannot help because ${operation.key} is absent. Hit rate is now ${rate}%.`
            : result === 'update'
              ? `${operation.label}: update existing value and promote ${operation.key} to MRU.`
              : `${operation.label}: insert into free capacity and mark it most recently used.`

    yield snapshot({
      state,
      operation,
      beforeOrder,
      beforeValues,
      currentKey: operation.key,
      evicted,
      result,
      tradeoffIndex: index + 1,
      description,
    })
  }
}
