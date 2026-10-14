export type Contaminant = 'bacterial' | 'fungal'

export interface VesselDef {
  id: string
  kind: 'tube' | 'jar'
  culture: string
  batch: string
  operator: string
  hood: string
  hasVoc: boolean
  onsetTick?: number
  contaminant?: Contaminant
  // First tick of a condensation episode: fog that looks like haze for one photo.
  condensationTick?: number
}

const A = { batch: 'MB-0412', operator: 'R. Iyer', hood: 'HS-A' }
const B = { batch: 'MB-0413', operator: 'S. Okafor', hood: 'HS-B' }
const C = { batch: 'MB-0415', operator: 'R. Iyer', hood: 'HS-C' }

const BANANA = 'Musa acuminata'
const POTATO = 'Solanum tuberosum'
const ORCHID = 'Dendrobium nobile'

export const VESSELS: VesselDef[] = [
  { id: 'T-01', kind: 'tube', culture: BANANA, ...A, hasVoc: true },
  { id: 'T-02', kind: 'tube', culture: BANANA, ...A, hasVoc: false },
  { id: 'T-03', kind: 'tube', culture: BANANA, ...A, hasVoc: true },
  { id: 'T-04', kind: 'tube', culture: BANANA, ...A, hasVoc: true, onsetTick: 60, contaminant: 'bacterial' },
  { id: 'J-01', kind: 'jar', culture: BANANA, ...A, hasVoc: true },
  { id: 'J-02', kind: 'jar', culture: BANANA, ...A, hasVoc: false, onsetTick: 96, contaminant: 'fungal' },
  { id: 'T-05', kind: 'tube', culture: POTATO, ...B, hasVoc: false },
  { id: 'T-06', kind: 'tube', culture: POTATO, ...B, hasVoc: true },
  { id: 'T-07', kind: 'tube', culture: POTATO, ...B, hasVoc: true },
  { id: 'J-03', kind: 'jar', culture: POTATO, ...B, hasVoc: false },
  { id: 'J-04', kind: 'jar', culture: POTATO, ...B, hasVoc: true },
  { id: 'T-08', kind: 'tube', culture: ORCHID, ...C, hasVoc: false },
  { id: 'T-09', kind: 'tube', culture: ORCHID, ...C, hasVoc: true, condensationTick: 130 },
  { id: 'T-10', kind: 'tube', culture: ORCHID, ...C, hasVoc: false },
  { id: 'J-05', kind: 'jar', culture: ORCHID, ...C, hasVoc: true },
  { id: 'J-06', kind: 'jar', culture: ORCHID, ...C, hasVoc: false },
]
