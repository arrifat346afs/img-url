import { describe, expect, it } from 'vitest'

import { resolveTargetAddressSpace } from './lmStudioDirect'

describe('resolveTargetAddressSpace', () => {
  it('uses loopback for localhost URLs', () => {
    expect(resolveTargetAddressSpace('http://localhost:3001/v1/models')).toBe('loopback')
    expect(resolveTargetAddressSpace('http://127.0.0.1:1234/v1/models')).toBe('loopback')
  })

  it('uses local for private-network URLs', () => {
    expect(resolveTargetAddressSpace('http://192.168.1.50:1234/v1/models')).toBe('local')
    expect(resolveTargetAddressSpace('http://printer.local:8080/models')).toBe('local')
  })

  it('omits targetAddressSpace for public or invalid URLs', () => {
    expect(resolveTargetAddressSpace('https://example.com/v1/models')).toBeUndefined()
    expect(resolveTargetAddressSpace('not-a-url')).toBeUndefined()
  })
})