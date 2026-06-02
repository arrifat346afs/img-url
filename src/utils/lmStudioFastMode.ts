export const LMSTUDIO_FAST_MODE_MIN_CONCURRENCY = 1
export const LMSTUDIO_FAST_MODE_MAX_CONCURRENCY = 5

export function clampLmstudioFastModeConcurrency(value: number): number {
  if (!Number.isFinite(value)) {
    return LMSTUDIO_FAST_MODE_MAX_CONCURRENCY
  }

  return Math.min(
    LMSTUDIO_FAST_MODE_MAX_CONCURRENCY,
    Math.max(LMSTUDIO_FAST_MODE_MIN_CONCURRENCY, Math.round(value)),
  )
}