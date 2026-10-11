import { CaretRight } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { latest, type VesselState } from '../sim/engine'
import { IsolatedTag, StatusTag, TrendMark, riskPct } from './status'
import { VesselPhoto } from './VesselPhoto'

export function VesselRow({ vessel, note }: { vessel: VesselState; note?: ReactNode }) {
  const capture = latest(vessel)
  return (
    <Link
      to={`/vessel/${vessel.def.id}`}
      className="press flex items-center gap-3 px-3 py-2.5 active:bg-canvas"
    >
      <VesselPhoto vessel={vessel} capture={capture} className="h-12 w-10 shrink-0 rounded border border-line" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="num font-medium">{vessel.def.id}</span>
          <StatusTag status={vessel.status} />
          {vessel.isolated && <IsolatedTag />}
        </div>
        <div className="mt-0.5 truncate text-[13px] text-muted">{note ?? vessel.def.culture}</div>
      </div>
      <div className="flex items-center gap-1.5">
        <TrendMark vessel={vessel} />
        <span className="num w-7 text-right text-lg font-medium">{riskPct(capture.risk)}</span>
        <CaretRight size={14} weight="bold" className="text-muted" aria-hidden />
      </div>
    </Link>
  )
}
