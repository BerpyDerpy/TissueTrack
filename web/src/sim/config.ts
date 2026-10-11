// Demo placeholders. The project notes leave the score range, thresholds and
// fusion formula unspecified, so every tunable lives here.

export const SEED = 20261011

export const CAPTURE_MINUTES = 30
export const TICKS_PER_DAY = (24 * 60) / CAPTURE_MINUTES
export const TOTAL_DAYS = 5
export const LAST_TICK = TOTAL_DAYS * TICKS_PER_DAY - 1
export const START_TICK = 2 * TICKS_PER_DAY // demo opens on Day 3, 08:00
export const START_HOUR = 8

// A vessel's first 24 h of photos are its own baseline.
export const BASELINE_TICKS = TICKS_PER_DAY

// GC-IMS readings are sparse: one every 6 h, and only for some vessels.
export const VOC_INTERVAL_TICKS = 12
export const VOC_FRESH_TICKS = 24

// Latent growth curves, in ticks after the onset of contamination.
export const VOC_MID = 24
export const VOC_SCALE = 6
export const IMAGE_MID = 60
export const IMAGE_SCALE = 9

// Fusion: risk = 1 - (1 - W_IMAGE * image)(1 - W_VOC * voc)
export const W_IMAGE = 0.9
export const W_VOC = 0.6

// Persistence rule: the score must stay high for consecutive photos.
export const CHECK_THRESHOLD = 0.4
export const CHECK_STREAK = 2
export const LIKELY_THRESHOLD = 0.7
export const LIKELY_STREAK = 3
// A status only relaxes after the score has stayed clearly lower for a while.
export const RELEASE_MARGIN = 0.1
export const RELEASE_STREAK = 4

export const VOC_ABNORMAL = 0.4
export const BATCH_BUMP = 0.12

// Illustrative compounds; a real panel would come from the lab's GC-IMS method.
export interface Compound {
  name: string
  mean: number
  lo: number
  hi: number
  gain: { bacterial: number; fungal: number }
}

export const COMPOUNDS: Compound[] = [
  { name: 'Ethanol', mean: 410, lo: 320, hi: 500, gain: { bacterial: 380, fungal: 520 } },
  { name: '2-Butanone', mean: 150, lo: 105, hi: 195, gain: { bacterial: 260, fungal: 60 } },
  { name: '3-Methyl-1-butanol', mean: 90, lo: 60, hi: 120, gain: { bacterial: 310, fungal: 240 } },
  { name: 'Dimethyl disulfide', mean: 35, lo: 20, hi: 50, gain: { bacterial: 190, fungal: 25 } },
  { name: '1-Octen-3-ol', mean: 28, lo: 15, hi: 42, gain: { bacterial: 12, fungal: 230 } },
  { name: 'Ethyl acetate', mean: 120, lo: 85, hi: 155, gain: { bacterial: 90, fungal: 170 } },
]
