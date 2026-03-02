export type TrieV2NodeData = {
  children: Record<string, TrieV2NodeData>
  isEnd: boolean
}

export type TrieV2Step = {
  words: string[]
  currentWord: string
  prefix: string
  highlightPath: string[]
  suggestions: string[]
  phase: 'insert' | 'search' | 'delete' | 'autocomplete'
  description: string
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function makeNode(): TrieV2NodeData {
  return { children: {}, isEnd: false }
}

function insertWord(root: TrieV2NodeData, word: string): void {
  let node = root
  for (const ch of word) {
    if (!node.children[ch]) node.children[ch] = makeNode()
    node = node.children[ch]
  }
  node.isEnd = true
}

function collectWords(node: TrieV2NodeData, prefix: string, results: string[]): void {
  if (node.isEnd) results.push(prefix)
  for (const [ch, child] of Object.entries(node.children)) {
    collectWords(child, prefix + ch, results)
  }
}

function getSuggestions(root: TrieV2NodeData, prefix: string): string[] {
  let node = root
  for (const ch of prefix) {
    if (!node.children[ch]) return []
    node = node.children[ch]
  }
  const results: string[] = []
  collectWords(node, prefix, results)
  return results.sort()
}

/**
 * Returns true if the word was found and deleted.
 * Nodes that are shared with other words (have multiple children or isEnd mid-path) are kept.
 */
function deleteWord(root: TrieV2NodeData, word: string): boolean {
  function del(node: TrieV2NodeData, depth: number): boolean {
    if (depth === word.length) {
      if (!node.isEnd) return false // word not in trie
      node.isEnd = false
      return Object.keys(node.children).length === 0 // safe to delete this node
    }
    const ch = word[depth]
    const child = node.children[ch]
    if (!child) return false
    const shouldDeleteChild = del(child, depth + 1)
    if (shouldDeleteChild) {
      delete node.children[ch]
      // This node can be removed if it's not an end and has no other children
      return !node.isEnd && Object.keys(node.children).length === 0
    }
    return false
  }
  return del(root, 0)
}

function cloneRoot(root: TrieV2NodeData): TrieV2NodeData {
  return JSON.parse(JSON.stringify(root)) as TrieV2NodeData
}

// ─── Step generator ───────────────────────────────────────────────────────────

export function* trieV2Steps(): Generator<TrieV2Step> {
  const root = makeNode()
  const wordsInTrie: string[] = []

  // ── Step 0: initial state ──────────────────────────────────────────────────
  yield {
    words: [],
    currentWord: '',
    prefix: '',
    highlightPath: [],
    suggestions: [],
    phase: 'insert',
    description: 'Empty trie. We\'ll insert 5 words sharing the prefix "co".',
  }

  // ── Insert phase ───────────────────────────────────────────────────────────
  const wordsToInsert = ['code', 'coder', 'coding', 'cow', 'cowork']

  for (const word of wordsToInsert) {
    // Show traversal character by character
    for (let i = 1; i <= word.length; i++) {
      const partial = word.slice(0, i)
      yield {
        words: [...wordsInTrie],
        currentWord: word,
        prefix: partial,
        highlightPath: partial.split(''),
        suggestions: [],
        phase: 'insert',
        description: `Inserting "${word}" — traversing to node "${partial[partial.length - 1]}" (depth ${i})`,
      }
    }

    insertWord(root, word)
    wordsInTrie.push(word)

    yield {
      words: [...wordsInTrie],
      currentWord: word,
      prefix: word,
      highlightPath: word.split(''),
      suggestions: [],
      phase: 'insert',
      description: `"${word}" inserted. Marked leaf node as end-of-word (●).`,
    }
  }

  // ── Autocomplete "co" ──────────────────────────────────────────────────────
  yield {
    words: [...wordsInTrie],
    currentWord: '',
    prefix: 'c',
    highlightPath: ['c'],
    suggestions: [],
    phase: 'autocomplete',
    description: 'Autocomplete "co" — traversing: reached node "c".',
  }

  yield {
    words: [...wordsInTrie],
    currentWord: '',
    prefix: 'co',
    highlightPath: ['c', 'o'],
    suggestions: getSuggestions(root, 'co'),
    phase: 'autocomplete',
    description: `Autocomplete "co" — reached node "o". Found ${getSuggestions(root, 'co').length} suggestions.`,
  }

  // ── Autocomplete "cod" ─────────────────────────────────────────────────────
  yield {
    words: [...wordsInTrie],
    currentWord: '',
    prefix: 'co',
    highlightPath: ['c', 'o'],
    suggestions: [],
    phase: 'autocomplete',
    description: 'Now narrow to prefix "cod" — one more step down the trie.',
  }

  yield {
    words: [...wordsInTrie],
    currentWord: '',
    prefix: 'cod',
    highlightPath: ['c', 'o', 'd'],
    suggestions: getSuggestions(root, 'cod'),
    phase: 'autocomplete',
    description: `Autocomplete "cod" — reached node "d". ${getSuggestions(root, 'cod').length} matches: ${getSuggestions(root, 'cod').join(', ')}.`,
  }

  // ── Delete "coder" ─────────────────────────────────────────────────────────
  yield {
    words: [...wordsInTrie],
    currentWord: 'coder',
    prefix: '',
    highlightPath: [],
    suggestions: [],
    phase: 'delete',
    description: 'Delete "coder". It shares "cod" with "code" and "coding" — only the unique tail gets removed.',
  }

  // Traverse path for "coder" showing shared prefix
  for (let i = 1; i <= 'coder'.length; i++) {
    const partial = 'coder'.slice(0, i)
    yield {
      words: [...wordsInTrie],
      currentWord: 'coder',
      prefix: partial,
      highlightPath: partial.split(''),
      suggestions: [],
      phase: 'delete',
      description: `Delete "coder": walking path "${partial}" — ${i < 4 ? 'shared with other words, keep node' : i === 4 ? '"code" ends here, still shared' : 'unique "r" node — safe to remove'}`,
    }
  }

  deleteWord(root, 'coder')
  const afterDeleteCoder = wordsInTrie.filter(w => w !== 'coder')

  yield {
    words: afterDeleteCoder,
    currentWord: 'coder',
    prefix: 'coder',
    highlightPath: ['c', 'o', 'd', 'e'],
    suggestions: [],
    phase: 'delete',
    description: '"coder" deleted. The "r" node was removed; "code" node (●) is preserved — shared prefix intact.',
  }

  wordsInTrie.splice(0, wordsInTrie.length, ...afterDeleteCoder)

  // ── Autocomplete "cod" after deletion ──────────────────────────────────────
  yield {
    words: [...wordsInTrie],
    currentWord: '',
    prefix: 'cod',
    highlightPath: ['c', 'o', 'd'],
    suggestions: getSuggestions(root, 'cod'),
    phase: 'autocomplete',
    description: `Autocomplete "cod" again — now ${getSuggestions(root, 'cod').length} matches: ${getSuggestions(root, 'cod').join(', ')}. "coder" is gone.`,
  }

  // ── Delete "coding" ────────────────────────────────────────────────────────
  yield {
    words: [...wordsInTrie],
    currentWord: 'coding',
    prefix: '',
    highlightPath: [],
    suggestions: [],
    phase: 'delete',
    description: 'Delete "coding". "codin" and "coding" nodes are unique — the whole tail is pruned.',
  }

  for (let i = 1; i <= 'coding'.length; i++) {
    const partial = 'coding'.slice(0, i)
    yield {
      words: [...wordsInTrie],
      currentWord: 'coding',
      prefix: partial,
      highlightPath: partial.split(''),
      suggestions: [],
      phase: 'delete',
      description: `Delete "coding": at "${partial}" — ${i <= 2 ? 'shared prefix, keep' : 'unique path, will prune'}`,
    }
  }

  deleteWord(root, 'coding')
  const afterDeleteCoding = wordsInTrie.filter(w => w !== 'coding')

  yield {
    words: afterDeleteCoding,
    currentWord: 'coding',
    prefix: 'codi',
    highlightPath: ['c', 'o', 'd', 'i'],
    suggestions: [],
    phase: 'delete',
    description: '"coding" deleted. Nodes "i", "n", "g" pruned back to "d" — only "code" survives under "cod".',
  }

  wordsInTrie.splice(0, wordsInTrie.length, ...afterDeleteCoding)

  // ── Final autocomplete ─────────────────────────────────────────────────────
  yield {
    words: [...wordsInTrie],
    currentWord: '',
    prefix: 'co',
    highlightPath: ['c', 'o'],
    suggestions: getSuggestions(root, 'co'),
    phase: 'autocomplete',
    description: `Final state — trie has ${wordsInTrie.length} words. Autocomplete "co": ${getSuggestions(root, 'co').join(', ')}.`,
  }
}
