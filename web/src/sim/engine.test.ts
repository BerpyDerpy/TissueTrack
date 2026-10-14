import { describe, expect, it } from 'vitest'
import { CHECK_THRESHOLD, LAST_TICK } from './config'
import { runTo, type LabState, type Status } from './engine'

const vessel = (lab: LabState, id: string) => lab.vessels.find((v) => v.def.id === id)!
const RANK: Record<Status, number> = { healthy: 0, check: 1, likely: 2 }

describe('simulation engine', () => {
  const lab = runTo(LAST_TICK)

  it('is reproducible for a given seed', () => {
    const again = runTo(LAST_TICK)
    expect(again.vessels.map((v) => v.history.map((c) => c.risk))).toEqual(
      lab.vessels.map((v) => v.history.map((c) => c.risk)),
    )
    expect(again.events).toEqual(lab.events)
  })

  it('ignores a one-photo condensation spike', () => {
    const v = vessel(lab, 'T-09')
    expect(v.history.some((c) => c.risk >= CHECK_THRESHOLD)).toBe(true)
    expect(v.history.every((c) => c.status === 'healthy')).toBe(true)
  })

  it('escalates a contaminated vessel in order, without flicker', () => {
    const ranks = vessel(lab, 'T-04').history.map((c) => RANK[c.status])
    expect(ranks.every((r, i) => i === 0 || r >= ranks[i - 1])).toBe(true)
    expect(new Set(ranks)).toEqual(new Set([0, 1, 2]))
  })

  it('flags on VOC evidence before the photo has changed', () => {
    const first = vessel(lab, 'T-04').history.find((c) => c.status === 'check')!
    expect(first.voc).not.toBeNull()
    expect(first.image).toBeLessThan(0.2)
  })

  it('still scores and flags a vessel with no VOC readings', () => {
    const v = vessel(lab, 'J-02')
    expect(v.history.every((c) => c.voc === null && Number.isFinite(c.risk))).toBe(true)
    expect(v.status).toBe('likely')
  })

  it('raises risk for vessels sharing a media batch with a flagged vessel', () => {
    const flaggedAt = vessel(lab, 'T-04').history.find((c) => c.status === 'likely')!.tick
    const sibling = vessel(lab, 'T-01')
    expect(sibling.history[flaggedAt].batchRaised).toBe(false)
    expect(sibling.history[flaggedAt + 1].batchRaised).toBe(true)
    expect(vessel(lab, 'T-06').history.some((c) => c.batchRaised)).toBe(false)
    expect(lab.events.some((e) => e.kind === 'batch' && e.vesselId === 'T-04')).toBe(true)
  })

  it('leaves untouched vessels healthy', () => {
    const flagged = lab.vessels.filter((v) => v.status !== 'healthy').map((v) => v.def.id)
    expect(flagged.sort()).toEqual(['J-02', 'T-04'])
  })

  it('applies user actions and replays them', () => {
    const acted = runTo(LAST_TICK, [
      { tick: 100, kind: 'inoculate', vesselId: 'T-07' },
      { tick: 130, kind: 'isolate', vesselId: 'T-04' },
    ])
    expect(vessel(acted, 'T-07').status).toBe('likely')
    expect(vessel(acted, 'T-04').isolated).toBe(true)
    // Isolating the source removes the batch bump from its siblings.
    expect(vessel(acted, 'T-01').history[140].batchRaised).toBe(false)
  })
})
