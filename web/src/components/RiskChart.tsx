import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CHECK_THRESHOLD, LAST_TICK, LIKELY_THRESHOLD, TICKS_PER_DAY, TOTAL_DAYS } from '../sim/config'
import { STATUS_LABEL, type Status, type VesselState } from '../sim/engine'
import { stampOf } from '../sim/time'
import { STATUS_META } from './status'

interface Point {
  tick: number
  risk: number
  image: number
  voc: number | null
}

const AXIS = { fontSize: 11, fill: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }
const DAY_TICKS = Array.from({ length: TOTAL_DAYS }, (_, d) => d * TICKS_PER_DAY)

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: Point }[] }) {
  const p = active ? payload?.[0]?.payload : undefined
  if (!p) return null
  return (
    <div className="card px-2.5 py-2 text-[12px] leading-5">
      <div className="num text-muted">{stampOf(p.tick)}</div>
      <div className="flex justify-between gap-4">
        <span>Risk</span>
        <span className="num font-medium">{p.risk}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span>Image change</span>
        <span className="num">{p.image}</span>
      </div>
      {p.voc !== null && (
        <div className="flex justify-between gap-4">
          <span>VOC reading</span>
          <span className="num">{p.voc}</span>
        </div>
      )}
    </div>
  )
}

export function RiskChart({ vessel }: { vessel: VesselState }) {
  const data: Point[] = vessel.history.map((c) => ({
    tick: c.tick,
    risk: Math.round(c.risk * 100),
    image: Math.round(c.image * 100),
    voc: c.voc?.tick === c.tick ? Math.round(c.voc.score * 100) : null,
  }))

  // Where the status changed, so the alert points sit on the line.
  const changes: { tick: number; risk: number; status: Status }[] = []
  vessel.history.forEach((c, i) => {
    if (i > 0 && c.status !== vessel.history[i - 1].status) {
      changes.push({ tick: c.tick, risk: Math.round(c.risk * 100), status: c.status })
    }
  })

  return (
    <figure className="m-0">
      <div className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-ink" /> Risk score
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-[#a3abad]" /> Image change
        </span>
        {vessel.def.hasVoc && (
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full border-[1.5px] border-ink bg-surface" /> VOC reading
          </span>
        )}
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -22 }}>
            <CartesianGrid vertical={false} stroke="var(--color-line)" />
            <XAxis
              dataKey="tick"
              type="number"
              domain={[0, LAST_TICK]}
              ticks={DAY_TICKS}
              tickFormatter={(t: number) => `D${t / TICKS_PER_DAY + 1}`}
              tick={AXIS}
              tickLine={false}
              axisLine={{ stroke: 'var(--color-line)' }}
            />
            <YAxis domain={[0, 100]} ticks={[0, 40, 70, 100]} tick={AXIS} tickLine={false} axisLine={false} />
            <ReferenceLine y={CHECK_THRESHOLD * 100} stroke={STATUS_META.check.hex} strokeDasharray="3 3" />
            <ReferenceLine y={LIKELY_THRESHOLD * 100} stroke={STATUS_META.likely.hex} strokeDasharray="3 3" />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--color-muted)', strokeWidth: 1 }} />
            <Line dataKey="image" stroke="#a3abad" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            <Line dataKey="risk" stroke="var(--color-ink)" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line
              dataKey="voc"
              stroke="none"
              isAnimationActive={false}
              dot={{ r: 3, fill: 'var(--color-surface)', stroke: 'var(--color-ink)', strokeWidth: 1.5 }}
              activeDot={false}
            />
            {changes.map((c) => (
              <ReferenceDot
                key={c.tick}
                x={c.tick}
                y={c.risk}
                r={5}
                fill={STATUS_META[c.status].hex}
                stroke="var(--color-surface)"
                strokeWidth={2}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="mt-2 text-[12px] leading-5 text-muted">
        Dashed lines mark the {CHECK_THRESHOLD * 100} and {LIKELY_THRESHOLD * 100} thresholds.
        {changes.length > 0 &&
          ` Filled points: ${changes.map((c) => `${STATUS_LABEL[c.status]} at ${stampOf(c.tick)}`).join('; ')}.`}
      </figcaption>
    </figure>
  )
}
