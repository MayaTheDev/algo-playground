import type { SortStep } from '../../types/algo.types'

export function* selectionSortSteps(input: number[]): Generator<SortStep> {
  const arr = [...input]
  const n = arr.length
  const sorted = new Set<number>()

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i

    for (let j = i + 1; j < n; j++) {
      yield {
        array: [...arr],
        comparing: [minIdx, j],
        sorted: [...sorted],
        activeRange: null,
        description: `Scanning unsorted region — current minimum: ${arr[minIdx]} at position ${minIdx}`,
      }
      if (arr[j] < arr[minIdx]) minIdx = j
    }

    if (minIdx !== i) {
      ;[arr[i], arr[minIdx]] = [arr[minIdx], arr[i]]
    }

    sorted.add(i)
    yield {
      array: [...arr],
      comparing: null,
      sorted: [...sorted],
      activeRange: null,
      description: `Placed ${arr[i]} at position ${i}`,
    }
  }

  sorted.add(n - 1)
  yield {
    array: [...arr],
    comparing: null,
    sorted: [...sorted],
    activeRange: null,
    description: 'Sorted!',
  }
}
