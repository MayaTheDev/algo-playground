import type { SearchStep } from '../../types/algo.types'

export function* binarySearchSteps(arr: number[], target: number): Generator<SearchStep> {
  let left = 0
  let right = arr.length - 1
  const eliminated: number[] = []

  yield {
    array: arr,
    target,
    left,
    right,
    mid: Math.floor((left + right) / 2),
    found: null,
    eliminated: [],
    description: `Searching for ${target} in ${arr.length} elements. Search space: [${left}, ${right}]`,
  }

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)

    yield {
      array: arr,
      target,
      left,
      right,
      mid,
      found: null,
      eliminated: [...eliminated],
      description: `Midpoint is index ${mid} → value ${arr[mid]}. ${arr[mid] === target ? `Found ${target}!` : arr[mid] < target ? `${arr[mid]} < ${target}, discard left half` : `${arr[mid]} > ${target}, discard right half`}`,
    }

    if (arr[mid] === target) {
      yield {
        array: arr,
        target,
        left,
        right,
        mid,
        found: mid,
        eliminated: [...eliminated],
        description: `Found ${target} at index ${mid}!`,
      }
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

  yield {
    array: arr,
    target,
    left: -1,
    right: -1,
    mid: -1,
    found: -1,
    eliminated: [...eliminated],
    description: `${target} is not in the array`,
  }
}
