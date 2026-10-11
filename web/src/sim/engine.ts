import {
  BATCH_BUMP,
  CHECK_STREAK,
  CHECK_THRESHOLD,
  COMPOUNDS,
  IMAGE_MID,
  IMAGE_SCALE,
  LIKELY_STREAK,
  LIKELY_THRESHOLD,
  RELEASE_MARGIN,
  RELEASE_STREAK,
  SEED,
  VOC_ABNORMAL,
  VOC_FRESH_TICKS,
  VOC_INTERVAL_TICKS,
  VOC_MID,
  VOC_SCALE,
  W_IMAGE,
  W_VOC,
} from './config'
import { hash01 } from './prng'
import { VESSELS, type Contaminant, type VesselDef } from './scenario'

export type Status = 'healthy' | 'check' | 'likely'

export interface VocReading {
  tick: number
  score: number
  peaks: number[]
}

export interface Capture {
  tick: number
  image: number
  voc: VocReading | null // the reading used in fusion, if one is recent enough
  risk: number
  status: Status
  batchRaised: boolean
  // What the simulated photo shows; a real system would store the image itself.
  growth: number
  fog: number
}

export interface VesselState {
  def: VesselDef
  index: number
  onsetTick: number | null
  contaminant: Contaminant | null
  history: Capture[]
  vocReadings: VocReading[]
  status: Status
  isolated: boolean
  inspectedStatus: Status | null
  vocFlagged: boolean
  streaks: { check: number; likely: number; belowCheck: number; belowLikely: number }
}

export type LabEventKind = 'status' | 'voc' | 'batch' | 'action'

export interface LabEvent {
  id: number
  tick: number
  kind: LabEventKind
  vesselId: string
  status?: Status
  title: string
  detail: string
}

export type ActionKind = 'isolate' | 'inspect' | 'inoculate'

export interface UserAction {
  tick: number
  kind: ActionKind
  vesselId: string
}

export interface LabState {
  seed: number
  tick: number // tick of the latest capture; -1 before the first
  vessels: VesselState[]
  events: LabEvent[]
}

export const STATUS_LABEL: Record<Status, string> = {
  healthy: 'Healthy',
  check: 'Check soon',
  likely: 'Likely contaminated',
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const logistic = (x: number) => 1 / (1 + Math.exp(-x))

export function createLab(seed = SEED, defs: VesselDef[] = VESSELS): LabState {
  return {
    seed,
    tick: -1,
    events: [],
    vessels: defs.map((def, index) => ({
      def,
      index,
      onsetTick: def.onsetTick ?? null,
      contaminant: def.contaminant ?? null,
      history: [],
      vocReadings: [],
      status: 'healthy',
      isolated: false,
      inspectedStatus: null,
      vocFlagged: false,
      streaks: { check: 0, likely: 0, belowCheck: 0, belowLikely: 0 },
    })),
  }
}

function growthAt(v: VesselState, tick: number, mid: number, scale: number): number {
  if (v.onsetTick === null || tick < v.onsetTick) return 0
  return logistic((tick - v.onsetTick - mid) / scale)
}

function fogAt(v: VesselState, tick: number): number {
  const start = v.def.condensationTick
  if (start === undefined) return 0
  if (tick === start) return 0.62
  if (tick === start + 1) return 0.28
  return 0
}

function pushEvent(lab: LabState, e: Omit<LabEvent, 'id'>) {
  lab.events.push({ ...e, id: lab.events.length })
}

function nextStatus(v: VesselState, risk: number): Status {
  const s = v.streaks
  s.check = risk >= CHECK_THRESHOLD ? s.check + 1 : 0
  s.likely = risk >= LIKELY_THRESHOLD ? s.likely + 1 : 0
  s.belowCheck = risk < CHECK_THRESHOLD - RELEASE_MARGIN ? s.belowCheck + 1 : 0
  s.belowLikely = risk < LIKELY_THRESHOLD - RELEASE_MARGIN ? s.belowLikely + 1 : 0

  if (s.likely >= LIKELY_STREAK) return 'likely'
  if (v.status === 'likely') {
    if (s.belowCheck >= RELEASE_STREAK) return 'healthy'
    return s.belowLikely >= RELEASE_STREAK ? 'check' : 'likely'
  }
  if (v.status === 'check') return s.belowCheck >= RELEASE_STREAK ? 'healthy' : 'check'
  return s.check >= CHECK_STREAK ? 'check' : 'healthy'
}

/** Take the next capture of every vessel. Mutates and returns `lab`. */
export function advance(lab: LabState): LabState {
  const tick = lab.tick + 1
  const { seed } = lab

  // Batches that had a flagged, un-isolated vessel as of the previous capture.
  const raisedBy = new Map<string, string>()
  for (const v of lab.vessels) {
    if (v.status === 'likely' && !v.isolated && !raisedBy.has(v.def.batch)) {
      raisedBy.set(v.def.batch, v.def.id)
    }
  }

  for (const v of lab.vessels) {
    const i = v.index
    const growth = growthAt(v, tick, IMAGE_MID, IMAGE_SCALE)
    const fog = fogAt(v, tick)
    const image = clamp01(0.03 + 0.05 * hash01(seed, i, tick, 1) + 0.92 * growth + fog)

    if (v.def.hasVoc && tick % VOC_INTERVAL_TICKS === i % VOC_INTERVAL_TICKS) {
      const latent = growthAt(v, tick, VOC_MID, VOC_SCALE)
      const kind = v.contaminant ?? 'bacterial'
      const reading: VocReading = {
        tick,
        score: clamp01(0.04 + 0.06 * hash01(seed, i, tick, 2) + 0.9 * latent),
        peaks: COMPOUNDS.map(
          (c, k) => c.mean * (0.88 + 0.24 * hash01(seed, i, tick, 10 + k)) + latent * c.gain[kind],
        ),
      }
      v.vocReadings.push(reading)
      if (!v.vocFlagged && reading.score >= VOC_ABNORMAL) {
        v.vocFlagged = true
        pushEvent(lab, {
          tick,
          kind: 'voc',
          vesselId: v.def.id,
          title: 'Abnormal VOC pattern',
          detail: 'GC-IMS peak volumes are outside the healthy range.',
        })
      }
    }

    const last = v.vocReadings[v.vocReadings.length - 1]
    const voc = last && tick - last.tick <= VOC_FRESH_TICKS ? last : null

    const source = raisedBy.get(v.def.batch)
    const batchRaised = source !== undefined && source !== v.def.id
    const fused = 1 - (1 - W_IMAGE * image) * (1 - W_VOC * (voc?.score ?? 0))
    const risk = clamp01(fused + (batchRaised ? BATCH_BUMP : 0))

    const status = nextStatus(v, risk)
    if (status !== v.status) {
      pushEvent(lab, {
        tick,
        kind: 'status',
        vesselId: v.def.id,
        status,
        title: STATUS_LABEL[status],
        detail:
          status === 'likely'
            ? `Risk stayed at or above ${LIKELY_THRESHOLD * 100} for ${LIKELY_STREAK} photos. Isolate the vessel.`
            : status === 'check'
              ? `Risk stayed at or above ${CHECK_THRESHOLD * 100} for ${CHECK_STREAK} photos. Inspect the vessel.`
              : 'Risk has stayed low again.',
      })
      if (status === 'likely' && !v.isolated) {
        const siblings = lab.vessels.filter((o) => o.def.batch === v.def.batch && o !== v)
        pushEvent(lab, {
          tick,
          kind: 'batch',
          vesselId: v.def.id,
          title: `Batch ${v.def.batch} risk raised`,
          detail: `${siblings.length} other vessels share this media batch: ${siblings.map((o) => o.def.id).join(', ')}.`,
        })
      }
      v.status = status
    }

    v.history.push({ tick, image, voc, risk, status, batchRaised, growth, fog })
  }

  lab.tick = tick
  return lab
}

/** Apply a user action after the capture at `action.tick`. Mutates `lab`. */
export function applyAction(lab: LabState, action: UserAction) {
  const v = lab.vessels.find((o) => o.def.id === action.vesselId)
  if (!v) return
  const base = { tick: action.tick, kind: 'action' as const, vesselId: v.def.id }
  if (action.kind === 'isolate') {
    v.isolated = true
    pushEvent(lab, { ...base, title: 'Vessel isolated', detail: 'Marked as isolated by the researcher.' })
  } else if (action.kind === 'inspect') {
    v.inspectedStatus = v.status
    pushEvent(lab, { ...base, title: 'Inspected, looks clean', detail: 'Monitoring continues.' })
  } else if (v.onsetTick === null) {
    v.onsetTick = action.tick
    v.contaminant = 'bacterial'
    pushEvent(lab, {
      ...base,
      title: 'Demo: vessel inoculated',
      detail: 'Simulated contamination starts now.',
    })
  }
}

/** Rebuild the lab from scratch up to `tick`, replaying user actions on the way. */
export function runTo(tick: number, actions: UserAction[] = [], seed = SEED): LabState {
  const lab = createLab(seed)
  while (lab.tick < tick) {
    advance(lab)
    for (const a of actions) if (a.tick === lab.tick) applyAction(lab, a)
  }
  return lab
}

export const latest = (v: VesselState): Capture => v.history[v.history.length - 1]

export type Trend = 'rising' | 'steady' | 'falling'

/** Change in risk over the last 3 hours. */
export function trendOf(v: VesselState): Trend {
  const h = v.history
  if (h.length < 2) return 'steady'
  const delta = h[h.length - 1].risk - h[Math.max(0, h.length - 7)].risk
  return delta > 0.05 ? 'rising' : delta < -0.05 ? 'falling' : 'steady'
}

/** Flagged, not isolated, and not already inspected at this status. */
export function needsAttention(v: VesselState): boolean {
  return v.status !== 'healthy' && !v.isolated && v.inspectedStatus !== v.status
}
