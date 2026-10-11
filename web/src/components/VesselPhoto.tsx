import { useId } from 'react'
import { LAST_TICK, SEED } from '../sim/config'
import type { Capture, VesselState } from '../sim/engine'
import { hash01 } from '../sim/prng'

// There are no real photos yet, so each capture is drawn from the simulated
// state: haze or fungal growth in the medium, and fog on the glass.

const W = 120
const H = 150

function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const ch = (shift: number) => {
    const x = (pa >> shift) & 255
    const y = (pb >> shift) & 255
    return Math.round(x + (y - x) * t)
  }
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`
}

interface Props {
  vessel: VesselState
  capture: Capture
  heatmap?: boolean
  className?: string
}

export function VesselPhoto({ vessel, capture, heatmap = false, className }: Props) {
  const uid = useId()
  const { def, index, contaminant } = vessel
  const { growth, fog, tick } = capture
  const rnd = (k: number) => hash01(SEED, index, k, 77)

  const jar = def.kind === 'jar'
  const body = jar ? { x: 22, y: 34, w: 76, h: 104, r: 10 } : { x: 41, y: 20, w: 38, h: 118, r: 17 }
  const cap = jar ? { x: 27, y: 21, w: 66, h: 15 } : { x: 38, y: 10, w: 44, h: 14 }
  const cx = body.x + body.w / 2
  const mediumTop = body.y + body.h * (jar ? 0.68 : 0.72)
  const bottom = body.y + body.h

  const bacterial = contaminant === 'bacterial' ? growth : 0
  const fungal = contaminant === 'fungal' ? growth : 0
  const locus = {
    x: cx + (rnd(1) - 0.5) * body.w * 0.4,
    y: fungal ? mediumTop - 1 : mediumTop + (bottom - mediumTop) * 0.4,
  }

  // The plantlet keeps growing through the run.
  const age = tick / LAST_TICK
  const stemH = (jar ? 30 : 40) * (0.55 + 0.45 * age) * (0.85 + 0.3 * rnd(2))
  const lean = (rnd(3) - 0.5) * 8
  const tip = { x: cx + lean, y: mediumTop - stemH }
  const leaf = mix('#5e8a4e', '#a39c55', growth * 0.7)
  const leaves = [0.45, 0.72, 1].map((t, k) => ({
    x: cx + lean * t,
    y: mediumTop - stemH * t,
    side: k % 2 === 0 ? 1 : -1,
    size: (jar ? 8 : 6.5) * (0.7 + 0.3 * t) * (0.6 + 0.4 * age),
  }))

  const specks = Array.from({ length: Math.round(fungal * 16) }, (_, k) => ({
    x: locus.x + (rnd(20 + k) - 0.5) * (10 + fungal * body.w * 0.55),
    y: locus.y - rnd(40 + k) * (2 + fungal * 9),
    r: 1.2 + rnd(60 + k) * (1 + fungal * 3.2),
  }))

  const heat = Math.min(1, Math.max(0, (capture.image - 0.12) / 0.55))
  const heatAt = fog > 0 ? { x: cx, y: body.y + body.h * 0.3 } : locus

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      role="img"
      aria-label={`Simulated photo of ${def.kind} ${def.id}`}
      style={{ background: "#e7eaea" }}
    >
      <defs>
        <clipPath id={`${uid}-body`}>
          <rect x={body.x} y={body.y} width={body.w} height={body.h} rx={body.r} />
        </clipPath>
        <filter id={`${uid}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.2" />
        </filter>
        <radialGradient id={`${uid}-heat`}>
          <stop offset="0%" stopColor="#b3261e" stopOpacity="0.9" />
          <stop offset="45%" stopColor="#d9722b" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#e9b949" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width={W} height={H} fill="#e7eaea" />
      <rect x="0" y={bottom + 2} width={W} height={H - bottom - 2} fill="#d9dddd" />

      <g clipPath={`url(#${uid}-body)`}>
        <rect x={body.x} y={body.y} width={body.w} height={body.h} fill="#f3f5f4" />
        <rect
          x={body.x}
          y={mediumTop}
          width={body.w}
          height={bottom - mediumTop}
          fill={mix('#e6dcb6', '#cfc7a2', Math.max(bacterial, fungal * 0.5))}
        />
        <rect x={body.x} y={mediumTop} width={body.w} height="1.5" fill="#d6caa0" />

        {bacterial > 0.02 && (
          <g filter={`url(#${uid}-blur)`} opacity={Math.min(0.9, bacterial)}>
            <ellipse cx={locus.x} cy={locus.y} rx={6 + bacterial * body.w * 0.5} ry={4 + bacterial * 12} fill="#f6f3e6" />
            <ellipse cx={cx + lean * 0.2} cy={mediumTop + 2} rx={3 + bacterial * 9} ry={2 + bacterial * 4} fill="#f1eedd" />
          </g>
        )}

        <path
          d={`M ${cx} ${mediumTop + 6} Q ${cx + lean * 0.2} ${mediumTop - stemH * 0.5} ${tip.x} ${tip.y}`}
          stroke="#6f9457"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
        {leaves.map((l, k) => (
          <ellipse
            key={k}
            cx={l.x + l.side * l.size * 0.8}
            cy={l.y - l.size * 0.25}
            rx={l.size}
            ry={l.size * 0.42}
            fill={leaf}
            transform={`rotate(${-l.side * 28} ${l.x} ${l.y})`}
          />
        ))}

        {specks.map((s, k) => (
          <circle key={k} cx={s.x} cy={s.y} r={s.r} fill="#f8f8f3" stroke="#b4b9ae" strokeWidth="0.5" opacity="0.92" />
        ))}
        {fungal > 0.6 &&
          specks.slice(0, 5).map((s, k) => <circle key={k} cx={s.x} cy={s.y} r={s.r * 0.35} fill="#6f7667" />)}

        {fog > 0 && (
          <g>
            <rect x={body.x} y={body.y} width={body.w} height={mediumTop - body.y} fill="#ffffff" opacity={fog * 0.75} />
            {Array.from({ length: 9 }, (_, k) => (
              <circle
                key={k}
                cx={body.x + 4 + rnd(80 + k) * (body.w - 8)}
                cy={body.y + 10 + rnd(90 + k) * (mediumTop - body.y - 20)}
                r={0.8 + rnd(100 + k) * 1.3}
                fill="#dfe5e5"
                stroke="#b9c2c2"
                strokeWidth="0.4"
                opacity={Math.min(1, fog * 1.6)}
              />
            ))}
          </g>
        )}

        {heatmap && heat > 0.03 && (
          <ellipse
            cx={heatAt.x}
            cy={heatAt.y}
            rx={10 + heat * body.w * 0.6}
            ry={8 + heat * 26}
            fill={`url(#${uid}-heat)`}
            opacity={0.35 + heat * 0.65}
          />
        )}
      </g>

      <rect
        x={body.x}
        y={body.y}
        width={body.w}
        height={body.h}
        rx={body.r}
        fill="none"
        stroke="#a9b2b2"
        strokeWidth="1.2"
      />
      <line
        x1={body.x + 4}
        y1={body.y + 14}
        x2={body.x + 4}
        y2={mediumTop - 8}
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.9"
      />
      <rect x={cap.x} y={cap.y} width={cap.w} height={cap.h} rx="3" fill="#c3caca" stroke="#a9b2b2" strokeWidth="1" />
    </svg>
  )
}
