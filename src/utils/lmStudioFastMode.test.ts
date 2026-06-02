import { describe, expect, it } from 'vitest'

import {
  clampLmstudioFastModeConcurrency,
  LMSTUDIO_FAST_MODE_MAX_CONCURRENCY,
  LMSTUDIO_FAST_MODE_MIN_CONCURRENCY,
} from './lmStudioFastMode'

describe('clampLmstudioFastModeConcurrency', () => {
  it('keeps supported values unchanged', () => {
    expect(clampLmstudioFastModeConcurrency(3)).toBe(3)
  })

  it('clamps values below the minimum', () => {
    expect(clampLmstudioFastModeConcurrency(0)).toBe(LMSTUDIO_FAST_MODE_MIN_CONCURRENCY)
  })

  it('clamps values above the maximum', () => {
    expect(clampLmstudioFastModeConcurrency(99)).toBe(LMSTUDIO_FAST_MODE_MAX_CONCURRENCY)
  })

  it('falls back to the maximum for invalid values', () => {
    expect(clampLmstudioFastModeConcurrency(Number.NaN)).toBe(LMSTUDIO_FAST_MODE_MAX_CONCURRENCY)
  })
})