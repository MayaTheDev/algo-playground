export type HashTableStep = {
  size: number
  key: string | null
  hash: number | null
  chaining: string[][]
  probing: (string | null)[]
  probeIndex: number | null
  description: string
}

const KEYS = ['map', 'heap', 'queue', 'stack']
const SIZE = 4

function hashWord(word: string) {
  return word.length % SIZE
}

export function* hashTableSteps(): Generator<HashTableStep> {
  const chaining = Array.from({ length: SIZE }, () => [] as string[])
  const probing = Array.from({ length: SIZE }, () => null as string | null)

  yield {
    size: SIZE,
    key: null,
    hash: null,
    chaining: chaining.map((bucket) => [...bucket]),
    probing: [...probing],
    probeIndex: null,
    description: 'Hash the key into a bucket. Then collisions force a policy choice: chaining or open addressing.',
  }

  for (const key of KEYS) {
    const hashed = hashWord(key)
    chaining[hashed].push(key)

    yield {
      size: SIZE,
      key,
      hash: hashed,
      chaining: chaining.map((bucket) => [...bucket]),
      probing: [...probing],
      probeIndex: hashed,
      description: `"${key}" hashes to bucket ${hashed}. Chaining just appends it to the bucket list.`,
    }

    let slot = hashed
    while (probing[slot] !== null) {
      yield {
        size: SIZE,
        key,
        hash: hashed,
        chaining: chaining.map((bucket) => [...bucket]),
        probing: [...probing],
        probeIndex: slot,
        description: `Linear probing: slot ${slot} is occupied by "${probing[slot]}". Step forward and try again.`,
      }
      slot = (slot + 1) % SIZE
    }

    probing[slot] = key
    yield {
      size: SIZE,
      key,
      hash: hashed,
      chaining: chaining.map((bucket) => [...bucket]),
      probing: [...probing],
      probeIndex: slot,
      description: `Place "${key}" into open-addressed slot ${slot}. Same hash, different collision strategy.`,
    }
  }

  yield {
    size: SIZE,
    key: null,
    hash: null,
    chaining: chaining.map((bucket) => [...bucket]),
    probing: [...probing],
    probeIndex: null,
    description: 'Both strategies aim for O(1) average lookup. The tradeoff is where the collision complexity lives: in the bucket or in the probe sequence.',
  }
}
