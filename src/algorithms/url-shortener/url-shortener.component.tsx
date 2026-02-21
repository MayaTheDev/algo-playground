import { useMemo } from 'react'
import { Controls } from '../../components/controls.component'
import { useAlgoPlayer } from '../../hooks/use-algo-player.hook'
import { collectSteps } from '../../utils/array.utils'

type UrlShortenerStep = {
  active: 'client' | 'generator' | 'storage' | 'cache' | 'redirect' | 'analytics'
  mode: 'create' | 'serve'
  longUrl: string
  shortCode: string
  shortUrl: string
  cacheHit: boolean | null
  description: string
}

function* urlShortenerSteps(): Generator<UrlShortenerStep> {
  const longUrl = 'https://mayathedev.com/story/the-first-interview'
  const shortCode = 'mA7xQ2'
  const shortUrl = `maya.dev/${shortCode}`

  yield {
    active: 'client',
    mode: 'create',
    longUrl,
    shortCode,
    shortUrl,
    cacheHit: null,
    description: 'A client submits a long URL. The service needs a short code, persistent storage, and a redirect path back out.',
  }
  yield {
    active: 'generator',
    mode: 'create',
    longUrl,
    shortCode,
    shortUrl,
    cacheHit: null,
    description: 'Generate a unique base-62 code. In production, this is usually a distributed ID problem, not a random guess.',
  }
  yield {
    active: 'storage',
    mode: 'create',
    longUrl,
    shortCode,
    shortUrl,
    cacheHit: null,
    description: 'Persist the mapping { shortCode -> original URL }. Reads must be cheap because redirects dominate traffic.',
  }
  yield {
    active: 'client',
    mode: 'create',
    longUrl,
    shortCode,
    shortUrl,
    cacheHit: null,
    description: 'Return the short URL to the client. Creation is done; the high-volume path is serving redirects.',
  }
  yield {
    active: 'client',
    mode: 'serve',
    longUrl,
    shortCode,
    shortUrl,
    cacheHit: null,
    description: 'A visitor hits the short URL later. The redirect path starts by checking the hottest links in cache.',
  }
  yield {
    active: 'cache',
    mode: 'serve',
    longUrl,
    shortCode,
    shortUrl,
    cacheHit: false,
    description: 'Cache miss. Most systems still go here first because a tiny set of links absorbs most traffic.',
  }
  yield {
    active: 'storage',
    mode: 'serve',
    longUrl,
    shortCode,
    shortUrl,
    cacheHit: false,
    description: 'Look up the original URL in storage, then warm the cache for the next request.',
  }
  yield {
    active: 'redirect',
    mode: 'serve',
    longUrl,
    shortCode,
    shortUrl,
    cacheHit: true,
    description: 'Issue the redirect response. If analytics matter, route through the service instead of a fully cached permanent redirect.',
  }
  yield {
    active: 'analytics',
    mode: 'serve',
    longUrl,
    shortCode,
    shortUrl,
    cacheHit: true,
    description: 'Record the click asynchronously. Analytics should not sit directly on the critical redirect latency path.',
  }
}

const LEGEND = [
  { color: 'bg-emerald-400', label: 'active hop' },
  { color: 'bg-sky-400', label: 'request path' },
  { color: 'bg-amber-400', label: 'cache miss' },
]

const BLOCKS: Array<UrlShortenerStep['active']> = ['client', 'generator', 'storage', 'cache', 'redirect', 'analytics']
const LABELS: Record<UrlShortenerStep['active'], string> = {
  client: 'client',
  generator: 'id generator',
  storage: 'mapping store',
  cache: 'hot cache',
  redirect: 'redirect service',
  analytics: 'analytics',
}

function UrlShortenerView({ step }: { step: UrlShortenerStep }) {
  return (
    <div className="w-full max-w-4xl space-y-5">
      <div className="grid gap-3 md:grid-cols-6">
        {BLOCKS.map((block) => {
          const isActive = block === step.active
          const miss = block === 'cache' && step.cacheHit === false
          return (
            <div
              key={block}
              className={`border px-3 py-4 text-center font-mono text-xs ${
                isActive
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                  : miss
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400'
              }`}
            >
              {LABELS[block]}
            </div>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="border border-slate-800 bg-slate-950/40 p-4">
          <p className="mb-3 text-[10px] uppercase tracking-widest text-slate-600">create flow</p>
          <div className="space-y-2 font-mono text-sm">
            <div className="rounded border border-slate-800 bg-slate-900 p-3 text-slate-300">
              <span className="text-slate-500">original</span>
              <div className="mt-1 break-all text-emerald-300">{step.longUrl}</div>
            </div>
            <div className="rounded border border-slate-800 bg-slate-900 p-3 text-slate-300">
              <span className="text-slate-500">short code</span>
              <div className="mt-1 text-emerald-300">{step.shortCode}</div>
            </div>
            <div className="rounded border border-slate-800 bg-slate-900 p-3 text-slate-300">
              <span className="text-slate-500">short URL</span>
              <div className="mt-1 text-emerald-300">{step.shortUrl}</div>
            </div>
          </div>
        </div>

        <div className="border border-slate-800 bg-slate-950/40 p-4">
          <p className="mb-3 text-[10px] uppercase tracking-widest text-slate-600">serve flow</p>
          <div className="space-y-3 font-mono text-sm">
            <div className="rounded border border-slate-800 bg-slate-900 p-3 text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">request</span>
                <span className="text-sky-300">GET /{step.shortCode}</span>
              </div>
            </div>
            <div className="rounded border border-slate-800 bg-slate-900 p-3 text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">cache</span>
                <span className={step.cacheHit === false ? 'text-amber-300' : step.cacheHit ? 'text-emerald-300' : 'text-slate-500'}>
                  {step.cacheHit === null ? 'pending' : step.cacheHit ? 'hit' : 'miss'}
                </span>
              </div>
            </div>
            <div className="rounded border border-slate-800 bg-slate-900 p-3 text-slate-300">
              <span className="text-slate-500">redirect target</span>
              <div className="mt-1 break-all text-emerald-300">{step.longUrl}</div>
            </div>
            <div className="rounded border border-slate-800 bg-slate-900 p-3 text-slate-300">
              <span className="text-slate-500">response type</span>
              <div className="mt-1">{step.mode === 'serve' ? '302 through service to keep analytics visible' : 'create mapping'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function UrlShortener() {
  const steps = useMemo(() => collectSteps(urlShortenerSteps()), [])
  const player = useAlgoPlayer(steps)

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 p-4">
        <UrlShortenerView step={player.currentStep} />
      </div>
      <Controls player={player} stepDescription={player.currentStep.description} legend={LEGEND} />
    </div>
  )
}
