import { create } from 'zustand'
import { Simulator } from '../data/source'
import type { LabState } from '../sim/engine'

export const SPEEDS = [1, 4, 16] as const
export type Speed = (typeof SPEEDS)[number]

interface LabStore {
  lab: LabState
  rev: number // bumped on every change; the lab object itself is mutated in place
  playing: boolean
  speed: Speed
  play(): void
  pause(): void
  setSpeed(speed: Speed): void
  jumpTo(tick: number): void
  reset(): void
  isolate(vesselId: string): void
  markInspected(vesselId: string): void
  inoculate(vesselId: string): void
}

const sim = new Simulator()
// `?tick=150` opens the demo at a chosen capture, for sharing a specific moment.
const startTick = Number(new URLSearchParams(window.location.search).get('tick'))
if (Number.isInteger(startTick) && startTick > 0) sim.jumpTo(startTick)
let timer: ReturnType<typeof setInterval> | undefined

export const useLab = create<LabStore>((set, get) => {
  const stop = () => {
    clearInterval(timer)
    timer = undefined
  }
  const start = () => {
    stop()
    timer = setInterval(() => {
      sim.step()
      if (sim.atEnd) get().pause()
    }, 1000 / get().speed)
  }

  sim.subscribe(() => set((s) => ({ lab: sim.snapshot(), rev: s.rev + 1 })))

  return {
    lab: sim.snapshot(),
    rev: 0,
    playing: false,
    speed: 4,
    play() {
      if (sim.atEnd) return
      set({ playing: true })
      start()
    },
    pause() {
      stop()
      set({ playing: false })
    },
    setSpeed(speed) {
      set({ speed })
      if (get().playing) start()
    },
    jumpTo: (tick) => sim.jumpTo(tick),
    reset() {
      get().pause()
      sim.reset()
    },
    isolate: sim.isolate,
    markInspected: sim.markInspected,
    inoculate: sim.inoculate,
  }
})

/** The current lab snapshot, re-rendering on every capture or action. */
export function useLabState(): LabState {
  useLab((s) => s.rev)
  return useLab.getState().lab
}
