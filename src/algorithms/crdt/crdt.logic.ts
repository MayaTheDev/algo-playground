export type CrdtStep = {
  replicas: {
    id: string
    document: string
    operations: string[]
    vectorClock: Record<string, number>
    counter: number
  }[]
  phase: 'intro' | 'local-edit' | 'sync' | 'conflict' | 'resolved' | 'counter'
  activeReplica: string | null
  syncArrow: { from: string; to: string } | null
  description: string
}

type Replica = {
  id: string
  document: string
  operations: string[]
  vectorClock: Record<string, number>
  counter: number
}

function snapshot(
  replicas: Replica[],
  phase: CrdtStep['phase'],
  activeReplica: string | null,
  syncArrow: { from: string; to: string } | null,
  description: string,
): CrdtStep {
  return {
    replicas: replicas.map((r) => ({ ...r, operations: [...r.operations], vectorClock: { ...r.vectorClock } })),
    phase,
    activeReplica,
    syncArrow,
    description,
  }
}

export function* crdtSteps(): Generator<CrdtStep> {
  // --- Setup ---
  const alice: Replica = {
    id: 'Alice',
    document: 'Hello',
    operations: [],
    vectorClock: { Alice: 0, Bob: 0 },
    counter: 0,
  }
  const bob: Replica = {
    id: 'Bob',
    document: 'Hello',
    operations: [],
    vectorClock: { Alice: 0, Bob: 0 },
    counter: 0,
  }

  // Step 1 — Intro
  yield snapshot(
    [alice, bob],
    'intro',
    null,
    null,
    'Two replicas (Alice and Bob) start with the same document: "Hello". No coordination is required — each can edit independently.',
  )

  // Step 2 — Intro: explain the concept
  yield snapshot(
    [alice, bob],
    'intro',
    null,
    null,
    'CRDTs (Conflict-free Replicated Data Types) guarantee eventual consistency: any two replicas that have seen the same set of operations will converge to the same state — regardless of the order operations arrived.',
  )

  // Step 3 — Alice edits locally (appends " World")
  alice.document = 'Hello World'
  alice.vectorClock.Alice += 1
  alice.operations.push('append(" World") @ vc={Alice:1,Bob:0}')

  yield snapshot(
    [alice, bob],
    'local-edit',
    'Alice',
    null,
    'Alice appends " World" to her local copy. She increments her own vector clock. Bob is unaware of this change.',
  )

  // Step 4 — Bob edits locally (appends " There") — concurrent!
  bob.document = 'Hello There'
  bob.vectorClock.Bob += 1
  bob.operations.push('append(" There") @ vc={Alice:0,Bob:1}')

  yield snapshot(
    [alice, bob],
    'conflict',
    'Bob',
    null,
    'Bob concurrently appends " There" to his own copy. Both replicas have diverged. This is a conflict — but CRDTs handle it automatically.',
  )

  // Step 5 — Show the conflict clearly
  yield snapshot(
    [alice, bob],
    'conflict',
    null,
    null,
    'Alice sees "Hello World", Bob sees "Hello There". Their vector clocks show concurrent operations: neither happened-before the other. A CRDT merge function will resolve this deterministically.',
  )

  // Step 6 — Alice syncs her op to Bob
  // Merge rule: sort concurrent appends lexicographically by replica ID (deterministic)
  // "Alice" < "Bob" alphabetically → Alice's append wins positional order
  bob.vectorClock.Alice = Math.max(bob.vectorClock.Alice, alice.vectorClock.Alice)
  bob.operations.push('recv append(" World") from Alice @ vc={Alice:1,Bob:0}')

  yield snapshot(
    [alice, bob],
    'sync',
    'Bob',
    { from: 'Alice', to: 'Bob' },
    'Alice broadcasts her operation to Bob. Bob receives it and applies it using the CRDT merge rule.',
  )

  // After merge: Bob's document resolves
  // Deterministic merge: sort by (position, replica-id). Alice's append precedes Bob's alphabetically.
  bob.document = 'Hello World There'
  bob.vectorClock.Alice = alice.vectorClock.Alice

  yield snapshot(
    [alice, bob],
    'sync',
    'Bob',
    { from: 'Alice', to: 'Bob' },
    'Bob merges: concurrent appends are ordered by replica ID (Alice < Bob). Result: "Hello World There". No coordinator needed.',
  )

  // Step 7 — Bob syncs his op back to Alice
  alice.vectorClock.Bob = Math.max(alice.vectorClock.Bob, bob.vectorClock.Bob)
  alice.operations.push('recv append(" There") from Bob @ vc={Alice:1,Bob:1}')
  alice.document = 'Hello World There'

  yield snapshot(
    [alice, bob],
    'sync',
    'Alice',
    { from: 'Bob', to: 'Alice' },
    "Bob broadcasts his operation to Alice. Alice applies the same merge rule and arrives at the identical result.",
  )

  // Step 8 — Both converged
  yield snapshot(
    [alice, bob],
    'resolved',
    null,
    null,
    'Both replicas now hold "Hello World There". They converged without any central coordinator — this is eventual consistency in action.',
  )

  // Step 9 — Explain vector clocks
  yield snapshot(
    [alice, bob],
    'resolved',
    null,
    null,
    'Vector clocks track causality. Each replica bumps its own counter on write and takes the max of all counters on merge. If vc_A ≤ vc_B on every dimension, A happened-before B. Otherwise they are concurrent.',
  )

  // --- G-Counter CRDT bonus section ---
  alice.counter = 0
  bob.counter = 0

  const counterAlice: Replica = {
    id: 'Alice',
    document: '',
    operations: [],
    vectorClock: { Alice: 0, Bob: 0 },
    counter: 0,
  }
  const counterBob: Replica = {
    id: 'Bob',
    document: '',
    operations: [],
    vectorClock: { Alice: 0, Bob: 0 },
    counter: 0,
  }

  yield snapshot(
    [counterAlice, counterBob],
    'counter',
    null,
    null,
    'Now let\'s see a G-Counter (grow-only counter) CRDT. Each replica owns a slot in an array. The global count is the sum of all slots.',
  )

  // Alice increments her slot twice
  counterAlice.counter += 2
  counterAlice.vectorClock.Alice += 2
  counterAlice.operations.push('increment ×2 → local total: 2')

  yield snapshot(
    [counterAlice, counterBob],
    'counter',
    'Alice',
    null,
    'Alice increments her slot by 2. Her local counter reads 2. Bob\'s slot is still 0.',
  )

  // Bob increments once
  counterBob.counter += 3
  counterBob.vectorClock.Bob += 3
  counterBob.operations.push('increment ×3 → local total: 3')

  yield snapshot(
    [counterAlice, counterBob],
    'counter',
    'Bob',
    null,
    'Bob independently increments by 3. Concurrent with Alice — no coordination needed. Bob\'s local total is 3.',
  )

  // Merge: each replica takes max of each peer's slot
  counterAlice.vectorClock.Bob = Math.max(counterAlice.vectorClock.Bob, counterBob.vectorClock.Bob)
  counterAlice.operations.push(`merge Bob's slot: max(0, 3) = 3`)

  yield snapshot(
    [counterAlice, counterBob],
    'counter',
    'Alice',
    { from: 'Bob', to: 'Alice' },
    'Alice merges Bob\'s counter: she takes max(her_Bob_slot, received_Bob_slot) = max(0, 3) = 3. Global count = 2 + 3 = 5.',
  )

  counterBob.vectorClock.Alice = Math.max(counterBob.vectorClock.Alice, counterAlice.vectorClock.Alice)
  counterBob.operations.push(`merge Alice's slot: max(0, 2) = 2`)

  yield snapshot(
    [counterAlice, counterBob],
    'counter',
    'Bob',
    { from: 'Alice', to: 'Bob' },
    'Bob merges Alice\'s counter: max(0, 2) = 2. Bob\'s global count = 2 + 3 = 5. Both replicas agree on 5 without any lock or coordinator.',
  )

  // Final step
  yield snapshot(
    [counterAlice, counterBob],
    'resolved',
    null,
    null,
    'G-Counter merge rule: for each peer, take the element-wise max. Sum all slots for the global value. It is idempotent, associative, and commutative — the three laws that make a CRDT correct.',
  )
}
