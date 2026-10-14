import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle,
  Eye,
  Prohibit,
  WarningOctagon,
  type Icon,
} from '@phosphor-icons/react'
import { STATUS_LABEL, trendOf, type Status, type Trend, type VesselState } from '../sim/engine'

export const STATUS_META: Record<Status, { Icon: Icon; tag: string; text: string; hex: string }> = {
  healthy: { Icon: CheckCircle, tag: 'bg-healthy-bg text-healthy', text: 'text-healthy', hex: '#346538' },
  check: { Icon: Eye, tag: 'bg-check-bg text-check', text: 'text-check', hex: '#956400' },
  likely: { Icon: WarningOctagon, tag: 'bg-likely-bg text-likely', text: 'text-likely', hex: '#9f2f2d' },
}

const TAG = 'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap'

export function StatusTag({ status, short = false }: { status: Status; short?: boolean }) {
  const { Icon, tag } = STATUS_META[status]
  const label = short && status === 'likely' ? 'Likely' : STATUS_LABEL[status]
  return (
    <span className={`${TAG} ${tag}`}>
      <Icon weight="bold" size={12} aria-hidden />
      {label}
    </span>
  )
}

export function IsolatedTag() {
  return (
    <span className={`${TAG} bg-sunken text-muted`}>
      <Prohibit weight="bold" size={12} aria-hidden />
      Isolated
    </span>
  )
}

export const riskPct = (risk: number) => Math.round(risk * 100)

const TREND: Record<Trend, { Icon: Icon; label: string }> = {
  rising: { Icon: ArrowUpRight, label: 'Rising' },
  steady: { Icon: ArrowRight, label: 'Steady' },
  falling: { Icon: ArrowDownRight, label: 'Falling' },
}

export function TrendMark({ vessel, withLabel = false }: { vessel: VesselState; withLabel?: boolean }) {
  const { Icon, label } = TREND[trendOf(vessel)]
  return (
    <span className="inline-flex items-center gap-1 text-muted" title={`Risk ${label.toLowerCase()} over 3 h`}>
      <Icon weight="bold" size={14} aria-label={withLabel ? undefined : label} />
      {withLabel && <span className="text-[13px]">{label}</span>}
    </span>
  )
}
