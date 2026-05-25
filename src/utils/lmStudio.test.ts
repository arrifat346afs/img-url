import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./gemini', () => ({
  imageToBase64: vi.fn(async () => ({
    data: 'base64-image-data',
    mimeType: 'image/png',
  })),
}))

vi.mock('./lmStudioProxy', () => ({
  lmStudioProxy: vi.fn(async () => ({
    ok: true,
    status: 200,
    statusText: 'OK',
    data: {
      choices: [{ message: { content: 'A concise generated prompt.' } }],
    },
  })),
}))

import { generateLMStudioPrompt, setDirectFetchMode } from './lmStudio'
import { lmStudioProxy } from './lmStudioProxy'

describe('generateLMStudioPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setDirectFetchMode(false)
  })

  it('passes LM Studio proxy request data through TanStack server function data', async () => {
    const prompt = await generateLMStudioPrompt(
      'https://example.com/image.png',
      '',
      'local-vision-model',
      undefined,
      'http://localhost:1234/v1',
    )

    expect(prompt).toBe('A concise generated prompt.')
    expect(lmStudioProxy).toHaveBeenCalledWith({
      data: expect.objectContaining({
        path: '/chat/completions',
        method: 'POST',
        baseUrl: 'http://localhost:1234/v1',
        body: expect.objectContaining({
          model: 'local-vision-model',
        }),
      }),
    })
  })
})
