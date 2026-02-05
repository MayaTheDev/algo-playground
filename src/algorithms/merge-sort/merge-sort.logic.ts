import type { SortStep } from '../../types/algo.types'

export function* mergeSortSteps(input: number[]): Generator<SortStep> {
  const arr = [...input]
  const n = arr.length

  yield* mergeSort(arr, 0, n)

  yield {
    array: [...arr],
    comparing: null,
    sorted: Array.from({ length: n }, (_, i) => i),
    activeRange: null,
    description: 'Sorted!',
  }
}

function* mergeSort(arr: number[], left: number, right: number): Generator<SortStep> {
  if (right - left <= 1) return

  const mid = Math.floor((left + right) / 2)

  yield* mergeSort(arr, left, mid)
  yield* mergeSort(arr, mid, right)
  yield* merge(arr, left, mid, right)
}

function* merge(arr: number[], left: number, mid: number, right: number): Generator<SortStep> {
  const leftArr = arr.slice(left, mid)
  const rightArr = arr.slice(mid, right)
  let i = 0
  let j = 0
  let k = left

  while (i < leftArr.length && j < rightArr.length) {
    yield {
      array: [...arr],
      comparing: [left + i, mid + j],
      sorted: [],
      activeRange: [left, right],
      description: `Merging [${left}–${right - 1}]: comparing ${leftArr[i]} and ${rightArr[j]}`,
    }

    if (leftArr[i] <= rightArr[j]) {
      arr[k] = leftArr[i]
      i++
    } else {
      arr[k] = rightArr[j]
      j++
    }
    k++
  }

  while (i < leftArr.length) { arr[k++] = leftArr[i++] }
  while (j < rightArr.length) { arr[k++] = rightArr[j++] }

  const merged = Array.from({ length: right - left }, (_, idx) => left + idx)
  yield {
    array: [...arr],
    comparing: null,
    sorted: merged,
    activeRange: [left, right],
    description: `Merged subarray [${left}–${right - 1}]`,
  }
}
