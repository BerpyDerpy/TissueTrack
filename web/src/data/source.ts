import { LAST_TICK, START_TICK } from '../sim/config'
import { advance, applyAction, runTo, type ActionKind, type LabState, type UserAction } from '../sim/engine'

/**
 * What the screens need from the lab server. The simulator implements it today;
 * a client for the FastAPI backend can implement it later without screen changes.
 */
export interface DataSource {
  snapshot(): LabState
  subscribe(listener: () => void): () => void
  isolate(vesselId: string): void
  markInspected(vesselId: string): void
}

export class Simulator implements DataSource {
  private lab = runTo(START_TICK)
  private actions: UserAction[] = []
  private listeners = new Set<() => void>()

  snapshot = () => this.lab

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  isolate = (vesselId: string) => this.act('isolate', vesselId)
  markInspected = (vesselId: string) => this.act('inspect', vesselId)
  inoculate = (vesselId: string) => this.act('inoculate', vesselId)

  get atEnd() {
    return this.lab.tick >= LAST_TICK
  }

  step() {
    if (this.atEnd) return
    advance(this.lab)
    this.emit()
  }

  /** Going back in time drops the user actions taken after `tick`. */
  jumpTo(tick: number) {
    const target = Math.min(LAST_TICK, Math.max(0, tick))
    if (target >= this.lab.tick) {
      while (this.lab.tick < target) advance(this.lab)
    } else {
      this.actions = this.actions.filter((a) => a.tick <= target)
      this.lab = runTo(target, this.actions)
    }
    this.emit()
  }

  reset() {
    this.actions = []
    this.lab = runTo(START_TICK)
    this.emit()
  }

  private act(kind: ActionKind, vesselId: string) {
    const action = { tick: this.lab.tick, kind, vesselId }
    this.actions.push(action)
    applyAction(this.lab, action)
    this.emit()
  }

  private emit() {
    for (const l of this.listeners) l()
  }
}
