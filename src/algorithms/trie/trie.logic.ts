export type TrieNodeData = { children: Record<string, TrieNodeData>; isEnd: boolean }

export function buildTrie(words: string[]): TrieNodeData {
  const root: TrieNodeData = { children: {}, isEnd: false }
  for (const word of words) {
    let node = root
    for (const ch of word) {
      if (!node.children[ch]) node.children[ch] = { children: {}, isEnd: false }
      node = node.children[ch]
    }
    node.isEnd = true
  }
  return root
}

export function getSuggestions(root: TrieNodeData, prefix: string): string[] {
  let node = root
  for (const ch of prefix) {
    if (!node.children[ch]) return []
    node = node.children[ch]
  }
  const results: string[] = []
  function collect(n: TrieNodeData, current: string) {
    if (n.isEnd) results.push(current)
    for (const [ch, child] of Object.entries(n.children)) collect(child, current + ch)
  }
  collect(node, prefix)
  return results
}
