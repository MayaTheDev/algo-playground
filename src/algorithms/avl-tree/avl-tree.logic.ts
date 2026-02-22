import type { BSTNodeData, BSTStep } from '../../types/algo.types'

type AvlNode = {
  value: number
  left: AvlNode | null
  right: AvlNode | null
  height: number
}

function clone(node: AvlNode | null): BSTNodeData | null {
  if (!node) return null
  return { value: node.value, left: clone(node.left), right: clone(node.right) }
}

function height(node: AvlNode | null) {
  return node?.height ?? 0
}

function update(node: AvlNode): AvlNode {
  return { ...node, height: Math.max(height(node.left), height(node.right)) + 1 }
}

function rotateRight(y: AvlNode): AvlNode {
  const x = y.left!
  const t2 = x.right
  return update({ ...x, right: update({ ...y, left: t2 }) })
}

function rotateLeft(x: AvlNode): AvlNode {
  const y = x.right!
  const t2 = y.left
  return update({ ...y, left: update({ ...x, right: t2 }) })
}

function balanceFactor(node: AvlNode | null) {
  return node ? height(node.left) - height(node.right) : 0
}

export function* avlTreeSteps(): Generator<BSTStep> {
  let root: AvlNode | null = null
  const values = [30, 20, 10, 40, 50, 25]

  yield {
    root: null,
    highlighted: null,
    pathValues: [],
    description: 'AVL trees are BSTs that rotate when they become unbalanced. Insert values and watch the repair happen automatically.',
  }

  const insert = (node: AvlNode | null, value: number, path: number[]): AvlNode => {
    if (!node) {
      return { value, left: null, right: null, height: 1 }
    }

    path.push(node.value)
    if (value < node.value) node = { ...node, left: insert(node.left, value, path) }
    else node = { ...node, right: insert(node.right, value, path) }

    node = update(node)
    const balance = balanceFactor(node)

    if (balance > 1 && value < node.left!.value) {
      steps.push({
        root: clone(node),
        highlighted: node.value,
        pathValues: [...path, node.value],
        description: `Node ${node.value} is left-heavy after inserting ${value}. Right rotation fixes the LL imbalance.`,
      })
      node = rotateRight(node)
      steps.push({
        root: clone(node),
        highlighted: node.value,
        pathValues: [],
        description: `Right rotation complete. Height returns to O(log n) territory instead of collapsing into a line.`,
      })
    } else if (balance < -1 && value > node.right!.value) {
      steps.push({
        root: clone(node),
        highlighted: node.value,
        pathValues: [...path, node.value],
        description: `Node ${node.value} is right-heavy after inserting ${value}. Left rotation fixes the RR imbalance.`,
      })
      node = rotateLeft(node)
      steps.push({
        root: clone(node),
        highlighted: node.value,
        pathValues: [],
        description: `Left rotation complete. The tree stays shallow enough for fast search and insert.`,
      })
    } else if (balance > 1 && value > node.left!.value) {
      steps.push({
        root: clone(node),
        highlighted: node.value,
        pathValues: [...path, node.value],
        description: `Left-right imbalance: rotate the child left first, then rotate the parent right.`,
      })
      node = { ...node, left: rotateLeft(node.left!) }
      node = rotateRight(node)
      steps.push({
        root: clone(node),
        highlighted: node.value,
        pathValues: [],
        description: `Double rotation complete. The middle value rises and the subtree evens out.`,
      })
    } else if (balance < -1 && value < node.right!.value) {
      steps.push({
        root: clone(node),
        highlighted: node.value,
        pathValues: [...path, node.value],
        description: `Right-left imbalance: rotate the child right first, then rotate the parent left.`,
      })
      node = { ...node, right: rotateRight(node.right!) }
      node = rotateLeft(node)
      steps.push({
        root: clone(node),
        highlighted: node.value,
        pathValues: [],
        description: `Double rotation complete. The subtree is balanced again without changing in-order order.`,
      })
    }

    return node
  }

  const steps: BSTStep[] = []

  for (const value of values) {
    const path: number[] = []
    root = insert(root, value, path)
    steps.push({
      root: clone(root),
      highlighted: value,
      pathValues: path,
      description: `Inserted ${value}. AVL bookkeeping updates heights and checks the balance factor on the way back up.`,
    })
  }

  for (const step of steps) yield step

  yield {
    root: clone(root),
    highlighted: null,
    pathValues: [],
    description: 'Done. The key difference from a plain BST is not insertion itself, but the willingness to rotate immediately when the height drifts too far.',
  }
}
