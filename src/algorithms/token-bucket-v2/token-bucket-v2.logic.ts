/**
 * Token bucket v2 — Day 69.
 *
 * Day 42 built a token bucket. One bucket, one client, one process, and it
 * worked, which is a different thing from being right.
 *
 * A rate limiter is not the bucket. The bucket is the easy part. The rate
 * limiter is the bucket plus the place the bucket lives, plus what you do
 * on the day that place stops answering.
 *
 * Three runs of the same traffic:
 *   bucket   — token bucket over shared Redis state, three clients
 *   sliding  — the sliding window counter, which is stricter and costs more
 *   outage   — Redis goes down mid-burst; fail open, then fail closed
 *
 * The point of the third mode is that there is no correct answer to it.
 * There is only the answer that matches what you're protecting.
 */

export type TokenBucketV2Mode = 'bucket' | 'sliding' | 'outage'

export type ClientId = 'alpha' | 'beta' | 'gamma'

export const CLIENT_IDS: ClientId[] = ['alpha', 'beta', 'gamma']

/** requests/sec allowed per client */
export const LIMIT = 5
/** bucket capacity — how much burst we're willing to absorb */
export const CAPACITY = 5
/** tokens added per tick */
export const REFILL_RATE = 2
/** sliding window width, in ticks */
export const WINDOW = 4

export type RedisState = 'up' | 'down'

export type FailurePolicy = 'open' | 'closed' | null

export type Client = {
  id: ClientId
  /** token bucket balance, as stored in Redis */
  tokens: number
  /** timestamps (ticks) of recent allowed requests — sliding window mode */
  window: number[]
  /** requests this client has attempted so far */
  attempted: number
  /** requests this client got through */
  allowed: number
  /** requests this client had rejected */
  denied: number
  /** the client is hammering the API this tick */
  bursting: boolean
}

export type Verdict = {
  label: string
  bucket: string
  sliding: string
  note: string
}

export type LogKind = 'allow' | 'deny' | 'refill' | 'outage' | 'policy' | 'note'

export type LogLine = {
  kind: LogKind
  text: string
}

export type TokenBucketV2Step = {
  mode: TokenBucketV2Mode
  tick: number
  clients: Client[]
  redis: RedisState
  policy: FailurePolicy
  /** which client the current step is acting on */
  active: ClientId | null
  /** index into CODE[mode] currently executing */
  codeLine: number | null
  /** redis round-trips spent this tick — the cost axis */
  redisOps: number
  /** cumulative redis round-trips */
  totalOps: number
  verdict: Verdict | null
  log: LogLine[]
  phase: 'setup' | 'steady' | 'burst' | 'refill' | 'partition' | 'recover' | 'verdict'
  description: string
}

export const MODE_LABELS: Record<TokenBucketV2Mode, string> = {
  bucket: 'Token bucket',
  sliding: 'Sliding window',
  outage: 'Redis outage',
}

export const CODE: Record<TokenBucketV2Mode, string[]> = {
  bucket: [
    'def allow(client_id):',
    '    bucket = redis.hgetall(f"rl:{client_id}")   # 1 round-trip',
    '    now    = time.monotonic()',
    '    elapsed = now - bucket.last_refill',
    '    tokens = min(CAPACITY, bucket.tokens + elapsed * REFILL_RATE)',
    '    if tokens < 1:',
    '        return DENY                             # bucket empty',
    '    redis.hset(f"rl:{client_id}", tokens=tokens - 1, last_refill=now)',
    '    return ALLOW',
  ],
  sliding: [
    'def allow(client_id):',
    '    now = time.monotonic()',
    '    key = f"rl:{client_id}"',
    '    pipe = redis.pipeline()',
    '    pipe.zremrangebyscore(key, 0, now - WINDOW)  # evict old',
    '    pipe.zcard(key)                             # count survivors',
    '    _, count = pipe.execute()                   # 1 round-trip, 2 ops',
    '    if count >= LIMIT:',
    '        return DENY                             # window full',
    '    redis.zadd(key, {uuid4(): now})             # 1 more round-trip',
    '    return ALLOW',
  ],
  outage: [
    'def allow(client_id):',
    '    try:',
    '        bucket = redis.hgetall(f"rl:{client_id}")',
    '    except RedisConnectionError:',
    '        # the limiter cannot see shared state.',
    '        # this line is the entire decision.',
    '        return FAIL_POLICY                      # ALLOW or DENY',
    '    ...',
  ],
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function freshClients(): Client[] {
  return CLIENT_IDS.map(id => ({
    id,
    tokens: CAPACITY,
    window: [],
    attempted: 0,
    allowed: 0,
    denied: 0,
    bursting: false,
  }))
}

const clone = (clients: Client[]): Client[] => clients.map(c => ({ ...c, window: [...c.window] }))

/**
 * Traffic shape shared by all three modes, so the comparison is honest.
 * alpha is a well-behaved client. beta bursts hard then goes quiet.
 * gamma is steady but just over the line.
 */
const TRAFFIC: Record<ClientId, number[]> = {
  //      tick: 0  1  2  3  4  5  6  7
  alpha: [1, 1, 1, 1, 1, 1, 1, 1],
  beta: [0, 6, 6, 0, 0, 0, 2, 2],
  gamma: [2, 2, 2, 2, 2, 2, 2, 2],
}

const TICKS = 8

// ─── generator ───────────────────────────────────────────────────────────────

export function* tokenBucketV2Steps(mode: TokenBucketV2Mode): Generator<TokenBucketV2Step> {
  const clients = freshClients()
  const log: LogLine[] = []
  let totalOps = 0

  const emit = (
    partial: Partial<TokenBucketV2Step> & { description: string; phase: TokenBucketV2Step['phase'] },
  ): TokenBucketV2Step => ({
    mode,
    tick: 0,
    clients: clone(clients),
    redis: 'up',
    policy: null,
    active: null,
    codeLine: null,
    redisOps: 0,
    totalOps,
    verdict: null,
    log: [...log],
    ...partial,
  })

  const say = (kind: LogKind, text: string) => {
    log.push({ kind, text })
    if (log.length > 9) log.shift()
  }

  if (mode === 'bucket') {
    yield* bucketRun(clients, log, say, emit, () => totalOps, n => (totalOps += n))
    return
  }
  if (mode === 'sliding') {
    yield* slidingRun(clients, log, say, emit, () => totalOps, n => (totalOps += n))
    return
  }
  yield* outageRun(clients, log, say, emit, () => totalOps, n => (totalOps += n))
}

type Emit = (
  partial: Partial<TokenBucketV2Step> & { description: string; phase: TokenBucketV2Step['phase'] },
) => TokenBucketV2Step
type Say = (kind: LogKind, text: string) => void
type AddOps = (n: number) => void

// ─── mode 1: token bucket over shared state ──────────────────────────────────

function* bucketRun(
  clients: Client[],
  _log: LogLine[],
  say: Say,
  emit: Emit,
  getOps: () => number,
  addOps: AddOps,
): Generator<TokenBucketV2Step> {
  say('note', `Three clients, ${LIMIT} req/s each. Bucket state lives in Redis so every API box agrees.`)
  yield emit({
    phase: 'setup',
    codeLine: 0,
    description:
      'Day 42 kept the bucket in a local variable. That works until you run two API boxes, and then each box enforces its own limit and the real limit is double what you promised.',
  })

  for (let tick = 0; tick < TICKS; tick++) {
    // refill first
    for (const c of clients) {
      c.tokens = Math.min(CAPACITY, c.tokens + REFILL_RATE)
      c.bursting = TRAFFIC[c.id][tick] > LIMIT
    }
    say('refill', `t=${tick}: +${REFILL_RATE} tokens to every bucket, capped at ${CAPACITY}.`)
    yield emit({
      phase: 'refill',
      tick,
      codeLine: 4,
      description: `Tick ${tick}. Refill is lazy — computed from elapsed time on read, not by a background job. No timer to run, no drift.`,
    })

    for (const c of clients) {
      const want = TRAFFIC[c.id][tick]
      if (want === 0) continue

      for (let r = 0; r < want; r++) {
        c.attempted++
        addOps(1)
        const ok = c.tokens >= 1
        if (ok) {
          c.tokens--
          c.allowed++
        } else {
          c.denied++
        }

        if (r === 0 || !ok) {
          say(ok ? 'allow' : 'deny', `${c.id}: ${ok ? 'allowed' : 'denied'} (${c.tokens.toFixed(0)} tokens left)`)
        }

        yield emit({
          phase: c.bursting ? 'burst' : 'steady',
          tick,
          active: c.id,
          codeLine: ok ? 7 : 6,
          redisOps: 1,
          totalOps: getOps(),
          description: ok
            ? `${c.id} spends a token. One Redis round-trip: read the bucket, write it back.`
            : `${c.id} is out of tokens. Denied. The bucket absorbed the first part of the burst and then stopped.`,
        })
      }
    }
  }

  const beta = clients.find(c => c.id === 'beta')!
  say('note', `beta attempted ${beta.attempted}, got ${beta.allowed} through.`)
  yield emit({
    phase: 'verdict',
    codeLine: null,
    totalOps: getOps(),
    verdict: {
      label: 'Token bucket',
      bucket: `${getOps()} Redis round-trips`,
      sliding: 'burst absorbed, average enforced',
      note: 'Bursts up to the capacity get through. Over a long enough window the average holds at the refill rate. One round-trip per request.',
    },
    description:
      'The bucket let beta spend its savings all at once, then made it wait. That is the behaviour we want for a public API: forgiving at the edges, strict in aggregate.',
  })
}

// ─── mode 2: sliding window counter ──────────────────────────────────────────

function* slidingRun(
  clients: Client[],
  _log: LogLine[],
  say: Say,
  emit: Emit,
  getOps: () => number,
  addOps: AddOps,
): Generator<TokenBucketV2Step> {
  say('note', `Sliding window: keep timestamps, evict anything older than ${WINDOW} ticks, count what's left.`)
  yield emit({
    phase: 'setup',
    codeLine: 0,
    description:
      'The suggestion was that this is stricter, and it is. There is no saved-up burst to spend, because there are no savings — only a count of what actually happened recently.',
  })

  for (let tick = 0; tick < TICKS; tick++) {
    for (const c of clients) {
      c.window = c.window.filter(t => t > tick - WINDOW)
      c.bursting = TRAFFIC[c.id][tick] > LIMIT
    }
    say('refill', `t=${tick}: evict timestamps older than t-${WINDOW}.`)
    yield emit({
      phase: 'refill',
      tick,
      codeLine: 4,
      description: `Tick ${tick}. Nothing accumulates. The window just slides forward and old requests fall out the back.`,
    })

    for (const c of clients) {
      const want = TRAFFIC[c.id][tick]
      if (want === 0) continue

      for (let r = 0; r < want; r++) {
        c.attempted++
        const ok = c.window.length < LIMIT
        // evict + count is one pipelined trip; the zadd on success is a second
        addOps(ok ? 2 : 1)
        if (ok) {
          c.window.push(tick)
          c.allowed++
        } else {
          c.denied++
        }

        if (r === 0 || !ok) {
          say(ok ? 'allow' : 'deny', `${c.id}: ${ok ? 'allowed' : 'denied'} (${c.window.length}/${LIMIT} in window)`)
        }

        yield emit({
          phase: c.bursting ? 'burst' : 'steady',
          tick,
          active: c.id,
          codeLine: ok ? 9 : 8,
          redisOps: ok ? 2 : 1,
          totalOps: getOps(),
          description: ok
            ? `${c.id} allowed. Two round-trips on success — one to evict and count, one to record. That is the price of precision.`
            : `${c.id} denied. The window is full and there is nothing saved up to spend.`,
        })
      }
    }
  }

  say('note', `Same traffic, ${getOps()} round-trips instead of the bucket's.`)
  yield emit({
    phase: 'verdict',
    codeLine: null,
    totalOps: getOps(),
    verdict: {
      label: 'Sliding window',
      bucket: `${getOps()} Redis round-trips`,
      sliding: 'tighter enforcement, no burst tolerance',
      note: 'Enforces the limit more exactly and stores a timestamp per request. More memory, more round-trips, less forgiving of legitimate spikes.',
    },
    description:
      'It is the better limiter if the number is a contract you cannot exceed. It is the worse limiter if a client with a legitimate spike is a customer you would like to keep.',
  })
}

// ─── mode 3: the outage ──────────────────────────────────────────────────────

function* outageRun(
  clients: Client[],
  _log: LogLine[],
  say: Say,
  emit: Emit,
  getOps: () => number,
  addOps: AddOps,
): Generator<TokenBucketV2Step> {
  say('note', 'Same token bucket. This time Redis stops answering in the middle of it.')
  yield emit({
    phase: 'setup',
    codeLine: 0,
    description:
      'Every question about a rate limiter eventually becomes a question about the store behind it. The limiter is now a dependency, and dependencies fail.',
  })

  // normal operation, ticks 0-2
  for (let tick = 0; tick < 3; tick++) {
    for (const c of clients) {
      c.tokens = Math.min(CAPACITY, c.tokens + REFILL_RATE)
      c.bursting = TRAFFIC[c.id][tick] > LIMIT
    }
    for (const c of clients) {
      const want = TRAFFIC[c.id][tick]
      if (want === 0) continue
      for (let r = 0; r < want; r++) {
        c.attempted++
        addOps(1)
        const ok = c.tokens >= 1
        if (ok) {
          c.tokens--
          c.allowed++
        } else c.denied++
        if (r === 0) say(ok ? 'allow' : 'deny', `${c.id}: ${ok ? 'allowed' : 'denied'}`)
      }
    }
    yield emit({
      phase: 'steady',
      tick,
      codeLine: 2,
      totalOps: getOps(),
      description: `Tick ${tick}. Everything normal. Read the bucket, decide, write it back.`,
    })
  }

  // outage
  say('outage', 'Redis connection refused. The limiter is blind.')
  yield emit({
    phase: 'partition',
    tick: 3,
    redis: 'down',
    codeLine: 3,
    description:
      'Redis is gone. Not slow — gone. The limiter has no idea how many tokens anyone has, and 10,000 requests a second are still arriving.',
  })

  yield emit({
    phase: 'partition',
    tick: 3,
    redis: 'down',
    codeLine: 5,
    description:
      'The except block is the entire design decision, compressed into one return statement. Everything above it is bookkeeping.',
  })

  // fail open
  const openClients = clone(clients)
  say('policy', 'FAIL OPEN — allow everything while the store is unreachable.')
  for (let tick = 3; tick < 6; tick++) {
    for (const c of openClients) {
      const want = TRAFFIC[c.id][tick]
      c.bursting = want > LIMIT
      c.attempted += want
      c.allowed += want
    }
    yield emit({
      phase: 'partition',
      tick,
      clients: clone(openClients),
      redis: 'down',
      policy: 'open',
      codeLine: 6,
      description:
        tick === 3
          ? 'Fail open: every request goes through, limits unenforced. The API stays up. For thirty seconds you are briefly over-serving.'
          : `Tick ${tick}. Still open, still unenforced. Whether this is fine depends entirely on what is behind the endpoint.`,
    })
  }

  const openTotal = openClients.reduce((s, c) => s + c.allowed, 0)
  say('note', `Fail open: ${openTotal} requests served, limit unenforced for 3 ticks.`)
  yield emit({
    phase: 'recover',
    tick: 6,
    clients: clone(openClients),
    redis: 'up',
    policy: 'open',
    codeLine: null,
    description:
      'Redis comes back. Buckets resume from whatever they held before the outage, which is stale, and within a tick or two nobody can tell it happened.',
  })

  // fail closed
  const closedClients = clone(clients)
  say('policy', 'FAIL CLOSED — deny everything while the store is unreachable.')
  for (let tick = 3; tick < 6; tick++) {
    for (const c of closedClients) {
      const want = TRAFFIC[c.id][tick]
      c.bursting = want > LIMIT
      c.attempted += want
      c.denied += want
    }
    yield emit({
      phase: 'partition',
      tick,
      clients: clone(closedClients),
      redis: 'down',
      policy: 'closed',
      codeLine: 6,
      description:
        tick === 3
          ? 'Fail closed: every request is rejected, including the well-behaved ones. Nobody exceeds their limit because nobody gets anything.'
          : `Tick ${tick}. Still closed. alpha never went over its limit once and is being turned away anyway.`,
    })
  }

  const closedDenied = closedClients.reduce((s, c) => s + c.denied, 0)
  say('note', `Fail closed: ${closedDenied} requests rejected, limit never exceeded.`)
  yield emit({
    phase: 'recover',
    tick: 6,
    clients: clone(closedClients),
    redis: 'up',
    policy: 'closed',
    codeLine: null,
    description:
      'Redis comes back and the outage is over, but the three ticks of rejected traffic are not recoverable. Those users saw errors.',
  })

  yield emit({
    phase: 'verdict',
    tick: 7,
    redis: 'up',
    policy: null,
    codeLine: null,
    verdict: {
      label: 'Failure policy',
      bucket: `fail open — ${openTotal} served, limit briefly exceeded`,
      sliding: `fail closed — ${closedDenied} rejected, limit held`,
      note: 'A public API usually fails open: a brief over-serve beats an outage. A billing, trading, or compliance endpoint fails closed, because exceeding the limit is the thing you are actually protecting against.',
    },
    description:
      'Neither one is the correct answer. The question is which failure you would rather explain afterwards, and you have to have picked before it happens — at 3am the code has already decided for you.',
  })
}
