import type { SortStep } from '../../types/algo.types'

export function* insertionSortSteps(input: number[]): Generator<SortStep> {
  const arr = [...input]
  const n = arr.length
  const sorted = new Set<number>([0])

  yield {
    array: [...arr],
    comparing: null,
    sorted: [...sorted],
    activeRange: null,
    description: `Starting with ${arr[0]} as the first sorted element`,
  }

  for (let i = 1; i < n; i++) {
    let j = i

    while (j > 0) {
      yield {
        array: [...arr],
        comparing: [j - 1, j],
        sorted: [...sorted],
        activeRange: null,
        description: `Comparing ${arr[j]} with ${arr[j - 1]}`,
      }

      if (arr[j] < arr[j - 1]) {
        ;[arr[j], arr[j - 1]] = [arr[j - 1], arr[j]]
        j--
      } else {
        break
      }
    }

    sorted.add(i)
    yield {
      array: [...arr],
      comparing: null,
      sorted: [...sorted],
      activeRange: null,
      description: `${arr[j]} is in its correct position`,
    }
  }
}
