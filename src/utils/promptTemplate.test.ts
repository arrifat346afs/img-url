import { describe, expect, it } from 'vitest'
import { ANALYZE_IMAGE_PROMPT } from './promptTemplate'

describe('ANALYZE_IMAGE_PROMPT', () => {
  it('instructs the model to enumerate every distinct visual element (vector)', () => {
    expect(ANALYZE_IMAGE_PROMPT).toMatch(/every distinct visual element/i)
    expect(ANALYZE_IMAGE_PROMPT).toMatch(/list each element individually/i)
    expect(ANALYZE_IMAGE_PROMPT).toMatch(/do not merge multiple elements/i)
  })

  it('enforces a compact length rule', () => {
    expect(ANALYZE_IMAGE_PROMPT).toMatch(/50-90 words/i)
    expect(ANALYZE_IMAGE_PROMPT).toMatch(/one line/i)
    expect(ANALYZE_IMAGE_PROMPT).toMatch(/no full sentences/i)
  })

  it('keeps the critical output constraints', () => {
    expect(ANALYZE_IMAGE_PROMPT).toMatch(/return only the prompt text/i)
    expect(ANALYZE_IMAGE_PROMPT).toMatch(/do not use markdown/i)
    expect(ANALYZE_IMAGE_PROMPT).toMatch(/aspect ratio notation/i)
  })
})
