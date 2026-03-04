export type IntervalStep = {
  intervals: { id: string; start: number; end: number; label: string }[]
  sorted: boolean
  currentIndex: number | null
  selected: string[]
  rejected: string[]
  lastEnd: number | null
  description: string
}

const RAW_INTERVALS = [
  { id: 'A', label: 'Meeting A', start: 1, end: 4 },
  { id: 'B', label: 'Meeting B', start: 3, end: 5 },
  { id: 'C', label: 'Meeting C', start: 0, end: 6 },
  { id: 'D', label: 'Meeting D', start: 5, end: 7 },
  { id: 'E', label: 'Meeting E', start: 3, end: 9 },
  { id: 'F', label: 'Meeting F', start: 6, end: 10 },
  { id: 'G', label: 'Meeting G', start: 8, end: 11 },
  { id: 'H', label: 'Meeting H', start: 9, end: 12 },
]

export function* intervalSchedulingSteps(): Generator<IntervalStep> {
  const unsorted = [...RAW_INTERVALS]

  // Step 1: Show the unsorted intervals, explain the problem
  yield {
    intervals: unsorted,
    sorted: false,
    currentIndex: null,
    selected: [],
    rejected: [],
    lastEnd: null,
    description:
      'We have 8 meetings and one conference room. Goal: schedule as many non-overlapping meetings as possible.',
  }

  // Step 2: Explain the greedy insight before sorting
  yield {
    intervals: unsorted,
    sorted: false,
    currentIndex: null,
    selected: [],
    rejected: [],
    lastEnd: null,
    description:
      'Greedy insight: always pick the meeting that ends earliest. It leaves the most room for future meetings.',
  }

  // Step 3: Sort by end time
  const sorted = [...RAW_INTERVALS].sort((a, b) => a.end - b.end)

  yield {
    intervals: sorted,
    sorted: true,
    currentIndex: null,
    selected: [],
    rejected: [],
    lastEnd: null,
    description:
      'Sort all intervals by end time. This is the core of the greedy algorithm — earlier finish = more opportunity.',
  }

  // Step 4: Begin evaluation
  yield {
    intervals: sorted,
    sorted: true,
    currentIndex: 0,
    selected: [],
    rejected: [],
    lastEnd: null,
    description: `Start evaluating. Consider "${sorted[0].label}" [${sorted[0].start}–${sorted[0].end}] first (earliest end time).`,
  }

  const selected: string[] = []
  const rejected: string[] = []
  let lastEnd: number | null = null

  // Steps 5-N: Evaluate each interval
  for (let i = 0; i < sorted.length; i++) {
    const interval = sorted[i]

    if (lastEnd === null || interval.start >= lastEnd) {
      // Select this interval
      yield {
        intervals: sorted,
        sorted: true,
        currentIndex: i,
        selected: [...selected],
        rejected: [...rejected],
        lastEnd,
        description:
          lastEnd === null
            ? `"${interval.label}" starts at ${interval.start}. No previous meeting — select it! Last end moves to ${interval.end}.`
            : `"${interval.label}" starts at ${interval.start} ≥ last end ${lastEnd}. No overlap — select it! Last end moves to ${interval.end}.`,
      }

      selected.push(interval.id)
      lastEnd = interval.end

      yield {
        intervals: sorted,
        sorted: true,
        currentIndex: i,
        selected: [...selected],
        rejected: [...rejected],
        lastEnd,
        description: `Selected "${interval.label}" [${interval.start}–${interval.end}]. Schedule now has ${selected.length} meeting${selected.length > 1 ? 's' : ''}.`,
      }
    } else {
      // Reject this interval (overlaps)
      yield {
        intervals: sorted,
        sorted: true,
        currentIndex: i,
        selected: [...selected],
        rejected: [...rejected],
        lastEnd,
        description: `"${interval.label}" starts at ${interval.start} < last end ${lastEnd}. Overlap! Skip it.`,
      }

      rejected.push(interval.id)

      yield {
        intervals: sorted,
        sorted: true,
        currentIndex: i,
        selected: [...selected],
        rejected: [...rejected],
        lastEnd,
        description: `Rejected "${interval.label}" — it conflicts with a previously selected meeting.`,
      }
    }

    // Advance to next if not the last
    if (i < sorted.length - 1) {
      yield {
        intervals: sorted,
        sorted: true,
        currentIndex: i + 1,
        selected: [...selected],
        rejected: [...rejected],
        lastEnd,
        description: `Next: evaluate "${sorted[i + 1].label}" [${sorted[i + 1].start}–${sorted[i + 1].end}].`,
      }
    }
  }

  // Final step: summarize
  yield {
    intervals: sorted,
    sorted: true,
    currentIndex: null,
    selected: [...selected],
    rejected: [...rejected],
    lastEnd,
    description: `Done! Optimal schedule: ${selected.length} meetings (${selected.map(id => RAW_INTERVALS.find(i => i.id === id)!.label).join(', ')}). Greedy gives the globally optimal answer here.`,
  }
}
