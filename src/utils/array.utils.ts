export function generateRandomArray(size: number = 16): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 90) + 10)
}

export function generateSortedArray(size: number = 20): number[] {
  const arr = Array.from({ length: size }, () => Math.floor(Math.random() * 90) + 10)
  return [...new Set(arr)].sort((a, b) => a - b).slice(0, size)
}

export function collectSteps<T>(gen: Generator<T>): T[] {
  const steps: T[] = []
  for (const step of gen) steps.push(step)
  return steps
}
