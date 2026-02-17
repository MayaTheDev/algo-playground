import type { MonoStackStep } from '../../types/algo.types'

const TEMPERATURES = [73, 74, 75, 71, 69, 72, 76, 73]

export function* monotonicStackSteps(): Generator<MonoStackStep> {
  const temps = TEMPERATURES
  const n = temps.length
  const answers = new Array(n).fill(0)
  const stack: number[] = [] // indices

  yield {
    temperatures: temps,
    stackIndices: [],
    answers: [...answers],
    current: -1,
    justPopped: [],
    description: `Find next warmer day for each temperature: [${temps.join(', ')}].`,
  }

  for (let i = 0; i < n; i++) {
    yield {
      temperatures: temps,
      stackIndices: [...stack],
      answers: [...answers],
      current: i,
      justPopped: [],
      description: `Process temps[${i}]=${temps[i]}. Stack top: ${stack.length > 0 ? `temps[${stack[stack.length - 1]}]=${temps[stack[stack.length - 1]]}` : 'empty'}.`,
    }

    const popped: number[] = []
    while (stack.length > 0 && temps[stack[stack.length - 1]] < temps[i]) {
      const poppedIdx = stack.pop()!
      popped.push(poppedIdx)
      answers[poppedIdx] = i - poppedIdx

      yield {
        temperatures: temps,
        stackIndices: [...stack],
        answers: [...answers],
        current: i,
        justPopped: [...popped],
        description: `temps[${poppedIdx}]=${temps[poppedIdx]} < temps[${i}]=${temps[i]}. Pop ${poppedIdx}: answer[${poppedIdx}]=${answers[poppedIdx]}.`,
      }
    }

    stack.push(i)

    yield {
      temperatures: temps,
      stackIndices: [...stack],
      answers: [...answers],
      current: i,
      justPopped: [],
      description: `Push index ${i} (temp=${temps[i]}) onto stack. Stack: [${stack.map(idx => temps[idx]).join(', ')}].`,
    }
  }

  yield {
    temperatures: temps,
    stackIndices: [],
    answers: [...answers],
    current: -1,
    justPopped: [],
    description: `Done. Answers: [${answers.join(', ')}].`,
  }
}
