import { describe, expect, it } from 'vitest'

import { readProxyRequest } from './lmStudioProxy'

describe('readProxyRequest', () => {
  it('returns null when TanStack server function data is missing', () => {
    expect(readProxyRequest(undefined)).toBeNull()
  })

  it('accepts valid LM Studio proxy request data', () => {
    expect(readProxyRequest({ path: '/models', baseUrl: 'http://localhost:1234/v1' })).toEqual({
      path: '/models',
      baseUrl: 'http://localhost:1234/v1',
    })
  })
})
