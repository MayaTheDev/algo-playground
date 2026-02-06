import type { SortStep } from '../../types/algo.types'

export function* bubbleSortSteps(input: number[]): Generator<SortStep> {
  const arr = [...input]
  const n = arr.length
  const sorted = new Set<number>()

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      yield {
        array: [...arr],
        comparing: [j, j + 1],
        sorted: [...sorted],
        activeRange: null,
        description: `Comparing ${arr[j]} and ${arr[j + 1]} at positions ${j} and ${j + 1}`,
      }

      if (arr[j] > arr[j + 1]) {
        ;[arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]
        yield {
          array: [...arr],
          comparing: [j, j + 1],
          sorted: [...sorted],
          activeRange: null,
          description: `${arr[j + 1]} > ${arr[j]} → swapping`,
        }
      }
    }
    sorted.add(n - 1 - i)
  }
  sorted.add(0)

  yield {
    array: [...arr],
    comparing: null,
    sorted: [...sorted],
    activeRange: null,
    description: 'Sorted!',
  }
}
