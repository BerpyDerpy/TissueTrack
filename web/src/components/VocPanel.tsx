import { COMPOUNDS } from '../sim/config'
import type { VocReading } from '../sim/engine'

// Each row is on its own log scale relative to the compound's typical healthy
// volume (0.5x to 16x), so the healthy band sits in the same place on every row.
const LO = -1
const SPAN = 5
const pos = (ratio: number) => Math.min(100, Math.max(0, ((Math.log2(ratio) - LO) / SPAN) * 100))

export function VocPanel({ reading }: { reading: VocReading }) {
  return (
    <ul className="m-0 list-none space-y-3 p-0">
      {COMPOUNDS.map((c, k) => {
        const value = reading.peaks[k]
        const ratio = value / c.mean
        const above = value > c.hi
        const from = pos(c.lo / c.mean)
        const to = pos(c.hi / c.mean)
        return (
          <li key={c.name}>
            <div className="flex items-baseline justify-between gap-3 text-[13px]">
              <span>{c.name}</span>
              <span className="num">
                {Math.round(value)}
                <span className={above ? 'ml-2 font-medium text-likely' : 'ml-2 text-muted'}>
                  {above ? `${ratio.toFixed(1)}x typical` : 'in range'}
                </span>
              </span>
            </div>
            <div className="relative mt-1.5 h-2">
              <div className="absolute inset-x-0 top-[3px] h-0.5 bg-line" />
              <div className="absolute top-0 h-2 rounded-sm bg-healthy-bg" style={{ left: `${from}%`, width: `${to - from}%` }} />
              <div
                className={`absolute top-[-2px] size-3 -translate-x-1/2 rounded-full border-2 border-surface ${above ? 'bg-likely' : 'bg-ink'}`}
                style={{ left: `${pos(ratio)}%` }}
              />
            </div>
          </li>
        )
      })}
      <li className="text-[12px] leading-5 text-muted">
        Peak volume in arbitrary units. The shaded band is the healthy range; the scale is logarithmic.
      </li>
    </ul>
  )
}
