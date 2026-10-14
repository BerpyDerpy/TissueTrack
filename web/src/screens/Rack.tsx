import { Link } from 'react-router-dom'
import { Sparkline } from '../components/Sparkline'
import { IsolatedTag, STATUS_META, StatusTag, riskPct } from '../components/status'
import { VesselPhoto } from '../components/VesselPhoto'
import { VesselRow } from '../components/VesselRow'
import { CAPTURE_MINUTES } from '../sim/config'
import { STATUS_LABEL, latest, needsAttention, type Status, type VesselState } from '../sim/engine'
import { useLabState } from '../store/useLab'

const ORDER: Status[] = ['likely', 'check', 'healthy']

function attentionNote(v: VesselState): string {
  const c = latest(v)
  if (v.status === 'likely') return 'Isolate immediately'
  if (c.voc && c.image < 0.2) return 'VOC pattern abnormal, photo still looks clean'
  return 'Inspect the vessel'
}

function VesselCard({ vessel }: { vessel: VesselState }) {
  const capture = latest(vessel)
  return (
    <Link to={`/vessel/${vessel.def.id}`} className="card press block overflow-hidden active:bg-canvas">
      <VesselPhoto vessel={vessel} capture={capture} className="block aspect-[4/3] w-full border-b border-line" />
      <div className="p-2.5">
        <div className="flex items-baseline justify-between">
          <span className="num font-medium">{vessel.def.id}</span>
          <span className="num text-lg leading-none font-medium">{riskPct(capture.risk)}</span>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1">
          <StatusTag status={vessel.status} short />
          {vessel.isolated && <IsolatedTag />}
        </div>
        <div className="mt-2">
          <Sparkline history={vessel.history} />
        </div>
      </div>
    </Link>
  )
}

export function Rack() {
  const lab = useLabState()
  const flagged = lab.vessels
    .filter(needsAttention)
    .sort((a, b) => latest(b).risk - latest(a).risk)

  return (
    <div className="space-y-5 p-4">
      <section className="card">
        <div className="grid grid-cols-3 divide-x divide-line">
          {ORDER.map((status) => {
            const { Icon, text } = STATUS_META[status]
            const count = lab.vessels.filter((v) => v.status === status).length
            return (
              <div key={status} className="px-3 py-3">
                <div className="num text-[28px] leading-none font-medium">{count}</div>
                <div className={`mt-1.5 flex items-center gap-1 text-[12px] font-medium ${text}`}>
                  <Icon weight="bold" size={13} aria-hidden />
                  {status === 'likely' ? 'Likely' : STATUS_LABEL[status]}
                </div>
              </div>
            )
          })}
        </div>
        <div className="border-t border-line px-3 py-2 text-[12px] text-muted">
          {lab.vessels.length} vessels in view. One photo every {CAPTURE_MINUTES} min.
        </div>
      </section>

      <section>
        <h2 className="label mb-2">Needs attention</h2>
        {flagged.length === 0 ? (
          <p className="card m-0 px-3 py-3 text-[13px] text-muted">No vessels are flagged right now.</p>
        ) : (
          <div className="card divide-y divide-line">
            {flagged.map((v) => (
              <VesselRow key={v.def.id} vessel={v} note={attentionNote(v)} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="label">All vessels</h2>
          <span className="text-[12px] text-muted">Risk score, last 24 h</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {lab.vessels.map((v) => (
            <VesselCard key={v.def.id} vessel={v} />
          ))}
        </div>
      </section>
    </div>
  )
}
