import { CHECK_THRESHOLD } from '../sim/config'
import type { Capture } from '../sim/engine'
import { STATUS_META } from './status'

const W = 100
const H = 28
const SPAN = 48 // the last 24 h

export function Sparkline({ history }: { history: Capture[] }) {
  const recent = history.slice(-SPAN)
  const y = (risk: number) => H - 2 - risk * (H - 4)
  const x = (i: number) => (i / (SPAN - 1)) * (W - 4) + 2
  const points = recent.map((c, i) => `${x(i).toFixed(1)},${y(c.risk).toFixed(1)}`).join(' ')
  const last = recent[recent.length - 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" aria-hidden>
      <line
        x1="0"
        x2={W}
        y1={y(CHECK_THRESHOLD)}
        y2={y(CHECK_THRESHOLD)}
        stroke="var(--color-line)"
        strokeDasharray="2 3"
        vectorEffect="non-scaling-stroke"
      />
      <polyline
        points={points}
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {last && (
        <circle
          cx={x(recent.length - 1)}
          cy={y(last.risk)}
          r="2.2"
          fill={last.status === 'healthy' ? 'var(--color-ink)' : STATUS_META[last.status].hex}
        />
      )}
    </svg>
  )
}
