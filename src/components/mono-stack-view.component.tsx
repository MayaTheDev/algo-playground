import type { MonoStackStep } from '../types/algo.types'

type Props = { step: MonoStackStep }

export function MonoStackView({ step }: Props) {
  const { temperatures, stackIndices, answers, current, justPopped } = step
  const n = temperatures.length
  const maxTemp = Math.max(...temperatures)

  const barW = 9
  const barGap = 2
  const chartLeft = 4
  const chartTop = 4
  const chartH = 38
  const totalW = n * (barW + barGap) - barGap + chartLeft * 2
  const stackTop = chartTop + chartH + 8

  return (
    <svg viewBox={`0 0 ${totalW} 90`} className="w-full max-w-md mx-auto">
      <rect x={0} y={0} width={totalW} height={90} fill="#020617" />

      {/* Bar chart */}
      {temperatures.map((t, i) => {
        const barH = (t / maxTemp) * chartH
        const x = chartLeft + i * (barW + barGap)
        const y = chartTop + chartH - barH
        const inStack = stackIndices.includes(i)
        const isCurrent = i === current
        const isPopped = justPopped.includes(i)
        const isAnswered = answers[i] > 0

        let fill = '#1e293b'
        if (isCurrent) fill = '#34d399'
        else if (isPopped) fill = '#f59e0b'
        else if (inStack) fill = '#0c2a3f'
        else if (isAnswered) fill = '#334155'

        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} fill={fill} rx={0.5} />
            {/* Temperature label */}
            <text
              x={x + barW / 2} y={y - 1.5}
              textAnchor="middle" fontSize="2.8" fontFamily="monospace"
              fill={isCurrent ? '#34d399' : '#475569'}
            >
              {t}
            </text>
            {/* Answer label above bar */}
            {answers[i] > 0 && (
              <text
                x={x + barW / 2} y={chartTop + chartH + 5}
                textAnchor="middle" fontSize="3" fontFamily="monospace" fill="#94a3b8"
              >
                +{answers[i]}
              </text>
            )}
            {/* Index */}
            <text
              x={x + barW / 2} y={chartTop + chartH + 10}
              textAnchor="middle" fontSize="2.5" fontFamily="monospace" fill="#334155"
            >
              {i}
            </text>
          </g>
        )
      })}

      {/* Stack panel */}
      <text x={chartLeft} y={stackTop + 8} fontSize="2.5" fontFamily="monospace" fill="#334155">stack:</text>
      {stackIndices.map((idx, pos) => {
        const x = chartLeft + 14 + pos * 12
        return (
          <g key={idx}>
            <rect x={x} y={stackTop} width={10} height={8} fill="#0c2a3f" stroke="#38bdf8" strokeWidth={0.5} rx={0.5} />
            <text
              x={x + 5} y={stackTop + 5.5}
              textAnchor="middle" fontSize="3" fontFamily="monospace" fill="#38bdf8"
            >
              {temperatures[idx]}
            </text>
          </g>
        )
      })}
      {stackIndices.length === 0 && (
        <text x={chartLeft + 14} y={stackTop + 5.5} fontSize="3" fontFamily="monospace" fill="#334155">[ ]</text>
      )}
    </svg>
  )
}
