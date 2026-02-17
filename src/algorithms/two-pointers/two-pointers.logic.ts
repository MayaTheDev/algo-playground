import type { TwoPointerStep } from '../../types/algo.types'

const ARRAY = [2, 3, 5, 8, 11, 17, 24]
const TARGET = 25

export function* twoPointersSteps(): Generator<TwoPointerStep> {
  const array = ARRAY
  const target = TARGET
  let left = 0
  let right = array.length - 1

  yield {
    array,
    left,
    right,
    target,
    sum: array[left] + array[right],
    found: false,
    description: `Find two numbers that sum to ${target}. Array: [${array.join(', ')}]. Start: left=${left}, right=${right}.`,
  }

  while (left < right) {
    const sum = array[left] + array[right]

    if (sum === target) {
      yield {
        array,
        left,
        right,
        target,
        sum,
        found: true,
        description: `Found! array[${left}] + array[${right}] = ${array[left]} + ${array[right]} = ${sum} = ${target}.`,
      }
      return
    } else if (sum > target) {
      yield {
        array,
        left,
        right,
        target,
        sum,
        found: false,
        description: `${array[left]} + ${array[right]} = ${sum} > ${target}. Move right pointer left.`,
      }
      right--
    } else {
      yield {
        array,
        left,
        right,
        target,
        sum,
        found: false,
        description: `${array[left]} + ${array[right]} = ${sum} < ${target}. Move left pointer right.`,
      }
      left++
    }
  }

  yield {
    array,
    left,
    right,
    target,
    sum: array[left] + array[right],
    found: false,
    description: `No pair found that sums to ${target}.`,
  }
}
