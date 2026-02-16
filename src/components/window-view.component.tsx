import type { WindowStep } from '../types/algo.types'

type Props = { step: WindowStep }

const BOX = 14
const GAP = 2
const PAD = 4

export function WindowView({ step }: Props) {
  const { array, left, right, bestLeft, bestRight } = step
  const n = array.length
  const totalW = n * (BOX + GAP) - GAP + PAD * 2
  const totalH = 50

  const cx = (i: number) => PAD + i * (BOX + GAP)

  return (
    <svg viewBox={`0 0 ${totalW} ${totalH}`} className="w-full max-w-md mx-auto">
      <rect x={0} y={0} width={totalW} height={totalH} fill="#020617" />

      {/* Best window background */}
      {bestRight >= bestLeft && (
        <rect
          x={cx(bestLeft) - 1}
          y={8}
          width={(bestRight - bestLeft + 1) * (BOX + GAP) - GAP + 2}
          height={BOX + 2}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={0.8}
          strokeDasharray="2 1"
          rx={1}
        />
      )}

      {/* Active window background */}
      {right >= left && right >= 0 && (
        <rect
          x={cx(left) - 1}
          y={8}
          width={(right - left + 1) * (BOX + GAP) - GAP + 2}
          height={BOX + 2}
          fill="#052e16"
          rx={1}
        />
      )}

      {/* Cells */}
      {array.map((ch, i) => {
        const x = cx(i)
        const inWindow = i >= left && i <= right && right >= 0
        const inBest = i >= bestLeft && i <= bestRight && bestRight >= 0

        let fill = '#0f172a'
        let textFill = '#475569'
        if (inWindow) {
          fill = '#064e3b'
          textFill = '#34d399'
        }

        return (
          <g key={i}>
            <rect
              x={x}
              y={9}
              width={BOX}
              height={BOX}
              fill={fill}
              stroke={inBest && !inWindow ? '#f59e0b' : inWindow ? '#34d399' : '#1e293b'}
              strokeWidth={0.6}
              rx={1}
            />
            <text
              x={x + BOX / 2}
              y={9 + BOX / 2 + 1.2}
              textAnchor="middle"
              fontSize="5"
              fontFamily="monospace"
              fill={textFill}
              fontWeight={inWindow ? 'bold' : 'normal'}
            >
              {ch}
            </text>
            {/* Index */}
            <text x={x + BOX / 2} y={7} textAnchor="middle" fontSize="2.5" fontFamily="monospace" fill="#334155">
              {i}
            </text>
          </g>
        )
      })}

      {/* Pointer labels */}
      {right >= 0 && left === right && (
        <text x={cx(left) + BOX / 2} y={28} textAnchor="middle" fontSize="3" fontFamily="monospace" fill="#34d399">L/R</text>
      )}
      {right >= 0 && left !== right && (
        <>
          <text x={cx(left) + BOX / 2} y={28} textAnchor="middle" fontSize="3" fontFamily="monospace" fill="#34d399">L</text>
          {right >= 0 && (
            <text x={cx(right) + BOX / 2} y={28} textAnchor="middle" fontSize="3" fontFamily="monospace" fill="#34d399">R</text>
          )}
        </>
      )}

      {/* Legend labels */}
      <text x={PAD} y={42} fontSize="2.8" fontFamily="monospace" fill="#34d399">■ window</text>
      <text x={PAD + 22} y={42} fontSize="2.8" fontFamily="monospace" fill="#f59e0b">■ best</text>
      {bestRight >= bestLeft && (
        <text x={PAD} y={48} fontSize="3" fontFamily="monospace" fill="#94a3b8">
          best: "{array.slice(bestLeft, bestRight + 1).join('')}" (len {bestRight - bestLeft + 1})
        </text>
      )}
    </svg>
  )
}
