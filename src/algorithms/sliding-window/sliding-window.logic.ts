import type { WindowStep } from '../../types/algo.types'

const INPUT = ['a', 'b', 'c', 'a', 'b', 'c', 'b', 'b']

export function* slidingWindowSteps(): Generator<WindowStep> {
  const array = INPUT
  let left = 0
  let bestLeft = 0
  let bestRight = -1
  const seen = new Map<string, number>()

  yield {
    array,
    left: 0,
    right: -1,
    bestLeft: 0,
    bestRight: -1,
    description: `Find longest substring without repeating characters in "${array.join('')}".`,
  }

  for (let right = 0; right < array.length; right++) {
    const ch = array[right]

    if (seen.has(ch) && seen.get(ch)! >= left) {
      const dupIdx = seen.get(ch)!

      yield {
        array,
        left,
        right,
        bestLeft,
        bestRight,
        description: `'${ch}' at index ${right} is a duplicate (last seen at ${dupIdx}). Shrink window from left.`,
      }

      while (left <= dupIdx) {
        seen.delete(array[left])
        left++
      }
    }

    seen.set(ch, right)

    yield {
      array,
      left,
      right,
      bestLeft,
      bestRight,
      description: `Add '${ch}' at index ${right}. Window [${left}, ${right}] = "${array.slice(left, right + 1).join('')}" (length ${right - left + 1}).`,
    }

    if (right - left + 1 > bestRight - bestLeft + 1) {
      bestLeft = left
      bestRight = right
      yield {
        array,
        left,
        right,
        bestLeft,
        bestRight,
        description: `New best window: "${array.slice(bestLeft, bestRight + 1).join('')}" (length ${bestRight - bestLeft + 1}).`,
      }
    }
  }

  yield {
    array,
    left,
    right: array.length - 1,
    bestLeft,
    bestRight,
    description: `Done. Longest substring: "${array.slice(bestLeft, bestRight + 1).join('')}" (length ${bestRight - bestLeft + 1}).`,
  }
}
