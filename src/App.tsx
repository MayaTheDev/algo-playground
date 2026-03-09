import { useState } from 'react'
import { AlgoSelector } from './components/algo-selector.component'
import { CompareView } from './components/compare-view.component'
import { BinarySearch } from './algorithms/binary-search/binary-search.component'
import { BubbleSort } from './algorithms/bubble-sort/bubble-sort.component'
import { MergeSort } from './algorithms/merge-sort/merge-sort.component'
import { InsertionSort } from './algorithms/insertion-sort/insertion-sort.component'
import { SelectionSort } from './algorithms/selection-sort/selection-sort.component'
import { DepthFirstSearch } from './algorithms/depth-first-search/depth-first-search.component'
import { Maze } from './algorithms/maze/maze.component'
import { BfsVsDfs } from './algorithms/bfs-vs-dfs/bfs-vs-dfs.component'
import { CoinChange } from './algorithms/coin-change/coin-change.component'
import { Dijkstra } from './algorithms/dijkstra/dijkstra.component'
import { AStar } from './algorithms/a-star/a-star.component'
import { TopologicalSort } from './algorithms/topological-sort/topological-sort.component'
import { Trie } from './algorithms/trie/trie.component'
import { SlidingWindow } from './algorithms/sliding-window/sliding-window.component'
import { TwoPointers } from './algorithms/two-pointers/two-pointers.component'
import { MonotonicStack } from './algorithms/monotonic-stack/monotonic-stack.component'
import { BinarySearchTree } from './algorithms/binary-search-tree/binary-search-tree.component'
import { Heap } from './algorithms/heap/heap.component'
import { UrlShortener } from './algorithms/url-shortener/url-shortener.component'
import { AvlTree } from './algorithms/avl-tree/avl-tree.component'
import { HeuristicCheck } from './algorithms/heuristic-check/heuristic-check.component'
import { Kmp } from './algorithms/kmp/kmp.component'
import { HashTable } from './algorithms/hash-table/hash-table.component'
import { TokenBucket } from './algorithms/token-bucket/token-bucket.component'
import { LruCache } from './algorithms/lru-cache/lru-cache.component'
import { ConsistentHashing } from './algorithms/consistent-hashing/consistent-hashing.component'
import { SegmentTree } from './algorithms/segment-tree/segment-tree.component'
import { IntervalScheduling } from './algorithms/interval-scheduling/interval-scheduling.component'
import { TrieV2 } from './algorithms/trie-v2/trie-v2.component'
import { XorFold } from './algorithms/xor-fold/xor-fold.component'
import { VectorClock } from './algorithms/vector-clock/vector-clock.component'
import { FenwickTree } from './algorithms/fenwick-tree/fenwick-tree.component'
import { Crdt } from './algorithms/crdt/crdt.component'
import { BellmanFord } from './algorithms/bellman-ford/bellman-ford.component'
import { CacheInvalidation } from './algorithms/cache-invalidation/cache-invalidation.component'
import { NQueens } from './algorithms/n-queens/n-queens.component'
import { VectorClockV2 } from './algorithms/vector-clock-v2/vector-clock-v2.component'
import { TopologicalSortV2 } from './algorithms/topological-sort-v2/topological-sort-v2.component'
import { AStarPrecise } from './algorithms/a-star-precise/a-star-precise.component'
import { createStoryGame } from './algorithms/story-games/story-game.component'
import type { AlgoId, AlgoMeta } from './types/algo.types'

type View = AlgoId | 'compare'

const Day1Game = createStoryGame('day-1-game')
const Day2Game = createStoryGame('day-2-game')
const Day3Game = createStoryGame('day-3-game')
const Day4Game = createStoryGame('day-4-game')
const Day5Game = createStoryGame('day-5-game')
const Day6Game = createStoryGame('day-6-game')
const Day7Game = createStoryGame('day-7-game')
const Day9Game = createStoryGame('day-9-game')
const Day10Game = createStoryGame('day-10-game')
const Day11Game = createStoryGame('day-11-game')
const Day12Game = createStoryGame('day-12-game')
const Day13Game = createStoryGame('day-13-game')
const Day14Game = createStoryGame('day-14-game')
const Day15Game = createStoryGame('day-15-game')
const Day16Game = createStoryGame('day-16-game')
const Day17Game = createStoryGame('day-17-game')
const Day18Game = createStoryGame('day-18-game')
const Day19Game = createStoryGame('day-19-game')
const Day20Game = createStoryGame('day-20-game')
const Day29Game = createStoryGame('day-29-game')
const Day38Game = createStoryGame('day-38-game')
const Day50Game = createStoryGame('day-50-game')
const Day54Game = createStoryGame('day-54-game')
const Day55Game = createStoryGame('day-55-game')

const ALGOS: AlgoMeta[] = [
  // Story mini-games for days without algorithm modules
  {
    id: 'day-1-game',
    label: 'Path Splitter',
    tag: '#Choice',
    complexity: 'game',
    description: 'Choose the tradeoff that makes the 90-day run durable.',
    day: 1,
  },
  {
    id: 'day-2-game',
    label: 'Durable Path',
    tag: '#Fundamentals',
    complexity: 'game',
    description: 'Stay on Path B long enough for the quiet work to count.',
    day: 2,
  },
  {
    id: 'day-3-game',
    label: 'Complexity Dodge',
    tag: '#BigO',
    complexity: 'game',
    description: 'Catch honest runtime signals. Avoid vague familiarity.',
    day: 3,
  },
  {
    id: 'day-4-game',
    label: 'Flashlight Checklist',
    tag: '#BigO',
    complexity: 'game',
    description: 'Rebuild the Big-O checklist in the right order.',
    day: 4,
  },
  {
    id: 'day-5-game',
    label: 'Inbox Defense',
    tag: '#Recruiter',
    complexity: 'game',
    description: 'Handle the DM without losing the thread of the work.',
    day: 5,
  },
  {
    id: 'day-6-game',
    label: 'Recursive Avalanche',
    tag: '#Memoization',
    complexity: 'game',
    description: 'Stop duplicate calls before the stack collapses.',
    day: 6,
  },
  {
    id: 'day-7-game',
    label: 'The Notebook',
    tag: '#Memoization',
    complexity: 'game',
    description: 'Put the memoization notebook back together.',
    day: 7,
  },
  {
    id: 'day-9-game',
    label: 'Hash Map Grab',
    tag: '#HashMap',
    complexity: 'game',
    description: 'Catch complements. Ignore brute force bait.',
    day: 9,
  },
  {
    id: 'day-10-game',
    label: 'Bracket Lock',
    tag: '#Stack',
    complexity: 'game',
    description: 'Match editor brackets without losing the stack.',
    day: 10,
  },
  {
    id: 'day-11-game',
    label: 'Meetup Nerve',
    tag: '#Community',
    complexity: 'game',
    description: 'Cross the room without pretending confidence is required.',
    day: 11,
  },
  {
    id: 'day-12-game',
    label: 'Seed Sketch',
    tag: '#Builder',
    complexity: 'game',
    description: 'Grow the first project sketch from a rough idea.',
    day: 12,
  },
  {
    id: 'day-13-game',
    label: 'Cursor Thaw',
    tag: '#Builder',
    complexity: 'game',
    description: 'Tune the cursor out of the blank-page freeze.',
    day: 13,
  },
  {
    id: 'day-14-game',
    label: 'Git Init Run',
    tag: '#Git',
    complexity: 'game',
    description: 'Run the tiny command sequence that turns a folder into a project.',
    day: 14,
  },
  {
    id: 'day-15-game',
    label: 'One Character Hunt',
    tag: '#Debugging',
    complexity: 'game',
    description: 'Find the single character that breaks the whole run.',
    day: 15,
  },
  {
    id: 'day-16-game',
    label: 'First Push',
    tag: '#Git',
    complexity: 'game',
    description: 'Push the public repo without skipping a step.',
    day: 16,
  },
  {
    id: 'day-17-game',
    label: 'Invisible Graph',
    tag: '#Graphs',
    complexity: 'game',
    description: 'Catch visible nodes and edges before the idea disappears.',
    day: 17,
  },
  {
    id: 'day-18-game',
    label: 'Algorithm Lens',
    tag: '#Visualization',
    complexity: 'game',
    description: 'Turn an abstract algorithm into something someone can see.',
    day: 18,
  },
  {
    id: 'day-19-game',
    label: 'Localhost Runner',
    tag: '#Localhost',
    complexity: 'game',
    description: 'Collect green dev-server signals. Dodge broken page states.',
    day: 19,
  },
  {
    id: 'day-20-game',
    label: 'Zero Visitors',
    tag: '#Analytics',
    complexity: 'game',
    description: 'Balance analytics temptation against actual shipping.',
    day: 20,
  },
  {
    id: 'day-29-game',
    label: 'Nelly Reply',
    tag: '#Conversation',
    complexity: 'game',
    description: 'Answer the message without giving away your center.',
    day: 29,
  },
  {
    id: 'day-38-game',
    label: 'Dolores Park Battery',
    tag: '#Community',
    complexity: 'game',
    description: 'Collect connection without draining the whole social battery.',
    day: 38,
  },
  {
    id: 'day-50-game',
    label: 'Signal Loop',
    tag: '#Memory',
    complexity: 'game',
    description: 'Tune memory fragments until the signal resolves.',
    day: 50,
  },
  {
    id: 'day-54-game',
    label: 'Handoff Queue',
    tag: '#Concurrency',
    complexity: 'game',
    description: 'Put the distributed handoff back in order before the next system-design round starts.',
    day: 54,
    availableFrom: '2026-08-06',
  },
  {
    id: 'day-55-game',
    label: 'Second Round Prep',
    tag: '#Interview',
    complexity: 'game',
    description: 'Pick the tradeoff Maya can defend when the follow-up questions start.',
    day: 55,
    availableFrom: '2026-08-11',
  },
  // Day 8 — searching
  {
    id: 'binary-search',
    label: 'Binary Search',
    tag: '#BinarySearch',
    complexity: 'O(log n)',
    description: 'Divide a sorted array in half each step to find a target.',
    day: 8,
  },
  // Days 21–22 — sorting
  {
    id: 'bubble-sort',
    label: 'Bubble Sort',
    tag: '#BubbleSort',
    complexity: 'O(n²)',
    description: 'Repeatedly swap adjacent elements that are out of order.',
    day: 21,
  },
  {
    id: 'merge-sort',
    label: 'Merge Sort',
    tag: '#MergeSort',
    complexity: 'O(n log n)',
    description: 'Split, sort recursively, then merge back together.',
    day: 21,
  },
  {
    id: 'insertion-sort',
    label: 'Insertion Sort',
    tag: '#InsertionSort',
    complexity: 'O(n²)',
    description: 'Insert each element into its correct position one at a time.',
    day: 22,
  },
  {
    id: 'selection-sort',
    label: 'Selection Sort',
    tag: '#SelectionSort',
    complexity: 'O(n²)',
    description: 'Find the minimum element, place it at the front. Repeat.',
    day: 22,
  },
  // Day 23 — graph traversal
  {
    id: 'depth-first-search',
    label: 'Depth-First Search',
    tag: '#DFS',
    complexity: 'O(V + E)',
    description: 'Start at a node. Go as deep as you can. Dead end. Backtrack.',
    day: 23,
  },
  {
    id: 'maze',
    label: 'Maze Solver',
    tag: '#Maze',
    complexity: 'O(V + E)',
    description: 'Navigate a generated maze with DFS backtracking.',
    day: 23,
  },
  // Day 24 — BFS
  {
    id: 'bfs-vs-dfs',
    label: 'BFS vs DFS',
    tag: '#BFSvsDFS',
    complexity: 'O(V + E)',
    description: 'Same graph, two traversal strategies. Stack vs queue.',
    day: 24,
  },
  // Day 25 — dynamic programming
  {
    id: 'coin-change',
    label: 'Coin Change',
    tag: '#DP',
    complexity: 'O(n × amount)',
    description: 'Find minimum coins to make change. Classic dynamic programming.',
    day: 25,
  },
  // Day 26 — weighted graphs
  {
    id: 'dijkstra',
    label: 'Dijkstra\'s',
    tag: '#Dijkstra',
    complexity: 'O((V+E) log V)',
    description: 'Find shortest weighted path. Always process the cheapest node first.',
    day: 26,
  },
  {
    id: 'a-star',
    label: 'A* Search',
    tag: '#AStar',
    complexity: 'O((V+E) log V)',
    description: 'Pathfinding with a heuristic. f = g + h. Faster than Dijkstra\'s when direction matters.',
    day: 27,
    availableFrom: '2026-05-05',
  },
  {
    id: 'topological-sort',
    label: 'Topological Sort',
    tag: '#TopoSort',
    complexity: 'O(V+E)',
    description: 'Order tasks by dependency. Kahn\'s algorithm with in-degree queue.',
    day: 28,
    availableFrom: '2026-05-07',
  },
  {
    id: 'trie',
    label: 'Trie',
    tag: '#Trie',
    complexity: 'O(m)',
    description: 'Prefix tree for fast string lookup. O(prefix length) search time.',
    day: 30,
    availableFrom: '2026-05-14',
  },
  {
    id: 'sliding-window',
    label: 'Sliding Window',
    tag: '#SlidingWindow',
    complexity: 'O(n)',
    description: 'Track a moving subarray. Add new element, remove old one. No recomputation.',
    day: 31,
    availableFrom: '2026-05-19',
  },
  {
    id: 'two-pointers',
    label: 'Two Pointers',
    tag: '#TwoPointers',
    complexity: 'O(n)',
    description: 'Navigate a sorted array from both ends. Move the pointer that gets you closer.',
    day: 32,
    availableFrom: '2026-05-21',
  },
  {
    id: 'monotonic-stack',
    label: 'Monotonic Stack',
    tag: '#MonoStack',
    complexity: 'O(n)',
    description: 'A stack that stays sorted. Pop everything a larger element invalidates.',
    day: 33,
    availableFrom: '2026-05-26',
  },
  {
    id: 'binary-search-tree',
    label: 'BST',
    tag: '#BST',
    complexity: 'O(log n)',
    description: 'Binary search tree. Left < node < right. Insert, search, delete with in-order successor.',
    day: 34,
    availableFrom: '2026-05-28',
  },
  {
    id: 'heap',
    label: 'Heap',
    tag: '#Heap',
    complexity: 'O(log n)',
    description: 'Priority queue core. Bubble values up on insert, sift them down on extract.',
    day: 35,
    availableFrom: '2026-06-02',
  },
  {
    id: 'url-shortener',
    label: 'URL Shortener',
    tag: '#SystemDesign',
    complexity: 'O(1) avg',
    description: 'Create short codes, store mappings, and serve redirects with cache and analytics in the loop.',
    day: 36,
    availableFrom: '2026-06-04',
  },
  {
    id: 'avl-tree',
    label: 'AVL Tree',
    tag: '#AVL',
    complexity: 'O(log n)',
    description: 'A self-balancing BST. Rotations keep lookup cost from collapsing to linear time.',
    day: 37,
    availableFrom: '2026-06-09',
  },
  {
    id: 'heuristic-check',
    label: 'Heuristic Check',
    tag: '#AStar',
    complexity: 'f(n) = g + h',
    description: 'A* only stays trustworthy when the heuristic stays honest about the distance remaining.',
    day: 39,
    availableFrom: '2026-06-16',
  },
  {
    id: 'kmp',
    label: 'KMP',
    tag: '#KMP',
    complexity: 'O(n + m)',
    description: 'String matching without backtracking. Reuse what the mismatch already taught you.',
    day: 40,
    availableFrom: '2026-06-18',
  },
  {
    id: 'hash-table',
    label: 'Hash Table',
    tag: '#HashTable',
    complexity: 'O(1) avg',
    description: 'Store by bucket, then resolve collisions with chaining or probing when reality gets messy.',
    day: 41,
    availableFrom: '2026-06-23',
  },
  {
    id: 'token-bucket',
    label: 'Token Bucket',
    tag: '#RateLimiter',
    complexity: 'O(1)',
    description: 'Absorb bursts, refill over time, and make the limit flexible instead of brittle.',
    day: 42,
    availableFrom: '2026-06-25',
  },
  {
    id: 'lru-cache',
    label: 'LRU Cache',
    tag: '#LRU',
    complexity: 'O(1)',
    description: 'Hash map for lookup, doubly-linked list for recency. Evict the stalest item instantly.',
    day: 43,
    availableFrom: '2026-06-30',
  },
  // Day 44 — Segment Tree (Sandra)
  {
    id: 'segment-tree',
    label: 'Segment Tree',
    tag: '#SegmentTree',
    complexity: 'O(log n)',
    description: 'Range min queries and point updates in O(log n). Build once, query many times.',
    day: 44,
    availableFrom: '2026-07-02',
  },
  // Day 45 — Trie v2 (The Seed)
  {
    id: 'trie-v2',
    label: 'Trie v2',
    tag: '#Trie',
    complexity: 'O(m)',
    description: 'Prefix tree upgraded: deletion with shared-prefix safety, ranked autocomplete, step-by-step ops.',
    day: 45,
    availableFrom: '2026-07-07',
  },
  // Day 46 — Fenwick Tree (Laundromat Reprise)
  {
    id: 'fenwick-tree',
    label: 'Fenwick Tree',
    tag: '#BIT',
    complexity: 'O(log n)',
    description: 'Binary Indexed Tree. Prefix sums and point updates in O(log n) using the lowest set bit trick.',
    day: 46,
    availableFrom: '2026-07-09',
  },
  // Day 47 — Interval Scheduling (The Other Path)
  {
    id: 'interval-scheduling',
    label: 'Interval Scheduling',
    tag: '#Greedy',
    complexity: 'O(n log n)',
    description: 'Maximize non-overlapping meetings. Sort by end time, greedily pick the earliest finish.',
    day: 47,
    availableFrom: '2026-07-14',
  },
  // Day 48 — Vector Clock (The Run)
  {
    id: 'vector-clock',
    label: 'Vector Clock',
    tag: '#DistributedSystems',
    complexity: 'O(n) per event',
    description: 'Track causality across distributed nodes. Each event carries a vector of per-node counters.',
    day: 48,
    availableFrom: '2026-07-16',
  },
  // Day 49 — Consistent Hashing (Consistency)
  {
    id: 'consistent-hashing',
    label: 'Consistent Hashing',
    tag: '#SystemDesign',
    complexity: 'O(log N)',
    description: 'Map servers and keys to a ring. Add or remove a node and only O(K/N) keys move.',
    day: 49,
    availableFrom: '2026-07-21',
  },
  // Day 51 — XOR / Bit Manipulation (After the Dream)
  {
    id: 'xor-fold',
    label: 'XOR / Bit Fold',
    tag: '#BitManipulation',
    complexity: 'O(n)',
    description: 'Find the single non-duplicate in O(n) time and O(1) space using XOR self-cancellation.',
    day: 51,
    availableFrom: '2026-07-28',
  },
  // Day 52 — CRDT (Chloe)
  {
    id: 'crdt',
    label: 'CRDT',
    tag: '#DistributedSystems',
    complexity: 'O(1) merge',
    description: 'Conflict-free replicated data types. Two users edit simultaneously, both converge without coordination.',
    day: 52,
    availableFrom: '2026-07-30',
  },
  // Day 53 — Vector Clock v2 (The Lock That Was Missing)
  {
    id: 'vector-clock-v2',
    label: 'Vector Clock v2',
    tag: '#DistributedSystems',
    complexity: 'O(n) per event',
    description: 'The clock was never wrong. Two replicas take a write during one partition — trigger the lost update, then put a lock around it.',
    day: 53,
    availableFrom: '2026-08-04',
  },
  // Day 56 — Bellman-Ford (Eli at the Edge)
  {
    id: 'bellman-ford',
    label: 'Bellman-Ford',
    tag: '#BellmanFord',
    complexity: 'O(V × E)',
    description: 'Shortest paths with negative edge weights. Relax every edge, V-1 times, then check for negative cycles.',
    day: 56,
    availableFrom: '2026-08-13',
  },
  // Day 57 — Topological Sort v2 (The Order That Came Back Short)
  {
    id: 'topological-sort-v2',
    label: 'Topological Sort v2',
    tag: '#TopoSort',
    complexity: 'O(V+E)',
    description: 'Kahn\'s with the in-degree bookkeeping made explicit — and the quiet failure: add a cycle and the queue empties early with no error at all.',
    day: 57,
    availableFrom: '2026-08-18',
  },
  // Day 58 — A* (Precise Costs), contributed by xlifeofcode (The Open Source Moment)
  {
    id: 'a-star-precise',
    label: 'A* (Precise Costs)',
    tag: '#Community',
    complexity: 'O((V+E) log V)',
    description: 'Same A* search, contributed rewrite: g (spent) and h (guessed) kept apart on every cell — then watch a wrong h quietly return the wrong path.',
    day: 58,
    availableFrom: '2026-08-20',
  },
  // Day 59 — Cache Invalidation (Thank You)
  {
    id: 'cache-invalidation',
    label: 'Cache Invalidation',
    tag: '#Redis',
    complexity: 'O(1) per event',
    description: 'Write-through vs write-back, the window where cache and database disagree, and pub/sub invalidation closing it.',
    day: 59,
    availableFrom: '2026-08-25',
  },
  // Day 61 — N-Queens (The Question I Almost Ask)
  {
    id: 'n-queens',
    label: 'N-Queens',
    tag: '#Backtracking',
    complexity: 'O(n!)',
    description: 'Place, evaluate, fail, back out, try the next thing. The pruning is what makes it finish.',
    day: 61,
    availableFrom: '2026-09-01',
  },
]

const ALGO_COMPONENTS: Record<AlgoId, React.ComponentType> = {
  'day-1-game': Day1Game,
  'day-2-game': Day2Game,
  'day-3-game': Day3Game,
  'day-4-game': Day4Game,
  'day-5-game': Day5Game,
  'day-6-game': Day6Game,
  'day-7-game': Day7Game,
  'day-9-game': Day9Game,
  'day-10-game': Day10Game,
  'day-11-game': Day11Game,
  'day-12-game': Day12Game,
  'day-13-game': Day13Game,
  'day-14-game': Day14Game,
  'day-15-game': Day15Game,
  'day-16-game': Day16Game,
  'day-17-game': Day17Game,
  'day-18-game': Day18Game,
  'day-19-game': Day19Game,
  'day-20-game': Day20Game,
  'day-29-game': Day29Game,
  'day-38-game': Day38Game,
  'day-50-game': Day50Game,
  'day-54-game': Day54Game,
  'day-55-game': Day55Game,
  'depth-first-search': DepthFirstSearch,
  'binary-search': BinarySearch,
  'bubble-sort': BubbleSort,
  'merge-sort': MergeSort,
  'insertion-sort': InsertionSort,
  'selection-sort': SelectionSort,
  'maze': Maze,
  'bfs-vs-dfs': BfsVsDfs,
  'coin-change': CoinChange,
  'dijkstra': Dijkstra,
  'a-star': AStar,
  'topological-sort': TopologicalSort,
  'trie': Trie,
  'sliding-window': SlidingWindow,
  'two-pointers': TwoPointers,
  'monotonic-stack': MonotonicStack,
  'binary-search-tree': BinarySearchTree,
  'heap': Heap,
  'url-shortener': UrlShortener,
  'avl-tree': AvlTree,
  'heuristic-check': HeuristicCheck,
  'kmp': Kmp,
  'hash-table': HashTable,
  'token-bucket': TokenBucket,
  'lru-cache': LruCache,
  'consistent-hashing': ConsistentHashing,
  'segment-tree': SegmentTree,
  'interval-scheduling': IntervalScheduling,
  'trie-v2': TrieV2,
  'xor-fold': XorFold,
  'vector-clock': VectorClock,
  'fenwick-tree': FenwickTree,
  'crdt': Crdt,
  'bellman-ford': BellmanFord,
  'cache-invalidation': CacheInvalidation,
  'n-queens': NQueens,
  'a-star-precise': AStarPrecise,
  'vector-clock-v2': VectorClockV2,
  'topological-sort-v2': TopologicalSortV2,
}

const PREVIEW_ALL = import.meta.env.VITE_PREVIEW === 'true'
const WEBSITE_URL: string = import.meta.env.VITE_WEBSITE_URL || 'https://mayathedev.com'
const now = new Date()
const visibleAlgos = (PREVIEW_ALL
  ? ALGOS
  : ALGOS.filter(a => !a.availableFrom || new Date(a.availableFrom) <= now))
  .slice()
  .sort((a, b) => b.day - a.day || a.label.localeCompare(b.label))

const FALLBACK_ALGO: AlgoId = 'depth-first-search'
const DAY_VIEWS: Partial<Record<number, View>> = {
  1: 'day-1-game',
  2: 'day-2-game',
  3: 'day-3-game',
  4: 'day-4-game',
  5: 'day-5-game',
  6: 'day-6-game',
  7: 'day-7-game',
  8: 'binary-search',
  9: 'day-9-game',
  10: 'day-10-game',
  11: 'day-11-game',
  12: 'day-12-game',
  13: 'day-13-game',
  14: 'day-14-game',
  15: 'day-15-game',
  16: 'day-16-game',
  17: 'day-17-game',
  18: 'day-18-game',
  19: 'day-19-game',
  20: 'day-20-game',
  29: 'day-29-game',
  38: 'day-38-game',
  50: 'day-50-game',
  21: 'compare',
  22: 'compare',
  23: 'maze',
  24: 'bfs-vs-dfs',
  25: 'coin-change',
  26: 'dijkstra',
  27: 'a-star',
  28: 'topological-sort',
  30: 'trie',
  31: 'sliding-window',
  32: 'two-pointers',
  33: 'monotonic-stack',
  34: 'binary-search-tree',
  35: 'heap',
  36: 'url-shortener',
  37: 'avl-tree',
  39: 'heuristic-check',
  40: 'kmp',
  41: 'hash-table',
  42: 'token-bucket',
  43: 'lru-cache',
  44: 'segment-tree',
  45: 'trie-v2',
  46: 'fenwick-tree',
  47: 'interval-scheduling',
  48: 'vector-clock',
  49: 'consistent-hashing',
  51: 'xor-fold',
  52: 'crdt',
  53: 'vector-clock-v2',
  54: 'day-54-game',
  55: 'day-55-game',
  56: 'bellman-ford',
  57: 'topological-sort-v2',
  58: 'a-star-precise',
  59: 'cache-invalidation',
  61: 'n-queens',
}

function isAlgoId(value: string | null): value is AlgoId {
  return value !== null && ALGOS.some((algo) => algo.id === value)
}

function isView(value: string | null): value is View {
  return value === 'compare' || isAlgoId(value)
}

function isAvailableView(view: View): boolean {
  return view === 'compare' || visibleAlgos.some((algo) => algo.id === view)
}

type InitialSelection = {
  view: View
  lockedDay: number | null
}

function getDayMapping(value: string | null): { day: number; view: View } | null {
  if (value === null) return null

  const day = Number.parseInt(value, 10)
  if (Number.isNaN(day)) return null

  const mappedView = DAY_VIEWS[day]
  return mappedView ? { day, view: mappedView } : null
}

function getPathDay(pathname: string): string | null {
  const match = pathname.match(/(?:^|\/)day(\d+)$/)
  return match?.[1] ?? null
}

function getInitialSelection(): InitialSelection {
  if (typeof window === 'undefined') return { view: FALLBACK_ALGO, lockedDay: null }

  const params = new URLSearchParams(window.location.search)
  const requestedView = params.get('algo') ?? params.get('view')

  if (isView(requestedView) && isAvailableView(requestedView)) {
    return { view: requestedView, lockedDay: null }
  }

  const dayMapping = getDayMapping(params.get('day'))
  if (dayMapping) {
    return isAvailableView(dayMapping.view)
      ? { view: dayMapping.view, lockedDay: null }
      : { view: FALLBACK_ALGO, lockedDay: dayMapping.day }
  }

  const pathDayMapping = getDayMapping(getPathDay(window.location.pathname))
  if (pathDayMapping) {
    return isAvailableView(pathDayMapping.view)
      ? { view: pathDayMapping.view, lockedDay: null }
      : { view: FALLBACK_ALGO, lockedDay: pathDayMapping.day }
  }

  return { view: FALLBACK_ALGO, lockedDay: null }
}

const VIEW_OPTIONS = [
  ...visibleAlgos.map(a => ({ value: a.id as View, label: a.label })),
  { value: 'compare' as View, label: 'Compare' },
]

function LockedDay({ day, meta }: { day: number; meta: AlgoMeta | undefined }) {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="w-full max-w-xl border border-slate-800 bg-slate-950/70 p-6 font-mono">
        <p className="text-[10px] uppercase tracking-widest text-slate-600">day {day}</p>
        <h2 className="mt-2 text-lg text-slate-100">{meta?.label ?? 'Coming Soon'}</h2>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          This playground entry is wired, but it belongs to Maya's story timeline and has not
          opened yet. Use preview mode to inspect future days locally.
        </p>
        {meta?.availableFrom && (
          <p className="mt-4 text-[10px] uppercase tracking-widest text-emerald-500">
            opens {meta.availableFrom}
          </p>
        )}
      </div>
    </div>
  )
}

export function App() {
  const initialSelection = getInitialSelection()
  const [view, setView] = useState<View>(initialSelection.view)
  const [lockedDay, setLockedDay] = useState<number | null>(initialSelection.lockedDay)

  const lockedMeta = lockedDay === null
    ? undefined
    : ALGOS.find((algo) => algo.day === lockedDay && DAY_VIEWS[lockedDay] === algo.id)
  const meta = lockedDay === null ? visibleAlgos.find(a => a.id === view) : lockedMeta
  const ActiveComponent = view !== 'compare' ? ALGO_COMPONENTS[view as AlgoId] : null
  const selectView = (nextView: View) => {
    setLockedDay(null)
    setView(nextView)
  }

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden">
      <AlgoSelector selected={view} onSelect={selectView} algos={visibleAlgos} websiteUrl={WEBSITE_URL} />

      <div className="flex-1 flex flex-col min-w-0 relative scanline-effect overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-2 border-b border-slate-800 shrink-0 gap-3">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-mono text-sm neon-text">algo-playground</span>
            <span className="text-slate-600 text-sm hidden sm:block">//</span>
            <span className="text-slate-500 text-xs font-mono hidden sm:block">maya</span>
          </div>

          {/* Mobile algo picker */}
          <select
            value={view}
            onChange={e => selectView(e.target.value as View)}
            className="md:hidden bg-[#020617] text-xs font-mono text-slate-300 border border-slate-700 px-2 py-1 focus:outline-none focus:border-emerald-600 flex-1 max-w-[160px]"
          >
            {VIEW_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <a
            href="https://mayathedev.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors font-mono shrink-0"
          >
            mayathedev.com ↗
          </a>
        </header>

        {/* Algorithm title — hidden in compare mode */}
        {meta && (
          <div className="px-4 py-3 border-b border-slate-800 shrink-0">
            <div className="flex items-baseline gap-3">
              <h1 className="text-sm font-mono text-slate-200">{meta.label}</h1>
              <span className="text-xs text-emerald-500 font-mono">{meta.complexity}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">{meta.description}</p>
          </div>
        )}

        {view === 'compare' && (
          <div className="px-4 py-3 border-b border-slate-800 shrink-0">
            <div className="flex items-baseline gap-3">
              <h1 className="text-sm font-mono text-slate-200">Compare</h1>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Run two sorting algorithms on the same data. Watch one finish while the other crawls.</p>
          </div>
        )}

        {/* Visualizer */}
        <div className="flex-1 min-h-0">
          {lockedDay !== null
            ? <LockedDay day={lockedDay} meta={lockedMeta} />
            : view === 'compare'
            ? <CompareView key="compare" />
            : ActiveComponent && <ActiveComponent key={view} />
          }
        </div>
      </div>
    </div>
  )
}
