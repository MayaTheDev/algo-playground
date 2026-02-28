export type LruStep = {
  capacity: number
  order: string[]
  values: Record<string, number>
  currentKey: string | null
  evicted: string | null
  description: string
}

type CacheState = {
  capacity: number
  order: string[]
  values: Record<string, number>
}

function snapshot(state: CacheState, currentKey: string | null, evicted: string | null, description: string): LruStep {
  return {
    capacity: state.capacity,
    order: [...state.order],
    values: { ...state.values },
    currentKey,
    evicted,
    description,
  }
}

export function* lruCacheSteps(): Generator<LruStep> {
  const state: CacheState = { capacity: 3, order: [], values: {} }

  const moveToFront = (key: string) => {
    state.order = [key, ...state.order.filter((candidate) => candidate !== key)]
  }

  const put = (key: string, value: number) => {
    let evicted: string | null = null
    if (!(key in state.values) && state.order.length === state.capacity) {
      evicted = state.order[state.order.length - 1]
      delete state.values[evicted]
      state.order = state.order.slice(0, -1)
    }
    state.values[key] = value
    moveToFront(key)
    return evicted
  }

  const get = (key: string) => {
    if (!(key in state.values)) return false
    moveToFront(key)
    return true
  }

  yield snapshot(state, null, null, 'An LRU cache needs two constant-time structures at once: hash map for lookup, doubly-linked list for recency.')

  let evicted = put('A', 1)
  yield snapshot(state, 'A', evicted, 'put(A, 1): add A at the head. It is now most recently used.')

  evicted = put('B', 2)
  yield snapshot(state, 'B', evicted, 'put(B, 2): B becomes MRU, A slides toward the tail.')

  evicted = put('C', 3)
  yield snapshot(state, 'C', evicted, 'put(C, 3): cache reaches capacity. Recency order is now C → B → A.')

  get('A')
  yield snapshot(state, 'A', null, 'get(A): lookup is O(1) through the hash map, then A moves to the head.')

  evicted = put('D', 4)
  yield snapshot(state, 'D', evicted, 'put(D, 4): cache is full, so evict the tail (least recently used) before inserting D.')

  get('C')
  yield snapshot(state, 'C', null, 'get(C): C jumps back to the head because recency changed.')

  evicted = put('E', 5)
  yield snapshot(state, 'E', evicted, 'put(E, 5): evict the stalest item again. The linked list keeps that answer at the tail in O(1).')
}
