// Stateless seeded noise: the same (seed, keys) always gives the same value,
// so a run does not depend on the order things are computed in.
export function hash01(seed: number, ...keys: number[]): number {
  let h = seed | 0
  for (const k of keys) {
    h = Math.imul(h ^ (k | 0), 0x9e3779b1)
    h ^= h >>> 15
  }
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}
