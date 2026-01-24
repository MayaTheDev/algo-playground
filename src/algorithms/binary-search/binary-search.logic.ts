import type { SearchStep } from '../../types/algo.types'

export function* binarySearchSteps(arr: number[], target: number): Generator<SearchStep> {
  let left = 0
  let right = arr.length - 1
  const eliminated: number[] = []

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)

    yield { array: arr, target, left, right, mid, found: null, eliminated: [...eliminated] }

    if (arr[mid] === target) {
      yield { array: arr, target, left, right, mid, found: mid, eliminated: [...eliminated] }
      return
    }

    if (arr[mid] < target) {
      for (let i = left; i <= mid; i++) eliminated.push(i)
      left = mid + 1
    } else {
      for (let i = mid; i <= right; i++) eliminated.push(i)
      right = mid - 1
    }
  }

  yield { array: arr, target, left: -1, right: -1, mid: -1, found: -1, eliminated: [...eliminated] }
}
