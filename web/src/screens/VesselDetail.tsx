import { CaretLeft } from '@phosphor-icons/react'
import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { RiskChart } from '../components/RiskChart'
import { IsolatedTag, StatusTag, TrendMark, riskPct } from '../components/status'
import { VesselPhoto } from '../components/VesselPhoto'
import { VesselRow } from '../components/VesselRow'
import { VocPanel } from '../components/VocPanel'
import { BASELINE_TICKS, BATCH_BUMP, TICKS_PER_DAY } from '../sim/config'
import { latest, type Capture, type VesselState } from '../sim/engine'
import { hoursLabel, stampOf } from '../sim/time'
import { useLab, useLabState } from '../store/useLab'

const SCRUB_SPAN = 2 * TICKS_PER_DAY // the last 48 h of photos

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="label">{title}</h2>
        {aside && <span className="text-[12px] text-muted">{aside}</span>}
      </div>
      {children}
    </section>
  )
}

function Meter({ label, value, note }: { label: string; value: number | null; note: string }) {
  return (
    <div className="px-3 py-3">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px]">{label}</span>
        <span className="num font-medium">{value === null ? 'n/a' : Math.round(value * 100)}</span>
      </div>
      <div className="mt-1.5 h-1 rounded-sm bg-sunken">
        {value !== null && <div className="h-1 rounded-sm bg-ink" style={{ width: `${value * 100}%` }} />}
      </div>
      <div className="mt-1.5 text-[12px] leading-5 text-muted">{note}</div>
    </div>
  )
}

function summary(v: VesselState, c: Capture): string {
  if (v.status === 'healthy') {
    if (c.fog > 0) return 'A short change in the photo, likely condensation. Not sustained, so no alert.'
    return c.batchRaised
      ? 'No concerning change. Risk is raised because a vessel from the same media batch is flagged.'
      : 'No concerning change in this vessel.'
  }
  if (c.voc && c.image < 0.2) return 'The VOC pattern is abnormal while the photo still looks clean. Inspect the vessel.'
  if (v.status === 'check') return 'A sustained change has been detected. Inspect the vessel.'
  return 'Strong, sustained evidence of contamination. Isolate the vessel and confirm in the lab.'
}

// Keyed by ID so the scrubber resets when moving between vessels.
export function VesselDetail() {
  const { id } = useParams()
  return <Detail key={id} id={id} />
}

function Detail({ id }: { id?: string }) {
  const lab = useLabState()
  const isolate = useLab((s) => s.isolate)
  const markInspected = useLab((s) => s.markInspected)
  const [heatmap, setHeatmap] = useState(true)
  const [back, setBack] = useState(0) // photos back from the latest

  const vessel = lab.vessels.find((v) => v.def.id === id)
  if (!vessel) {
    return (
      <div className="p-4">
        <p>No vessel with ID {id}.</p>
        <Link to="/" className="underline">
          Back to rack
        </Link>
      </div>
    )
  }

  const { def, history } = vessel
  const now = latest(vessel)
  const span = Math.min(SCRUB_SPAN, history.length)
  const offset = Math.min(back, span - 1)
  const shown = history[history.length - 1 - offset]
  const siblings = lab.vessels.filter((v) => v.def.batch === def.batch && v !== vessel)
  const lastReading = vessel.vocReadings[vessel.vocReadings.length - 1]
  const inspected = vessel.inspectedStatus === vessel.status

  return (
    <div className="space-y-5 p-4">
      <Link to="/" className="press -ml-1 inline-flex h-9 items-center gap-1 text-[13px] text-muted">
        <CaretLeft size={14} weight="bold" aria-hidden />
        Rack
      </Link>

      <section className="card -mt-2">
        <div className="flex items-start justify-between gap-3 p-3">
          <div className="min-w-0">
            <h1 className="num m-0 text-2xl leading-none font-medium">{def.id}</h1>
            <div className="mt-1 text-[13px] text-muted">
              {def.kind === 'jar' ? 'Jar' : 'Tube'}, <i>{def.culture}</i>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <StatusTag status={vessel.status} />
              {vessel.isolated && <IsolatedTag />}
            </div>
          </div>
          <div className="text-right">
            <div className="label">Risk</div>
            <div className="num text-[40px] leading-none font-medium">{riskPct(now.risk)}</div>
            <div className="mt-1 flex justify-end">
              <TrendMark vessel={vessel} withLabel />
            </div>
          </div>
        </div>
        <p className="m-0 border-t border-line px-3 py-2.5 text-[13px] leading-5">{summary(vessel, now)}</p>
        {!vessel.isolated && (
          <div className="flex gap-2 border-t border-line p-3">
            {vessel.status !== 'healthy' && (
              <button className="btn press flex-1" disabled={inspected} onClick={() => markInspected(def.id)}>
                {inspected ? 'Inspected' : 'Looks clean'}
              </button>
            )}
            <button
              className={`btn press flex-1 ${vessel.status === 'healthy' ? '' : 'btn-primary'}`}
              onClick={() => isolate(def.id)}
            >
              Isolate vessel
            </button>
          </div>
        )}
      </section>

      <Section title={offset === 0 ? 'Latest photo' : 'Earlier photo'} aside={stampOf(shown.tick)}>
        <div className="card overflow-hidden">
          <div className="relative">
            <VesselPhoto vessel={vessel} capture={shown} heatmap={heatmap} className="block aspect-[4/3] w-full" />
            <button
              className="press absolute top-2 right-2 rounded-md border border-line bg-surface px-2.5 py-1.5 text-[12px] font-medium"
              aria-pressed={heatmap}
              onClick={() => setHeatmap((h) => !h)}
            >
              Change heatmap {heatmap ? 'on' : 'off'}
            </button>
            {offset > 0 && (
              <span className="num absolute bottom-2 left-2 rounded-md bg-ink px-2 py-1 text-[12px] text-white">
                Risk {riskPct(shown.risk)}
              </span>
            )}
          </div>
          <div className="border-t border-line px-3 pt-1 pb-2.5">
            <input
              type="range"
              className="scrub"
              min={0}
              max={span - 1}
              value={span - 1 - offset}
              onChange={(e) => setBack(span - 1 - Number(e.target.value))}
              aria-label="Scrub through the last 48 hours of photos"
              aria-valuetext={stampOf(shown.tick)}
            />
            <div className="flex items-center justify-between text-[12px] text-muted">
              <span>{hoursLabel(span - 1)} ago</span>
              {offset > 0 ? (
                <button className="press font-medium text-ink underline" onClick={() => setBack(0)}>
                  Back to latest
                </button>
              ) : (
                <span>Now</span>
              )}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Risk over time" aside="0 to 100">
        <div className="card p-3">
          <RiskChart vessel={vessel} />
        </div>
      </Section>

      <Section title="Evidence" aside="Latest capture">
        <div className="card divide-y divide-line">
          <Meter
            label="Image change"
            value={now.image}
            note={
              now.tick < BASELINE_TICKS
                ? 'Still building this vessel’s 24 h baseline.'
                : 'Compared with this vessel’s own first 24 h of photos.'
            }
          />
          <Meter
            label="VOC abnormality"
            value={now.voc?.score ?? null}
            note={
              now.voc
                ? `GC-IMS reading from ${hoursLabel(now.tick - now.voc.tick)} ago.`
                : 'No GC-IMS reading for this vessel. The score uses the camera only.'
            }
          />
          {now.batchRaised && (
            <div className="px-3 py-3 text-[13px] leading-5">
              <span className="num font-medium">+{Math.round(BATCH_BUMP * 100)}</span> added because a vessel from
              media batch <span className="num">{def.batch}</span> is flagged.
            </div>
          )}
        </div>
      </Section>

      {lastReading && (
        <Section title="VOC peaks" aside={`Read ${stampOf(lastReading.tick)}`}>
          <div className="card p-3">
            <VocPanel reading={lastReading} />
          </div>
        </Section>
      )}

      <Section title="Context">
        <dl className="card m-0 divide-y divide-line text-[13px]">
          {[
            ['Media batch', def.batch],
            ['Operator', def.operator],
            ['Hood session', def.hood],
            ['Monitored for', hoursLabel(now.tick)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between px-3 py-2.5">
              <dt className="text-muted">{k}</dt>
              <dd className="num m-0">{v}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Same media batch" aside={def.batch}>
        <div className="card divide-y divide-line">
          {siblings.map((v) => (
            <VesselRow key={v.def.id} vessel={v} />
          ))}
        </div>
      </Section>
    </div>
  )
}
