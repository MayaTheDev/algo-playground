import { useEffect, useMemo, useState, type ReactNode } from 'react'

type GameMode = 'choice' | 'reflex' | 'sequence' | 'debug' | 'signal'

type ChoiceRound = {
  prompt: string
  options: [string, string]
  correct: 0 | 1
  note: string
}

type ReflexRound = {
  good: string[]
  bad: string[]
  target: number
}

type SequenceRound = {
  labels: string[]
}

type DebugRound = {
  prompt: string
  snippets: string[]
  bugIndex: number
  note: string
}

type SignalRound = {
  target: number
  label: string
  note: string
}

type StoryGameConfig =
  | {
      id: string
      day: number
      title: string
      subtitle: string
      mode: 'choice'
      rounds: ChoiceRound[]
    }
  | {
      id: string
      day: number
      title: string
      subtitle: string
      mode: 'reflex'
      rounds: ReflexRound[]
    }
  | {
      id: string
      day: number
      title: string
      subtitle: string
      mode: 'sequence'
      rounds: SequenceRound[]
    }
  | {
      id: string
      day: number
      title: string
      subtitle: string
      mode: 'debug'
      rounds: DebugRound[]
    }
  | {
      id: string
      day: number
      title: string
      subtitle: string
      mode: 'signal'
      rounds: SignalRound[]
    }

type StoryGameProps = {
  config: StoryGameConfig
}

const baseButton =
  'rounded border px-3 py-2 font-mono text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/40'

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function seededIndex(seed: string, max: number): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return h % max
}

function StatusBar({
  score,
  lives,
  round,
  total,
  onReset,
}: {
  score: number
  lives: number
  round: number
  total: number
  onReset: () => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-4 py-3">
      <div className="flex items-center gap-4 font-mono text-xs">
        <span className="text-emerald-400">score {score}</span>
        <span className="text-rose-400">focus {lives}</span>
        <span className="text-slate-500">
          round {Math.min(round + 1, total)}/{total}
        </span>
      </div>
      <button
        onClick={onReset}
        className="border border-slate-700 px-3 py-1 font-mono text-xs text-slate-400 transition-colors hover:border-slate-500 hover:text-slate-200"
      >
        restart
      </button>
    </div>
  )
}

function GameShell({
  config,
  score,
  lives,
  round,
  total,
  note,
  done,
  onReset,
  children,
}: {
  config: StoryGameConfig
  score: number
  lives: number
  round: number
  total: number
  note: string
  done: boolean
  onReset: () => void
  children: ReactNode
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto flex min-h-full max-w-4xl flex-col justify-center gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-600">
                day {config.day} mini-game
              </p>
              <h2 className="mt-1 font-mono text-lg font-semibold text-slate-100">
                {config.title}
              </h2>
            </div>
            <span className="rounded border border-emerald-800 bg-emerald-950/30 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-emerald-400">
              {config.mode}
            </span>
          </div>

          <div className="rounded border border-slate-800 bg-slate-950/60 p-4">
            <p className="font-mono text-xs leading-relaxed text-slate-400">{config.subtitle}</p>
          </div>

          {children}

          <div
            className={`rounded border px-4 py-3 font-mono text-xs leading-relaxed ${
              done
                ? 'border-emerald-700 bg-emerald-950/20 text-emerald-300'
                : lives <= 0
                  ? 'border-rose-800 bg-rose-950/20 text-rose-300'
                  : 'border-slate-800 bg-slate-900/40 text-slate-400'
            }`}
          >
            {note}
          </div>
        </div>
      </div>
      <StatusBar score={score} lives={lives} round={round} total={total} onReset={onReset} />
    </div>
  )
}

function ChoiceGame({ config }: { config: Extract<StoryGameConfig, { mode: 'choice' }> }) {
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [note, setNote] = useState('Choose the move that keeps Maya in the work.')
  const current = config.rounds[round]
  const done = round >= config.rounds.length

  const answer = (choice: 0 | 1) => {
    if (done || lives <= 0 || !current) return
    const correct = choice === current.correct
    setScore((s) => s + (correct ? 10 : 0))
    setLives((l) => l - (correct ? 0 : 1))
    setNote(current.note)
    setRound((r) => r + 1)
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') answer(0)
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') answer(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <GameShell
      config={config}
      score={score}
      lives={lives}
      round={round}
      total={config.rounds.length}
      note={done ? 'Run complete. The path is made from choices, not certainty.' : note}
      done={done}
      onReset={() => {
        setRound(0)
        setScore(0)
        setLives(3)
        setNote('Choose the move that keeps Maya in the work.')
      }}
    >
      {current && lives > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded border border-slate-800 bg-slate-900/60 p-4 md:col-span-2">
            <p className="font-mono text-sm text-slate-200">{current.prompt}</p>
          </div>
          {current.options.map((option, i) => (
            <button
              key={option}
              onClick={() => answer(i as 0 | 1)}
              className={`${baseButton} border-slate-700 bg-slate-950/60 text-left text-slate-300 hover:border-emerald-600 hover:bg-emerald-950/20 hover:text-emerald-300`}
            >
              <span className="mb-2 block text-[10px] uppercase tracking-widest text-slate-600">
                {i === 0 ? 'A / left' : 'D / right'}
              </span>
              {option}
            </button>
          ))}
        </div>
      ) : (
        <EndCard won={done && lives > 0} />
      )}
    </GameShell>
  )
}

function ReflexGame({ config }: { config: Extract<StoryGameConfig, { mode: 'reflex' }> }) {
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [hits, setHits] = useState(0)
  const [note, setNote] = useState('Click the useful signals. Avoid the distractions.')
  const current = config.rounds[round]
  const done = round >= config.rounds.length

  const tiles = useMemo(() => {
    if (!current) return []
    const merged = [
      ...current.good.map((label) => ({ label, good: true })),
      ...current.bad.map((label) => ({ label, good: false })),
    ]
    return merged
      .map((tile) => ({ ...tile, order: seededIndex(`${config.id}-${round}-${tile.label}`, 997) }))
      .sort((a, b) => a.order - b.order)
  }, [config.id, current, round])

  const choose = (good: boolean, label: string) => {
    if (!current || done || lives <= 0) return
    if (good) {
      const nextHits = hits + 1
      setHits(nextHits)
      setScore((s) => s + 5)
      setNote(`Captured signal: ${label}.`)
      if (nextHits >= current.target) {
        setRound((r) => r + 1)
        setHits(0)
        setScore((s) => s + 10)
      }
    } else {
      setLives((l) => l - 1)
      setNote(`Distraction hit: ${label}. Refocus.`)
    }
  }

  return (
    <GameShell
      config={config}
      score={score}
      lives={lives}
      round={round}
      total={config.rounds.length}
      note={done ? 'Cleared. You kept enough signal to keep building.' : note}
      done={done}
      onReset={() => {
        setRound(0)
        setScore(0)
        setLives(3)
        setHits(0)
        setNote('Click the useful signals. Avoid the distractions.')
      }}
    >
      {current && lives > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded border border-slate-800 bg-slate-900/50 px-4 py-3 font-mono text-xs">
            <span className="text-slate-400">target signals</span>
            <span className="text-emerald-400">
              {hits}/{current.target}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {tiles.map((tile) => (
              <button
                key={tile.label}
                onClick={() => choose(tile.good, tile.label)}
                className={`${baseButton} min-h-20 ${
                  tile.good
                    ? 'border-slate-700 bg-slate-950 text-slate-300 hover:border-emerald-600 hover:text-emerald-300'
                    : 'border-slate-800 bg-slate-900/40 text-slate-500 hover:border-rose-700 hover:text-rose-300'
                }`}
              >
                {tile.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <EndCard won={done && lives > 0} />
      )}
    </GameShell>
  )
}

function SequenceGame({ config }: { config: Extract<StoryGameConfig, { mode: 'sequence' }> }) {
  const [round, setRound] = useState(0)
  const [cursor, setCursor] = useState(0)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [note, setNote] = useState('Repeat the build sequence in order.')
  const current = config.rounds[round]
  const done = round >= config.rounds.length
  const options = useMemo(() => {
    if (!current) return []
    return [...current.labels].sort(
      (a, b) => seededIndex(`${round}-${b}`, 1000) - seededIndex(`${round}-${a}`, 1000),
    )
  }, [current, round])

  const choose = (label: string) => {
    if (!current || done || lives <= 0) return
    if (label === current.labels[cursor]) {
      const nextCursor = cursor + 1
      setCursor(nextCursor)
      setScore((s) => s + 5)
      setNote(`Correct: ${label}.`)
      if (nextCursor >= current.labels.length) {
        setRound((r) => r + 1)
        setCursor(0)
        setScore((s) => s + 10)
        setNote('Sequence locked. Next build step.')
      }
    } else {
      setLives((l) => l - 1)
      setNote(`Not yet: ${label}. Follow the order.`)
    }
  }

  return (
    <GameShell
      config={config}
      score={score}
      lives={lives}
      round={round}
      total={config.rounds.length}
      note={done ? 'Sequence complete. The work has a shape now.' : note}
      done={done}
      onReset={() => {
        setRound(0)
        setCursor(0)
        setScore(0)
        setLives(3)
        setNote('Repeat the build sequence in order.')
      }}
    >
      {current && lives > 0 ? (
        <div className="space-y-4">
          <div className="rounded border border-slate-800 bg-slate-950/60 p-4">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-slate-600">
              next target
            </p>
            <p className="font-mono text-sm text-emerald-300">{current.labels[cursor]}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {options.map((label) => (
              <button
                key={label}
                onClick={() => choose(label)}
                className={`${baseButton} border-slate-700 bg-slate-900/60 text-slate-300 hover:border-emerald-600 hover:text-emerald-300`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <EndCard won={done && lives > 0} />
      )}
    </GameShell>
  )
}

function DebugGame({ config }: { config: Extract<StoryGameConfig, { mode: 'debug' }> }) {
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [note, setNote] = useState('Find the suspicious line.')
  const current = config.rounds[round]
  const done = round >= config.rounds.length

  const choose = (index: number) => {
    if (!current || done || lives <= 0) return
    if (index === current.bugIndex) {
      setScore((s) => s + 10)
      setNote(current.note)
      setRound((r) => r + 1)
    } else {
      setLives((l) => l - 1)
      setNote('That line is innocent. Keep scanning.')
    }
  }

  return (
    <GameShell
      config={config}
      score={score}
      lives={lives}
      round={round}
      total={config.rounds.length}
      note={done ? 'Debug pass complete. The tiny thing mattered.' : note}
      done={done}
      onReset={() => {
        setRound(0)
        setScore(0)
        setLives(3)
        setNote('Find the suspicious line.')
      }}
    >
      {current && lives > 0 ? (
        <div className="space-y-3">
          <div className="rounded border border-slate-800 bg-slate-900/60 p-4">
            <p className="font-mono text-sm text-slate-200">{current.prompt}</p>
          </div>
          <div className="space-y-2">
            {current.snippets.map((snippet, index) => (
              <button
                key={snippet}
                onClick={() => choose(index)}
                className={`${baseButton} block w-full border-slate-800 bg-slate-950/80 text-left text-slate-300 hover:border-amber-600 hover:text-amber-300`}
              >
                <span className="mr-3 text-slate-600">{index + 1}</span>
                {snippet}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <EndCard won={done && lives > 0} />
      )}
    </GameShell>
  )
}

function SignalGame({ config }: { config: Extract<StoryGameConfig, { mode: 'signal' }> }) {
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [value, setValue] = useState(50)
  const [note, setNote] = useState('Tune the signal until it lines up.')
  const current = config.rounds[round]
  const done = round >= config.rounds.length
  const drift = current ? Math.abs(value - current.target) : 100
  const aligned = drift <= 4

  const lock = () => {
    if (!current || done || lives <= 0) return
    if (aligned) {
      setScore((s) => s + 15)
      setNote(current.note)
      setRound((r) => r + 1)
      setValue(50)
    } else {
      setLives((l) => l - 1)
      setNote('The signal slips. Tune closer before locking.')
    }
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') setValue((v) => clamp(v - 2, 0, 100))
      if (event.key === 'ArrowRight') setValue((v) => clamp(v + 2, 0, 100))
      if (event.key === 'Enter') lock()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <GameShell
      config={config}
      score={score}
      lives={lives}
      round={round}
      total={config.rounds.length}
      note={done ? 'Signal resolved. Some things only become clear when they align.' : note}
      done={done}
      onReset={() => {
        setRound(0)
        setScore(0)
        setLives(3)
        setValue(50)
        setNote('Tune the signal until it lines up.')
      }}
    >
      {current && lives > 0 ? (
        <div className="space-y-4 rounded border border-slate-800 bg-slate-950/70 p-5">
          <div className="flex items-center justify-between gap-3 font-mono text-xs">
            <span className="text-slate-400">{current.label}</span>
            <span className={aligned ? 'text-emerald-400' : 'text-slate-600'}>
              drift {drift}
            </span>
          </div>
          <div className="relative h-20 rounded border border-slate-800 bg-slate-900">
            <div
              className="absolute top-0 h-full w-px bg-emerald-500"
              style={{ left: `${current.target}%` }}
            />
            <div
              className={`absolute top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all ${
                aligned
                  ? 'border-emerald-400 bg-emerald-400/20 shadow-[0_0_30px_rgba(52,211,153,0.35)]'
                  : 'border-slate-600 bg-slate-700/40'
              }`}
              style={{ left: `${value}%` }}
            />
          </div>
          <input
            aria-label="signal tuning"
            type="range"
            min={0}
            max={100}
            value={value}
            onChange={(event) => setValue(Number(event.target.value))}
            className="w-full accent-emerald-500"
          />
          <button
            onClick={lock}
            className={`${baseButton} w-full border-emerald-700 bg-emerald-950/20 text-emerald-300 hover:bg-emerald-900/30`}
          >
            lock signal
          </button>
        </div>
      ) : (
        <EndCard won={done && lives > 0} />
      )}
    </GameShell>
  )
}

function EndCard({ won }: { won: boolean }) {
  return (
    <div
      className={`rounded border p-8 text-center font-mono ${
        won
          ? 'border-emerald-700 bg-emerald-950/20 text-emerald-300'
          : 'border-rose-800 bg-rose-950/20 text-rose-300'
      }`}
    >
      {won ? 'cleared' : 'focus depleted'}
    </div>
  )
}

export function StoryGame({ config }: StoryGameProps) {
  if (config.mode === 'choice') return <ChoiceGame config={config} />
  if (config.mode === 'reflex') return <ReflexGame config={config} />
  if (config.mode === 'sequence') return <SequenceGame config={config} />
  if (config.mode === 'debug') return <DebugGame config={config} />
  return <SignalGame config={config} />
}

const choice = (
  id: string,
  day: number,
  title: string,
  subtitle: string,
  rounds: ChoiceRound[],
): StoryGameConfig => ({ id, day, title, subtitle, mode: 'choice', rounds })

const reflex = (
  id: string,
  day: number,
  title: string,
  subtitle: string,
  rounds: ReflexRound[],
): StoryGameConfig => ({ id, day, title, subtitle, mode: 'reflex', rounds })

const sequence = (
  id: string,
  day: number,
  title: string,
  subtitle: string,
  rounds: SequenceRound[],
): StoryGameConfig => ({ id, day, title, subtitle, mode: 'sequence', rounds })

const debug = (
  id: string,
  day: number,
  title: string,
  subtitle: string,
  rounds: DebugRound[],
): StoryGameConfig => ({ id, day, title, subtitle, mode: 'debug', rounds })

const signal = (
  id: string,
  day: number,
  title: string,
  subtitle: string,
  rounds: SignalRound[],
): StoryGameConfig => ({ id, day, title, subtitle, mode: 'signal', rounds })

export const STORY_GAME_CONFIGS = {
  'day-1-game': choice('day-1-game', 1, 'Path Splitter', 'Choose the tradeoff that makes the 90-day run durable.', [
    { prompt: 'A flashy demo promises quick applause.', options: ['ship it without understanding', 'slow down and explain the core'], correct: 1, note: 'Depth wins the first fork.' },
    { prompt: 'A shortcut saves an hour but hides the cost.', options: ['take the shortcut', 'write the cost down'], correct: 1, note: 'The cost is part of the decision.' },
    { prompt: 'The feed says everyone else is faster.', options: ['copy the feed', 'close it and start the problem'], correct: 1, note: 'The path is chosen again.' },
  ]),
  'day-2-game': choice('day-2-game', 2, 'Durable Path', 'Stay on Path B long enough for the quiet work to count.', [
    { prompt: 'Speed feels like progress.', options: ['chase speed', 'choose durable skill'], correct: 1, note: 'Durable skill compounds.' },
    { prompt: 'The AI writes an answer you cannot explain.', options: ['paste it', 'trace it by hand'], correct: 1, note: 'Explanation is the win condition.' },
    { prompt: 'The hard part looks boring.', options: ['skip it', 'practice it'], correct: 1, note: 'Boring is often load-bearing.' },
  ]),
  'day-3-game': reflex('day-3-game', 3, 'Complexity Dodge', 'Catch honest runtime signals. Avoid vague familiarity.', [
    { good: ['O(n)', 'dominant loop', 'input size'], bad: ['vibes', 'looks fast', 'probably fine'], target: 3 },
    { good: ['count ops', 'trace loop', 'scale test'], bad: ['memorize', 'guess', 'handwave'], target: 3 },
  ]),
  'day-4-game': sequence('day-4-game', 4, 'Flashlight Checklist', 'Rebuild the Big-O checklist in the right order.', [
    { labels: ['input size', 'dominant operation', 'repeated work', 'store results', 'tradeoff'] },
    { labels: ['measure', 'compare', 'simplify', 'explain'] },
  ]),
  'day-5-game': choice('day-5-game', 5, 'Inbox Defense', 'Handle the DM without losing the thread of the work.', [
    { prompt: 'Founder DM arrives mid-problem.', options: ['open and spiral', 'park it and finish'], correct: 1, note: 'The DM can wait.' },
    { prompt: 'The role sounds exciting.', options: ['abandon the plan', 'answer from strength later'], correct: 1, note: 'Later is a valid move.' },
    { prompt: 'The sliding window finally clicks.', options: ['write the invariant', 'rush onward'], correct: 0, note: 'The invariant is the proof.' },
  ]),
  'day-6-game': reflex('day-6-game', 6, 'Recursive Avalanche', 'Stop duplicate calls before the stack collapses.', [
    { good: ['memoize climb(3)', 'cache climb(2)', 'base case'], bad: ['call again', 'n=45 brute force', 'fan noise'], target: 3 },
    { good: ['reuse result', 'bottom-up table', 'O(n)'], bad: ['exponential tree', 'freeze', 'duplicate work'], target: 3 },
  ]),
  'day-7-game': sequence('day-7-game', 7, 'The Notebook', 'Put the memoization notebook back together.', [
    { labels: ['ask subproblem', 'check notebook', 'compute once', 'write result', 'return cached'] },
    { labels: ['base case', 'memo hit', 'recursive step', 'save answer'] },
  ]),
  'day-9-game': reflex('day-9-game', 9, 'Hash Map Grab', 'Catch complements. Ignore brute force bait.', [
    { good: ['target - x', 'seen map', 'O(n)'], bad: ['nested loop', 'rescan', 'guess pair'], target: 3 },
    { good: ['store index', 'lookup complement', 'return pair'], bad: ['sort first', 'lose index', 'try all'], target: 3 },
  ]),
  'day-10-game': sequence('day-10-game', 10, 'Bracket Lock', 'Match the editor brackets without losing the stack.', [
    { labels: ['push (', 'push [', 'pop ]', 'pop )'] },
    { labels: ['open brace', 'push stack', 'closing brace', 'compare top', 'empty stack'] },
  ]),
  'day-11-game': choice('day-11-game', 11, 'Meetup Nerve', 'Cross the room without pretending confidence is required.', [
    { prompt: 'The meetup is louder than expected.', options: ['leave immediately', 'stand still for one minute'], correct: 1, note: 'One minute is enough to stay.' },
    { prompt: 'Someone asks what you build.', options: ['deflect', 'say the true small version'], correct: 1, note: 'Small and true works.' },
    { prompt: 'The conversation gets technical.', options: ['fake certainty', 'ask the next question'], correct: 1, note: 'Questions keep the door open.' },
  ]),
  'day-12-game': sequence('day-12-game', 12, 'Seed Sketch', 'Grow the first project sketch from a rough idea.', [
    { labels: ['write problem', 'draw screen', 'name feature', 'make repo note'] },
    { labels: ['small scope', 'first interaction', 'save idea'] },
  ]),
  'day-13-game': signal('day-13-game', 13, 'Cursor Thaw', 'Tune the cursor out of the blank-page freeze.', [
    { target: 28, label: 'first sentence', note: 'One honest sentence appears.' },
    { target: 63, label: 'first function', note: 'The cursor moves because the scope got smaller.' },
    { target: 47, label: 'first commit thought', note: 'The page is no longer empty.' },
  ]),
  'day-14-game': sequence('day-14-game', 14, 'Git Init Run', 'Run the tiny command sequence that turns a folder into a project.', [
    { labels: ['mkdir playground', 'git init', 'create README', 'first commit'] },
    { labels: ['make branch', 'write code', 'git status', 'commit'] },
  ]),
  'day-15-game': debug('day-15-game', 15, 'One Character Hunt', 'Find the single character that breaks the whole run.', [
    { prompt: 'Which line has the bug?', snippets: ['const next = items.map(fn)', 'if (ready) run()', 'return { name: value; }', 'setCount(count + 1)'], bugIndex: 2, note: 'Semicolon inside the object. One character can stop everything.' },
    { prompt: 'Find the mismatch.', snippets: ['array[i] = value', 'while (left < right)', 'stack.pop))', 'return result'], bugIndex: 2, note: 'Extra parenthesis found.' },
    { prompt: 'Spot the silent typo.', snippets: ['const length = list.length', 'if (cache.has(key))', 'return cahce.get(key)', 'cache.set(key, value)'], bugIndex: 2, note: 'The cache was misspelled.' },
  ]),
  'day-16-game': sequence('day-16-game', 16, 'First Push', 'Push the public repo without skipping a step.', [
    { labels: ['git status', 'git add .', 'git commit', 'git remote add', 'git push'] },
    { labels: ['refresh GitHub', 'check files', 'copy link'] },
  ]),
  'day-17-game': reflex('day-17-game', 17, 'Invisible Graph', 'Catch visible nodes and edges before the idea disappears.', [
    { good: ['node', 'edge', 'label'], bad: ['invisible work', 'private tab', 'no screenshot'], target: 3 },
    { good: ['draw graph', 'animate traversal', 'share link'], bad: ['hide it', 'overthink it', 'delete draft'], target: 3 },
  ]),
  'day-18-game': choice('day-18-game', 18, 'Algorithm Lens', 'Turn an abstract algorithm into something someone can see.', [
    { prompt: 'The algorithm is only in your head.', options: ['write more prose', 'make the state visible'], correct: 1, note: 'State makes the invisible inspectable.' },
    { prompt: 'The animation is confusing.', options: ['add labels', 'ship mystery'], correct: 0, note: 'Labels are part of the interface.' },
    { prompt: 'A step changes too quickly.', options: ['slow it down', 'hide the transition'], correct: 0, note: 'Understanding needs pacing.' },
  ]),
  'day-19-game': reflex('day-19-game', 19, 'Localhost Runner', 'Collect green dev-server signals. Dodge the broken page states.', [
    { good: ['200 OK', 'hot reload', 'localhost:5173'], bad: ['404', 'CORS', 'blank page'], target: 3 },
    { good: ['console clean', 'component mounted', 'CSS loaded'], bad: ['red stack', 'missing import', 'port busy'], target: 3 },
  ]),
  'day-20-game': choice('day-20-game', 20, 'Zero Visitors', 'Balance analytics temptation against actual shipping.', [
    { prompt: 'Analytics says zero.', options: ['refresh 20 times', 'improve one screen'], correct: 1, note: 'The screen can change. The number cannot be forced.' },
    { prompt: 'A tiny spike appears.', options: ['spiral over source', 'write down what changed'], correct: 1, note: 'Observation beats obsession.' },
    { prompt: 'No one comments.', options: ['stop building', 'ship the next clear improvement'], correct: 1, note: 'No audience is still a valid workday.' },
  ]),
  'day-29-game': choice('day-29-game', 29, 'Nelly Reply', 'Answer the message without giving away your center.', [
    { prompt: 'Nelly finally replies.', options: ['perform confidence', 'answer plainly'], correct: 1, note: 'Plain is stronger.' },
    { prompt: 'The old fear shows up.', options: ['let it drive', 'notice it and continue'], correct: 1, note: 'Fear can ride along.' },
    { prompt: 'The conversation opens a door.', options: ['rush through', 'ask one grounded question'], correct: 1, note: 'Grounded questions keep balance.' },
  ]),
  'day-38-game': reflex('day-38-game', 38, 'Dolores Park Battery', 'Collect enough connection without draining the whole social battery.', [
    { good: ['bench reset', 'honest laugh', 'sun patch'], bad: ['performing', 'comparison spiral', 'too loud'], target: 3 },
    { good: ['small talk', 'shared snack', 'walk home'], bad: ['overstay', 'phone spiral', 'fake ease'], target: 3 },
  ]),
  'day-50-game': signal('day-50-game', 50, 'Signal Loop', 'Tune memory fragments until the signal resolves.', [
    { target: 22, label: 'train memory', note: 'The first fragment lines up.' },
    { target: 71, label: 'whiteboard handwriting', note: 'The loop gets quieter.' },
    { target: 50, label: 'Leo', note: 'Named once. Not explained.' },
  ]),
} satisfies Record<string, StoryGameConfig>

export type StoryGameId = keyof typeof STORY_GAME_CONFIGS

export function createStoryGame(id: StoryGameId) {
  return function ConfiguredStoryGame() {
    return <StoryGame config={STORY_GAME_CONFIGS[id]} />
  }
}
