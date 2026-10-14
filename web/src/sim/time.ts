import { CAPTURE_MINUTES, START_HOUR, TICKS_PER_DAY } from './config'

export const dayOf = (tick: number) => Math.floor(tick / TICKS_PER_DAY) + 1

export function clockOf(tick: number): string {
  const minutes = (START_HOUR * 60 + tick * CAPTURE_MINUTES) % (24 * 60)
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export const stampOf = (tick: number) => `Day ${dayOf(tick)} · ${clockOf(tick)}`

export function hoursLabel(ticks: number): string {
  const h = (ticks * CAPTURE_MINUTES) / 60
  return Number.isInteger(h) ? `${h} h` : `${h.toFixed(1)} h`
}
