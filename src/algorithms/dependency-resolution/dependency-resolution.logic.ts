/**
 * Semver range resolution and the lockfile — Day 74.
 *
 * `npm install` does not install the version in your `package.json`. It installs
 * the highest version that your RANGE admits — and a range is a standing
 * instruction to accept code that did not exist when you wrote it.
 *
 * `^1.14.0` does not mean "1.14.0". It means "anything from 1.14.0 up to, but not
 * including, 2.0.0, and please pick the newest." On 30 March 2026 the newest
 * thing in that window was a compromised release published ninety minutes
 * earlier.
 *
 * Three runs over the same five dependency specs:
 *   ranges   — what each range admits, against a clean registry
 *   attack   — the same ranges, after two poisoned versions are published
 *   lockfile — the same ranges, with a committed package-lock.json
 *
 * The lesson that surprised me: `~` does not save you, and the caret on a 0.x
 * version does not either. Only the lockfile does.
 */

export type ResolveMode = 'ranges' | 'attack' | 'lockfile'

export type Version = {
  raw: string
  major: number
  minor: number
  patch: number
  /** published during the compromise window */
  poisoned: boolean
  /** minutes after 17:21 PDT, for the timeline; null = published long before */
  publishedAt: string | null
}

const v = (raw: string, poisoned = false, publishedAt: string | null = null): Version => {
  const [major, minor, patch] = raw.split('.').map(Number)
  return { raw, major, minor, patch, poisoned, publishedAt }
}

/** the registry as it stood before 17:21 PDT on 30 March */
export const CLEAN_REGISTRY: Version[] = [
  v('0.30.2'),
  v('0.30.3'),
  v('1.13.9'),
  v('1.14.0'),
]

/** the two releases the attacker published, one per release line */
export const POISONED: Version[] = [
  v('0.30.4', true, '17:21 PDT'),
  v('1.14.1', true, '17:21 PDT'),
]

export const ATTACK_REGISTRY: Version[] = [...CLEAN_REGISTRY, ...POISONED].sort(compareVersions)

export function compareVersions(a: Version, b: Version): number {
  return a.major - b.major || a.minor - b.minor || a.patch - b.patch
}

export type RangeKind = 'caret' | 'caret-zero' | 'tilde' | 'exact' | 'star'

export type Spec = {
  /** what appears in package.json */
  range: string
  kind: RangeKind
  /** the version pinned in package-lock.json, if any */
  locked: string | null
  label: string
}

export const SPECS: Spec[] = [
  { range: '^1.14.0', kind: 'caret', locked: '1.14.0', label: 'caret — the npm default' },
  { range: '~1.14.0', kind: 'tilde', locked: '1.14.0', label: 'tilde — "patches only"' },
  { range: '1.14.0', kind: 'exact', locked: '1.14.0', label: 'exact pin' },
  { range: '^0.30.2', kind: 'caret-zero', locked: '0.30.2', label: 'caret on a 0.x — the legacy line' },
  { range: '*', kind: 'star', locked: '1.14.0', label: 'anything at all' },
]

/**
 * Does `version` satisfy `spec`?
 *
 * Caret allows changes that do not modify the leftmost non-zero component —
 * which is why ^1.x permits minor bumps and ^0.30.x permits only patches.
 * Tilde allows patch-level changes. Both of those still admit a brand-new
 * release, which is the entire problem.
 */
export function satisfies(version: Version, spec: Spec): boolean {
  const [bMajor, bMinor, bPatch] = spec.range.replace(/^[\^~]/, '').split('.').map(Number)

  switch (spec.kind) {
    case 'star':
      return true
    case 'exact':
      return version.major === bMajor && version.minor === bMinor && version.patch === bPatch
    case 'tilde':
      // >=b <b.(minor+1).0
      if (version.major !== bMajor || version.minor !== bMinor) return false
      return version.patch >= bPatch
    case 'caret':
      // leftmost non-zero is major: >=b <(major+1).0.0
      if (version.major !== bMajor) return false
      if (version.minor !== bMinor) return version.minor > bMinor
      return version.patch >= bPatch
    case 'caret-zero':
      // leftmost non-zero is minor: >=b <0.(minor+1).0 — patches only
      if (version.major !== bMajor || version.minor !== bMinor) return false
      return version.patch >= bPatch
  }
}

export type Resolution = {
  spec: Spec
  /** every version the range admits */
  admitted: string[]
  /** the one npm actually installs — highest admitted */
  chosen: string | null
  poisoned: boolean
  /** was the choice forced by the lockfile rather than the range */
  fromLockfile: boolean
  /** short explanation of the window */
  window: string
}

export function resolve(
  spec: Spec,
  registry: Version[],
  useLockfile: boolean,
): Resolution {
  const admitted = registry.filter(ver => satisfies(ver, spec)).sort(compareVersions)
  const highest = admitted.length ? admitted.reduce((a, b) => (compareVersions(a, b) > 0 ? a : b)) : null

  if (useLockfile && spec.locked) {
    const pinned = registry.find(ver => ver.raw === spec.locked) ?? null
    return {
      spec,
      admitted: admitted.map(a => a.raw),
      chosen: pinned?.raw ?? spec.locked,
      poisoned: pinned?.poisoned ?? false,
      fromLockfile: true,
      window: windowFor(spec),
    }
  }

  return {
    spec,
    admitted: admitted.map(a => a.raw),
    chosen: highest?.raw ?? null,
    poisoned: highest?.poisoned ?? false,
    fromLockfile: false,
    window: windowFor(spec),
  }
}

function windowFor(spec: Spec): string {
  switch (spec.kind) {
    case 'caret':
      return '>=1.14.0 <2.0.0'
    case 'tilde':
      return '>=1.14.0 <1.15.0'
    case 'exact':
      return '=1.14.0'
    case 'caret-zero':
      return '>=0.30.2 <0.31.0'
    case 'star':
      return 'any version, forever'
  }
}

export type LogKind = 'resolve' | 'safe' | 'poison' | 'lock' | 'note'

export type LogLine = { kind: LogKind; text: string }

export type Verdict = {
  label: string
  headline: string
  detail: string
  note: string
}

export type ResolveStep = {
  mode: ResolveMode
  registry: Version[]
  /** resolutions computed so far */
  rows: Resolution[]
  /** the spec currently being resolved */
  current: Spec | null
  /** versions highlighted in the registry strip */
  highlight: string[]
  codeLine: number | null
  poisonedCount: number
  verdict: Verdict | null
  log: LogLine[]
  phase: 'setup' | 'publish' | 'resolve' | 'verdict'
  description: string
}

export const MODE_LABELS: Record<ResolveMode, string> = {
  ranges: 'What a range admits',
  attack: 'The window',
  lockfile: 'With a lockfile',
}

export const CODE: Record<ResolveMode, string[]> = {
  ranges: [
    '// package.json',
    '"dependencies": {',
    '  "axios": "^1.14.0"',
    '}',
    '',
    '// this is not a version.',
    '// it is a standing instruction to',
    '// accept code that does not exist yet.',
  ],
  attack: [
    '$ npm install',
    '',
    '// 1. read the RANGE from package.json',
    '// 2. ask the registry what exists now',
    '// 3. pick the highest match',
    '// 4. run its postinstall script',
    '',
    '// nothing in step 3 asks you.',
  ],
  lockfile: [
    '// package-lock.json',
    '"axios": {',
    '  "version": "1.14.0",',
    '  "integrity": "sha512-..."',
    '}',
    '',
    '// exact version + content hash.',
    '// npm ci installs ONLY this.',
    '// a tampered tarball fails the hash.',
  ],
}

// ─── generator ───────────────────────────────────────────────────────────────

export function* dependencyResolutionSteps(mode: ResolveMode): Generator<ResolveStep> {
  const useLockfile = mode === 'lockfile'
  const registry: Version[] = mode === 'ranges' ? [...CLEAN_REGISTRY] : [...CLEAN_REGISTRY]
  const rows: Resolution[] = []
  const log: LogLine[] = []

  const say = (kind: LogKind, text: string) => {
    log.push({ kind, text })
    if (log.length > 9) log.shift()
  }

  const emit = (
    partial: Partial<ResolveStep> & { description: string; phase: ResolveStep['phase'] },
  ): ResolveStep => ({
    mode,
    registry: [...registry].sort(compareVersions),
    rows: rows.map(r => ({ ...r })),
    current: null,
    highlight: [],
    codeLine: null,
    poisonedCount: rows.filter(r => r.poisoned).length,
    verdict: null,
    log: [...log],
    ...partial,
  })

  say('note', `registry holds ${registry.length} published versions`)
  yield emit({
    phase: 'setup',
    codeLine: mode === 'lockfile' ? 2 : 0,
    description:
      mode === 'ranges'
        ? 'Four published versions, and five different ways of asking for one. Each row in package.json is a range, not a version.'
        : mode === 'attack'
          ? 'The registry at 5:00 PM on 30 March. Nothing is wrong yet. The same five dependency specs are about to be resolved.'
          : 'Same registry, same five specs — but this project has a committed package-lock.json, and that changes which question npm asks.',
  })

  // ── the attack and lockfile modes publish the poisoned versions ───────────
  if (mode !== 'ranges') {
    registry.push(...POISONED)
    say('poison', `17:21 PDT — 1.14.1 and 0.30.4 published from a stolen account`)
    yield emit({
      phase: 'publish',
      highlight: POISONED.map(p => p.raw),
      codeLine: mode === 'lockfile' ? 3 : 3,
      description:
        'At 5:21 PM two releases appear — one on the current line, one on the legacy line to catch anybody still pinned to 0.x. Both carry a postinstall hook. Nothing about them looks unusual to the registry, because nothing about them is unusual: a maintainer published them.',
    })
  }

  // ── resolve each spec ─────────────────────────────────────────────────────
  for (const spec of SPECS) {
    const row = resolve(spec, registry, useLockfile)
    rows.push(row)

    const kind: LogKind = row.poisoned ? 'poison' : row.fromLockfile ? 'lock' : 'safe'
    say(
      kind,
      row.fromLockfile
        ? `"${spec.range}" → lockfile says ${row.chosen}`
        : `"${spec.range}" admits ${row.admitted.length} → installs ${row.chosen}${row.poisoned ? '  ⚠ POISONED' : ''}`,
    )

    yield emit({
      phase: 'resolve',
      current: spec,
      highlight: row.admitted,
      codeLine: mode === 'lockfile' ? 2 : 4,
      description: row.fromLockfile
        ? `The range "${spec.range}" still admits ${row.admitted.length} version${row.admitted.length === 1 ? '' : 's'} — ${row.admitted.join(', ')}. npm never evaluates that. The lockfile names ${row.chosen} and an integrity hash, so that is what gets installed.`
        : row.poisoned
          ? `"${spec.range}" means ${row.window}. That window now contains ${row.chosen}, published ninety minutes ago, and it is the highest match — so it wins. This resolution is correct. The range did exactly what it was written to do.`
          : `"${spec.range}" means ${row.window} — ${row.admitted.length} candidate${row.admitted.length === 1 ? '' : 's'} (${row.admitted.join(', ')}). The highest is ${row.chosen}.`,
    })
  }

  // ── verdict ───────────────────────────────────────────────────────────────
  const poisonedCount = rows.filter(r => r.poisoned).length

  const verdict: Verdict =
    mode === 'ranges'
      ? {
          label: 'Five specs, five windows',
          headline: `${rows.filter(r => r.admitted.length > 1).length} of ${rows.length} accept more than one version`,
          detail: 'and all of them accept versions that do not exist yet',
          note: 'A range is the part of your dependency list you did not write. `^` is the npm default, so most projects carry it everywhere without ever choosing it. Nothing here is a mistake — it is how you get patches without editing files. It is also how you get whatever else ships in that window.',
        }
      : mode === 'attack'
        ? {
            label: 'Three hours',
            headline: `${poisonedCount} of ${rows.length} specs install the compromised release`,
            detail: 'including the one that says "patches only"',
            note: 'The tilde is the surprise. `~1.14.0` permits patch bumps, and 1.14.1 IS a patch bump — so "conservative" semver walks straight in. `^0.30.2` falls the same way, which is exactly why the attacker published on the legacy line too. Only the exact pin survives, and almost nobody writes exact pins by hand.',
          }
        : {
            label: 'The file nobody reads',
            headline: `${poisonedCount} of ${rows.length} specs install the compromised release`,
            detail: 'every range resolved to its pinned version instead',
            note: 'The lockfile is not build noise. It is an exact manifest — version plus a sha512 of the tarball — and it is the only thing in this entire picture that declines a version the range would otherwise accept. Commit it. Use `npm ci` in CI, which fails rather than silently updating. The integrity hash means a tampered tarball at the same version number is rejected too.',
          }

  yield emit({
    phase: 'verdict',
    codeLine: mode === 'lockfile' ? 8 : 7,
    verdict,
    description:
      mode === 'lockfile'
        ? 'Same package.json. Same registry. Same attack. The difference is one committed file.'
        : mode === 'attack'
          ? 'Nobody typed a wrong command. The resolution was correct at every step and the outcome was a remote-access trojan.'
          : 'Now publish two poisoned versions into those windows and run it again.',
  })
}
