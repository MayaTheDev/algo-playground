export type TokenBucketStep = {
  tokens: number
  capacity: number
  refillRate: number
  time: number
  action: 'request' | 'refill' | 'idle'
  allowed: boolean | null
  description: string
}

export function* tokenBucketSteps(): Generator<TokenBucketStep> {
  const capacity = 5
  const refillRate = 1
  let tokens = 5
  let time = 0

  const emit = (action: TokenBucketStep['action'], allowed: boolean | null, description: string): TokenBucketStep => ({
    tokens,
    capacity,
    refillRate,
    time,
    action,
    allowed,
    description,
  })

  yield emit('idle', null, 'Token bucket starts full. Bursts are allowed because accumulated tokens can be spent all at once.')

  for (let burst = 0; burst < 6; burst++) {
    const allowed = tokens > 0
    if (allowed) tokens--
    yield emit('request', allowed, allowed ? 'Request allowed: spend one token.' : 'Bucket empty: deny the request until refill catches up.')
  }

  for (let tick = 0; tick < 4; tick++) {
    time++
    tokens = Math.min(capacity, tokens + refillRate)
    yield emit('refill', null, `Refill tick ${time}. Add ${refillRate} token${refillRate > 1 ? 's' : ''}, capped at bucket capacity.`)
  }

  for (let burst = 0; burst < 3; burst++) {
    const allowed = tokens > 0
    if (allowed) tokens--
    yield emit('request', allowed, allowed ? 'Burst traffic is allowed again because the bucket recovered.' : 'Still empty: even bursts need refill budget behind them.')
  }

  yield emit('idle', null, 'That is the whole tradeoff: strict enough to enforce an average rate, flexible enough to absorb short spikes.')
}
