import type { TwoPointerStep } from '../types/algo.types'

type Props = { step: TwoPointerStep }

const BOX = 14
const GAP = 3
const PAD = 6

export function TwoPointerView({ step }: Props) {
  const { array, left, right, target, sum, found } = step
  const n = array.length
  const totalW = n * (BOX + GAP) - GAP + PAD * 2
  const totalH = 55

  const cx = (i: number) => PAD + i * (BOX + GAP)

  return (
    <svg viewBox={`0 0 ${totalW} ${totalH}`} className="w-full max-w-md mx-auto">
      <rect x={0} y={0} width={totalW} height={totalH} fill="#020617" />

      {/* Cells */}
      {array.map((val, i) => {
        const x = cx(i)
        const isLeft = i === left
        const isRight = i === right
        const isActive = isLeft || isRight

        let fill = '#0f172a'
        let stroke = '#1e293b'
        let textFill = '#475569'

        if (found && isActive) {
          fill = '#064e3b'
          stroke = '#34d399'
          textFill = '#34d399'
        } else if (isLeft) {
          fill = '#0c2a3f'
          stroke = '#38bdf8'
          textFill = '#38bdf8'
        } else if (isRight) {
          fill = '#3d2200'
          stroke = '#f59e0b'
          textFill = '#f59e0b'
        }

        return (
          <g key={i}>
            <rect x={x} y={10} width={BOX} height={BOX} fill={fill} stroke={stroke} strokeWidth={0.7} rx={1} />
            <text
              x={x + BOX / 2} y={10 + BOX / 2 + 1.5}
              textAnchor="middle" fontSize="4.5" fontFamily="monospace"
              fill={textFill} fontWeight={isActive ? 'bold' : 'normal'}
            >
              {val}
            </text>
            {/* Index */}
            <text x={x + BOX / 2} y={8} textAnchor="middle" fontSize="2.5" fontFamily="monospace" fill="#334155">
              {i}
            </text>
          </g>
        )
      })}

      {/* Pointer arrows */}
      <text
        x={cx(left) + BOX / 2} y={30}
        textAnchor="middle" fontSize="5" fontFamily="monospace"
        fill={found ? '#34d399' : '#38bdf8'}
      >
        ▲
      </text>
      <text
        x={cx(left) + BOX / 2} y={35}
        textAnchor="middle" fontSize="3" fontFamily="monospace"
        fill={found ? '#34d399' : '#38bdf8'}
      >
        L
      </text>

      {left !== right && (
        <>
          <text
            x={cx(right) + BOX / 2} y={30}
            textAnchor="middle" fontSize="5" fontFamily="monospace"
            fill={found ? '#34d399' : '#f59e0b'}
          >
            ▲
          </text>
          <text
            x={cx(right) + BOX / 2} y={35}
            textAnchor="middle" fontSize="3" fontFamily="monospace"
            fill={found ? '#34d399' : '#f59e0b'}
          >
            R
          </text>
        </>
      )}

      {/* Sum display */}
      <text x={totalW / 2} y={45} textAnchor="middle" fontSize="3.5" fontFamily="monospace" fill="#64748b">
        target: {target}
      </text>
      <text
        x={totalW / 2} y={52}
        textAnchor="middle" fontSize="3.5" fontFamily="monospace"
        fill={found ? '#34d399' : sum > target ? '#f87171' : sum < target ? '#38bdf8' : '#94a3b8'}
      >
        {array[left]} + {array[right]} = {sum} {found ? '✓' : sum > target ? '(too large)' : '(too small)'}
      </text>
    </svg>
  )
}
