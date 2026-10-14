import { VesselRow } from '../components/VesselRow'
import { BATCH_BUMP } from '../sim/config'
import { latest, type VesselState } from '../sim/engine'
import { useLabState } from '../store/useLab'

export function Batches() {
  const lab = useLabState()
  const batches = new Map<string, VesselState[]>()
  for (const v of lab.vessels) batches.set(v.def.batch, [...(batches.get(v.def.batch) ?? []), v])

  return (
    <div className="space-y-5 p-4">
      <div>
        <h1 className="label m-0">Media batches</h1>
        <p className="m-0 mt-1 text-[13px] leading-5 text-muted">
          When a vessel is flagged as likely contaminated, the risk of the other vessels poured from the same
          media batch is raised so they get inspected first.
        </p>
      </div>
      {[...batches].map(([batch, vessels]) => {
        const { operator, hood, culture } = vessels[0].def
        const source = vessels.find((v) => v.status === 'likely' && !v.isolated)
        return (
          <section key={batch} className="card">
            <div className="px-3 py-3">
              <div className="flex items-baseline justify-between">
                <h2 className="num m-0 text-base font-medium">{batch}</h2>
                <span className="text-[12px] text-muted">{vessels.length} vessels</span>
              </div>
              <div className="mt-0.5 text-[13px] text-muted">
                <i>{culture}</i> · {operator} · Hood session <span className="num">{hood}</span>
              </div>
            </div>
            {source && (
              <div className="border-t border-line bg-likely-bg px-3 py-2 text-[13px] leading-5 text-likely">
                Risk raised by <span className="num font-medium">{Math.round(BATCH_BUMP * 100)}</span> points for
                this batch because <span className="num font-medium">{source.def.id}</span> is flagged.
              </div>
            )}
            <div className="divide-y divide-line border-t border-line">
              {vessels.map((v) => (
                <VesselRow
                  key={v.def.id}
                  vessel={v}
                  note={latest(v).batchRaised ? 'Batch risk raised' : v.def.hasVoc ? 'Camera and GC-IMS' : 'Camera only'}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
