import { Dialog } from '@base-ui/react/dialog'
import { ArrowCounterClockwise, Pause, Play, X } from '@phosphor-icons/react'
import { useState } from 'react'
import { LAST_TICK, TICKS_PER_DAY, TOTAL_DAYS } from '../sim/config'
import { dayOf, stampOf } from '../sim/time'
import { SPEEDS, useLab, useLabState } from '../store/useLab'

const SEG = 'press h-11 flex-1 border-r border-line text-[14px] font-medium last:border-r-0'

export function DemoControls({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const lab = useLabState()
  const { playing, speed, play, pause, setSpeed, jumpTo, reset, inoculate } = useLab()
  const clean = lab.vessels.filter((v) => v.onsetTick === null && !v.isolated)
  const [picked, setPicked] = useState('')
  const target = clean.some((v) => v.def.id === picked) ? picked : (clean[0]?.def.id ?? '')
  const atEnd = lab.tick >= LAST_TICK

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-ink/30 transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-x-0 bottom-0 mx-auto max-h-[85dvh] w-full max-w-[430px] overflow-y-auto overscroll-contain rounded-t-xl border border-b-0 border-line bg-surface px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] transition-transform duration-200 ease-out data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full">
          <div className="flex items-center justify-between">
            <div>
              <Dialog.Title className="m-0 text-base font-semibold">Demo controls</Dialog.Title>
              <Dialog.Description className="num m-0 text-[12px] text-muted">
                Simulation at {stampOf(lab.tick)}
              </Dialog.Description>
            </div>
            <Dialog.Close className="press grid size-11 place-items-center rounded-md" aria-label="Close">
              <X weight="bold" size={18} />
            </Dialog.Close>
          </div>

          <div className="mt-3 space-y-4">
            <div>
              <div className="label mb-1.5">Playback</div>
              <div className="flex gap-2">
                <button className="btn btn-primary press w-28" onClick={playing ? pause : play} disabled={atEnd}>
                  {playing ? <Pause weight="fill" size={14} /> : <Play weight="fill" size={14} />}
                  {playing ? 'Pause' : 'Play'}
                </button>
                <div className="flex flex-1 overflow-hidden rounded-md border border-line" role="group" aria-label="Speed">
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      className={`${SEG} num ${s === speed ? 'bg-ink text-white' : ''}`}
                      aria-pressed={s === speed}
                      onClick={() => setSpeed(s)}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
              <p className="m-0 mt-1.5 text-[12px] text-muted">
                1x is one photo per second, which is 30 minutes of lab time.
              </p>
            </div>

            <div>
              <div className="label mb-1.5">Jump to day</div>
              <div className="flex overflow-hidden rounded-md border border-line">
                {Array.from({ length: TOTAL_DAYS }, (_, d) => (
                  <button
                    key={d}
                    className={`${SEG} num ${dayOf(lab.tick) === d + 1 ? 'bg-sunken' : ''}`}
                    onClick={() => jumpTo(d * TICKS_PER_DAY)}
                  >
                    {d + 1}
                  </button>
                ))}
              </div>
              <p className="m-0 mt-1.5 text-[12px] text-muted">
                Jumping back undoes actions taken after that point.
              </p>
            </div>

            <div>
              <div className="label mb-1.5">Inoculate a vessel</div>
              <div className="flex gap-2">
                <select
                  className="num h-11 min-w-0 flex-1 rounded-md border border-line bg-surface px-3"
                  value={target}
                  onChange={(e) => setPicked(e.target.value)}
                  aria-label="Vessel to inoculate"
                >
                  {clean.map((v) => (
                    <option key={v.def.id} value={v.def.id}>
                      {v.def.id} · {v.def.hasVoc ? 'camera + GC-IMS' : 'camera only'}
                    </option>
                  ))}
                </select>
                <button className="btn press" disabled={!target} onClick={() => inoculate(target)}>
                  Inoculate
                </button>
              </div>
              <p className="m-0 mt-1.5 text-[12px] text-muted">
                Starts contamination now. Expect a flag after about a day of lab time, sooner with GC-IMS.
              </p>
            </div>

            <button className="btn press w-full" onClick={reset}>
              <ArrowCounterClockwise weight="bold" size={15} />
              Reset to Day 3
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
