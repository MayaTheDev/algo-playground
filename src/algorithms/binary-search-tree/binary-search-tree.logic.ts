import type { BSTNodeData, BSTStep } from '../../types/algo.types'

function cloneTree(node: BSTNodeData | null): BSTNodeData | null {
  if (!node) return null
  return { value: node.value, left: cloneTree(node.left), right: cloneTree(node.right) }
}

function insertNode(root: BSTNodeData | null, value: number): BSTNodeData {
  if (!root) return { value, left: null, right: null }
  if (value < root.value) return { ...root, left: insertNode(root.left, value) }
  return { ...root, right: insertNode(root.right, value) }
}

function findMin(node: BSTNodeData): BSTNodeData {
  let cur = node
  while (cur.left) cur = cur.left
  return cur
}

function deleteNode(root: BSTNodeData | null, value: number): BSTNodeData | null {
  if (!root) return null
  if (value < root.value) return { ...root, left: deleteNode(root.left, value) }
  if (value > root.value) return { ...root, right: deleteNode(root.right, value) }
  if (!root.left) return root.right
  if (!root.right) return root.left
  const successor = findMin(root.right)
  return { value: successor.value, left: root.left, right: deleteNode(root.right, successor.value) }
}

export function* bstSteps(): Generator<BSTStep> {
  let root: BSTNodeData | null = null
  const insertValues = [8, 3, 10, 1, 6, 14, 4, 7]

  yield {
    root: null,
    highlighted: null,
    pathValues: [],
    description: 'Empty BST. Begin inserting values.',
  }

  // Insertions with traversal steps
  for (const val of insertValues) {
    const path: number[] = []
    let cur = root

    while (cur) {
      path.push(cur.value)
      yield {
        root: cloneTree(root),
        highlighted: cur.value,
        pathValues: [...path],
        description: `Insert ${val}: compare with ${cur.value}. Go ${val < cur.value ? 'left' : 'right'}.`,
      }
      cur = val < cur.value ? cur.left : cur.right
    }

    root = insertNode(root, val)
    yield {
      root: cloneTree(root),
      highlighted: val,
      pathValues: [...path],
      description: `Inserted ${val} into BST.`,
    }
  }

  // Search for 6
  yield {
    root: cloneTree(root),
    highlighted: null,
    pathValues: [],
    description: 'Now search for 6.',
  }

  const searchTarget = 6
  const searchPath: number[] = []
  let searchCur = root
  while (searchCur) {
    searchPath.push(searchCur.value)
    if (searchCur.value === searchTarget) {
      yield {
        root: cloneTree(root),
        highlighted: searchCur.value,
        pathValues: [...searchPath],
        description: `Found ${searchTarget}! Path: ${searchPath.join(' → ')}.`,
      }
      break
    }
    yield {
      root: cloneTree(root),
      highlighted: searchCur.value,
      pathValues: [...searchPath],
      description: `Search ${searchTarget}: at ${searchCur.value}. Go ${searchTarget < searchCur.value ? 'left' : 'right'}.`,
    }
    searchCur = searchTarget < searchCur.value ? searchCur.left : searchCur.right
  }

  // Delete 3 (two-child node — successor is 4)
  yield {
    root: cloneTree(root),
    highlighted: null,
    pathValues: [],
    description: 'Delete 3 (two children). Find in-order successor: leftmost node in right subtree.',
  }

  // Show finding node 3
  const deletePath: number[] = []
  let deleteCur = root
  while (deleteCur && deleteCur.value !== 3) {
    deletePath.push(deleteCur.value)
    yield {
      root: cloneTree(root),
      highlighted: deleteCur.value,
      pathValues: [...deletePath],
      description: `Delete 3: at ${deleteCur.value}. Go ${3 < deleteCur.value ? 'left' : 'right'}.`,
    }
    deleteCur = 3 < deleteCur.value ? deleteCur.left : deleteCur.right
  }

  yield {
    root: cloneTree(root),
    highlighted: 3,
    pathValues: [...deletePath, 3],
    description: 'Found node 3. It has two children. Find in-order successor (leftmost of right subtree).',
  }

  // Show successor = 4
  yield {
    root: cloneTree(root),
    highlighted: 4,
    pathValues: [4],
    description: 'In-order successor is 4. Replace 3\'s value with 4, then delete original 4 leaf.',
  }

  root = deleteNode(root, 3)
  yield {
    root: cloneTree(root),
    highlighted: 4,
    pathValues: [],
    description: 'Deletion complete. Node 3 replaced by successor 4.',
  }

  yield {
    root: cloneTree(root),
    highlighted: null,
    pathValues: [],
    description: 'BST operations complete: inserted 8 values, searched for 6, deleted 3.',
  }
}
