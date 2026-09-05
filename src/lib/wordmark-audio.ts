export const AUDIO_BANDS = 32

function clamp01(value: number): number {
  if (value <= 0) return 0
  if (value >= 1) return 1
  return value
}

/**
 * One wordmark cell's 0..1 shade. Columns walk the spectrum; a kick lifts
 * the whole mark. Bands are scaled against the current peak so a loud mix
 * stays in the lower half until a kick hits.
 */
export function wordmarkAudioShade(
  col: number,
  row: number,
  width: number,
  bands: ArrayLike<number>,
  beat: number,
): number {
  const n = bands.length
  if (n <= 0 || width <= 0) return clamp01(beat)
  const x = ((col + row * 0.25) / width) * (n - 1)
  const i = Math.min(n - 1, Math.max(0, Math.floor(x)))
  const f = x - i
  const a = bands[i] ?? 0
  const b = bands[Math.min(n - 1, i + 1)] ?? a
  const spread = a * (1 - f) + b * f
  let maxBand = 0
  for (let k = 0; k < n; k++) {
    const v = bands[k] ?? 0
    if (v > maxBand) maxBand = v
  }
  const floor = maxBand * 0.12
  const span = maxBand - floor
  const norm = span > 0.06 ? Math.max(0, spread - floor) / span : spread
  return clamp01(norm * 0.45 + beat * 0.8)
}
