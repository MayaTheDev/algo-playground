export type HeapStep = {
  heap: number[]
  activeIndex: number | null
  compareIndex: number | null
  extracted: number[]
  description: string
}

const INPUT = [29, 18, 14, 7, 11, 42, 13]

function swap(arr: number[], a: number, b: number) {
  ;[arr[a], arr[b]] = [arr[b], arr[a]]
}

export function* heapSteps(): Generator<HeapStep> {
  const heap: number[] = []
  const extracted: number[] = []

  yield {
    heap: [],
    activeIndex: null,
    compareIndex: null,
    extracted: [],
    description: `Build a min-heap from [${INPUT.join(', ')}]. Insert at the end, then bubble up.`,
  }

  for (const value of INPUT) {
    heap.push(value)
    let idx = heap.length - 1

    yield {
      heap: [...heap],
      activeIndex: idx,
      compareIndex: null,
      extracted: [...extracted],
      description: `Insert ${value} at index ${idx}.`,
    }

    while (idx > 0) {
      const parent = Math.floor((idx - 1) / 2)
      yield {
        heap: [...heap],
        activeIndex: idx,
        compareIndex: parent,
        extracted: [...extracted],
        description: `Compare child ${heap[idx]} with parent ${heap[parent]}.`,
      }

      if (heap[parent] <= heap[idx]) break

      swap(heap, idx, parent)
      yield {
        heap: [...heap],
        activeIndex: parent,
        compareIndex: idx,
        extracted: [...extracted],
        description: `${heap[parent]} is smaller, so it bubbles up. Restore the heap property.`,
      }
      idx = parent
    }
  }

  for (let pass = 0; pass < 2; pass++) {
    if (heap.length === 0) break

    swap(heap, 0, heap.length - 1)
    const min = heap.pop()!
    extracted.push(min)

    yield {
      heap: [...heap],
      activeIndex: 0,
      compareIndex: null,
      extracted: [...extracted],
      description: `Extract min ${min}. Move the last element to the root, then sift down.`,
    }

    let idx = 0
    while (true) {
      const left = idx * 2 + 1
      const right = idx * 2 + 2
      if (left >= heap.length) break

      let smallest = left
      if (right < heap.length && heap[right] < heap[left]) smallest = right

      yield {
        heap: [...heap],
        activeIndex: idx,
        compareIndex: smallest,
        extracted: [...extracted],
        description: `Root ${heap[idx]} compares against the smaller child ${heap[smallest]}.`,
      }

      if (heap[idx] <= heap[smallest]) break

      swap(heap, idx, smallest)
      yield {
        heap: [...heap],
        activeIndex: smallest,
        compareIndex: idx,
        extracted: [...extracted],
        description: `Swap and continue sifting down until every parent is <= its children.`,
      }
      idx = smallest
    }
  }

  yield {
    heap: [...heap],
    activeIndex: null,
    compareIndex: null,
    extracted: [...extracted],
    description: `Done. The heap supports O(log n) inserts and extracts because the repair work only climbs or descends the tree height.`,
  }
}
