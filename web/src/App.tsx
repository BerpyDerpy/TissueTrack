import { BellSimple, Pause, Play, SlidersHorizontal, SquaresFour, Stack, type Icon } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { Alerts } from './screens/Alerts'
import { Batches } from './screens/Batches'
import { DemoControls } from './screens/DemoControls'
import { Rack } from './screens/Rack'
import { VesselDetail } from './screens/VesselDetail'
import { needsAttention } from './sim/engine'
import { stampOf } from './sim/time'
import { useLab, useLabState } from './store/useLab'

function Header({ onOpenControls }: { onOpenControls: () => void }) {
  const lab = useLabState()
  const playing = useLab((s) => s.playing)
  const play = useLab((s) => s.play)
  const pause = useLab((s) => s.pause)

  return (
    <header className="border-b border-line bg-surface px-4 pt-[env(safe-area-inset-top)]">
      <div className="flex h-13 items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-tight">TissueTrack</span>
            <span className="rounded-full border border-line px-1.5 py-px text-[10px] font-medium tracking-wider text-muted uppercase">
              Simulated data
            </span>
          </div>
          <div className="num text-[12px] text-muted">Last capture {stampOf(lab.tick)}</div>
        </div>
        <button
          className="press grid size-11 place-items-center rounded-md border border-line"
          onClick={playing ? pause : play}
          aria-label={playing ? 'Pause simulation' : 'Play simulation'}
        >
          {playing ? <Pause weight="fill" size={16} /> : <Play weight="fill" size={16} />}
        </button>
        <button
          className="press grid size-11 place-items-center rounded-md border border-line"
          onClick={onOpenControls}
          aria-label="Demo controls"
        >
          <SlidersHorizontal weight="bold" size={18} />
        </button>
      </div>
    </header>
  )
}

function Tab({ to, label, Icon, badge }: { to: string; label: string; Icon: Icon; badge?: number }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `press relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive ? 'text-ink' : 'text-muted'}`
      }
    >
      {({ isActive }) => (
        <>
          <span className="relative">
            <Icon size={22} weight={isActive ? 'fill' : 'bold'} aria-hidden />
            {!!badge && (
              <span className="num absolute -top-1 -right-2.5 grid h-4 min-w-4 place-items-center rounded-full bg-likely px-1 text-[10px] text-white">
                {badge}
                <span className="sr-only"> need attention</span>
              </span>
            )}
          </span>
          {label}
        </>
      )}
    </NavLink>
  )
}

export default function App() {
  const lab = useLabState()
  const [controlsOpen, setControlsOpen] = useState(false)
  const { pathname } = useLocation()
  const main = useRef<HTMLElement>(null)
  const attention = lab.vessels.filter(needsAttention).length

  useEffect(() => {
    main.current?.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="mx-auto flex h-dvh max-w-[430px] flex-col bg-canvas sm:border-x sm:border-line">
      <Header onOpenControls={() => setControlsOpen(true)} />
      <main ref={main} className="flex-1 overflow-y-auto overscroll-contain">
        <Routes>
          <Route path="/" element={<Rack />} />
          <Route path="/vessel/:id" element={<VesselDetail />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/batches" element={<Batches />} />
        </Routes>
      </main>
      <nav className="flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]" aria-label="Sections">
        <Tab to="/" label="Rack" Icon={SquaresFour} badge={attention} />
        <Tab to="/alerts" label="Alerts" Icon={BellSimple} />
        <Tab to="/batches" label="Batches" Icon={Stack} />
      </nav>
      <DemoControls open={controlsOpen} onOpenChange={setControlsOpen} />
    </div>
  )
}
