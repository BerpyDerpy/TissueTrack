import { Drop, Stack, User, type Icon } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { STATUS_META } from '../components/status'
import type { LabEvent } from '../sim/engine'
import { stampOf } from '../sim/time'
import { useLabState } from '../store/useLab'

const KIND_ICON: Record<Exclude<LabEvent['kind'], 'status'>, Icon> = {
  voc: Drop,
  batch: Stack,
  action: User,
}

function EventRow({ event }: { event: LabEvent }) {
  const status = event.kind === 'status' ? event.status : undefined
  const Icon = status ? STATUS_META[status].Icon : KIND_ICON[event.kind as 'voc' | 'batch' | 'action']
  const tone = status ? STATUS_META[status].tag : 'bg-sunken text-muted'
  return (
    <Link to={`/vessel/${event.vesselId}`} className="press flex gap-3 px-3 py-3 active:bg-canvas">
      <span className={`grid size-8 shrink-0 place-items-center rounded-full ${tone}`}>
        <Icon weight="bold" size={15} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-medium">
            <span className="num">{event.vesselId}</span> · {event.title}
          </span>
        </div>
        <div className="text-[13px] leading-5 text-muted">{event.detail}</div>
        <div className="num mt-0.5 text-[12px] text-muted">{stampOf(event.tick)}</div>
      </div>
    </Link>
  )
}

export function Alerts() {
  const lab = useLabState()
  const events = [...lab.events].reverse()
  return (
    <div className="space-y-2 p-4">
      <div className="flex items-baseline justify-between">
        <h1 className="label m-0">Alerts and activity</h1>
        <span className="num text-[12px] text-muted">{events.length}</span>
      </div>
      {events.length === 0 ? (
        <p className="card m-0 px-3 py-3 text-[13px] text-muted">
          Nothing yet. Alerts appear here when a vessel's risk stays high across several photos.
        </p>
      ) : (
        <div className="card divide-y divide-line">
          {events.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  )
}
