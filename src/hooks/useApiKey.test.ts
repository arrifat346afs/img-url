import { describe, expect, it } from 'vitest'

import { DEFAULT_LMSTUDIO_BASE_URL } from '../utils/lmStudio'
import { DEFAULT_LMSTUDIO_PROXY_URL } from '../utils/lmStudioDirect'
import { getDefaultLmStudioBaseUrl, resolveLmStudioBaseUrl } from './useApiKey'

describe('getDefaultLmStudioBaseUrl', () => {
  it('returns the server-proxy default when direct fetch is disabled', () => {
    expect(getDefaultLmStudioBaseUrl(false)).toBe(DEFAULT_LMSTUDIO_BASE_URL)
  })

  it('returns the local proxy default when direct fetch is enabled', () => {
    expect(getDefaultLmStudioBaseUrl(true)).toBe(DEFAULT_LMSTUDIO_PROXY_URL)
  })
})

describe('resolveLmStudioBaseUrl', () => {
  it('falls back to the mode-specific default when the input is blank', () => {
    expect(resolveLmStudioBaseUrl('', false)).toBe(DEFAULT_LMSTUDIO_BASE_URL)
    expect(resolveLmStudioBaseUrl('', true)).toBe(DEFAULT_LMSTUDIO_PROXY_URL)
  })

  it('switches between the known default URLs when the mode changes', () => {
    expect(resolveLmStudioBaseUrl(DEFAULT_LMSTUDIO_BASE_URL, true)).toBe(DEFAULT_LMSTUDIO_PROXY_URL)
    expect(resolveLmStudioBaseUrl(DEFAULT_LMSTUDIO_PROXY_URL, false)).toBe(DEFAULT_LMSTUDIO_BASE_URL)
  })

  it('preserves custom LM Studio URLs', () => {
    expect(resolveLmStudioBaseUrl('http://192.168.1.50:1234/v1', true)).toBe('http://192.168.1.50:1234/v1')
  })
})