export type XorStep = {
  array: number[]
  binaryArray: string[]
  currentIndex: number | null
  accumulator: number
  accumulatorBinary: string
  phase: 'intro' | 'fold' | 'result'
  xorVisualization: { a: string; b: string; result: string } | null
  description: string
}

const ARRAY = [4, 1, 2, 1, 2]

function toBinary8(n: number): string {
  return (n >>> 0).toString(2).padStart(8, '0')
}

function xorBinary(a: string, b: string): string {
  return a
    .split('')
    .map((bit, i) => (bit === b[i] ? '0' : '1'))
    .join('')
}

export function* xorFoldSteps(): Generator<XorStep> {
  const array = ARRAY
  const binaryArray = array.map(toBinary8)

  // Step 1: Intro
  yield {
    array,
    binaryArray,
    currentIndex: null,
    accumulator: 0,
    accumulatorBinary: toBinary8(0),
    phase: 'intro',
    xorVisualization: null,
    description: `Problem: find the single element in [${array.join(', ')}] — every other number appears exactly twice.`,
  }

  // Step 2: XOR properties — a ^ a = 0
  yield {
    array,
    binaryArray,
    currentIndex: null,
    accumulator: 0,
    accumulatorBinary: toBinary8(0),
    phase: 'intro',
    xorVisualization: {
      a: toBinary8(5),
      b: toBinary8(5),
      result: xorBinary(toBinary8(5), toBinary8(5)),
    },
    description: `XOR property 1: a ^ a = 0. Any number XOR'd with itself cancels to zero (shown: 5 ^ 5 = 0).`,
  }

  // Step 3: XOR properties — a ^ 0 = a
  yield {
    array,
    binaryArray,
    currentIndex: null,
    accumulator: 0,
    accumulatorBinary: toBinary8(0),
    phase: 'intro',
    xorVisualization: {
      a: toBinary8(4),
      b: toBinary8(0),
      result: xorBinary(toBinary8(4), toBinary8(0)),
    },
    description: `XOR property 2: a ^ 0 = a. Any number XOR'd with zero survives unchanged (shown: 4 ^ 0 = 4).`,
  }

  // Step 4: XOR commutativity
  yield {
    array,
    binaryArray,
    currentIndex: null,
    accumulator: 0,
    accumulatorBinary: toBinary8(0),
    phase: 'intro',
    xorVisualization: null,
    description: `XOR property 3: commutative & associative. So 1^2^1^2^4 = (1^1)^(2^2)^4 = 0^0^4 = 4. We just XOR everything together!`,
  }

  // Main loop: XOR each element
  let acc = 0
  for (let i = 0; i < array.length; i++) {
    const val = array[i]
    const aStr = toBinary8(acc)
    const bStr = toBinary8(val)
    const newAcc = acc ^ val
    const resultStr = toBinary8(newAcc)

    // Show which element we're about to XOR
    yield {
      array,
      binaryArray,
      currentIndex: i,
      accumulator: acc,
      accumulatorBinary: toBinary8(acc),
      phase: 'fold',
      xorVisualization: null,
      description: `Step ${i + 1}: XOR accumulator (${acc}) with array[${i}] = ${val}.`,
    }

    // Show the bit-by-bit operation
    yield {
      array,
      binaryArray,
      currentIndex: i,
      accumulator: acc,
      accumulatorBinary: toBinary8(acc),
      phase: 'fold',
      xorVisualization: { a: aStr, b: bStr, result: resultStr },
      description: `Bit-by-bit: ${acc} ^ ${val} → same bits → 0, different bits → 1. Result: ${newAcc}.`,
    }

    acc = newAcc

    // Show updated accumulator
    yield {
      array,
      binaryArray,
      currentIndex: i,
      accumulator: acc,
      accumulatorBinary: toBinary8(acc),
      phase: 'fold',
      xorVisualization: null,
      description:
        i < array.length - 1
          ? `Accumulator is now ${acc} (${toBinary8(acc)}). The pair ${val === array[i] && array.slice(0, i).includes(val) ? `${val}^${val}=0 cancelled` : 'continues accumulating'}. Moving on.`
          : `Accumulator is now ${acc} (${toBinary8(acc)}). All elements processed.`,
    }
  }

  // Final result
  yield {
    array,
    binaryArray,
    currentIndex: null,
    accumulator: acc,
    accumulatorBinary: toBinary8(acc),
    phase: 'result',
    xorVisualization: null,
    description: `Done! The single element is ${acc}. Pairs (1^1, 2^2) cancelled to 0, leaving only ${acc}. O(n) time, O(1) space.`,
  }
}
