/**
 * Direct browser-to-LM-Studio fetch utilities
 *
 * Makes direct fetch() calls from the browser to LM Studio (or its proxy),
 * using targetAddressSpace: 'local' to satisfy Chrome's Private Network
 * Access (PNA) requirement.
 *
 * Requires the standalone proxy (local-proxy.mjs) or LM Studio itself
 * to respond with Access-Control-Allow-Private-Network: true on OPTIONS.
 */

import { imageToBase64, GeneratePromptOptions } from './gemini'
import { isTauri } from './tauri'
import { fetch as tauriFetch } from '@tauri-apps/plugin-http'

export const DEFAULT_LMSTUDIO_PROXY_URL = 'http://localhost:3001/v1'

export interface DirectFetchResult<T = unknown> {
  ok: boolean
  status: number
  statusText: string
  data: T
}

async function directFetch<T = unknown>(
  url: string,
  options: RequestInit = {},
): Promise<DirectFetchResult<T>> {
  try {
    let response: Response

    if (isTauri()) {
      response = await tauriFetch(url, options)
    } else {
      const fetchOptions: RequestInit & { targetAddressSpace?: string } = {
        ...options,
        targetAddressSpace: 'local',
      }
      response = await fetch(url, fetchOptions)
    }

    const data = (await response.json().catch(() => ({}))) as T
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data,
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      statusText: error instanceof Error ? error.message : 'Unknown error',
      data: null as T,
    }
  }
}

export async function sendChatMessageDirect(
  message: string,
  baseUrl: string = DEFAULT_LMSTUDIO_PROXY_URL,
): Promise<{ success: boolean; response?: string; error?: string }> {
  const result = await directFetch<{
    choices?: Array<{ message?: { content?: string } }>
    error?: { message?: string }
  }>(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: message }],
    }),
  })

  if (!result.ok) {
    const errorData = result.data as any
    return { success: false, error: errorData?.error?.message || `Error: ${result.statusText}` }
  }

  const content = result.data?.choices?.[0]?.message?.content || 'No response'
  return { success: true, response: content }
}

export async function testLmStudioConnectionDirect(
  baseUrl: string,
): Promise<{ success: boolean; message: string }> {
  const result = await directFetch<{ data?: unknown[] }>(`${baseUrl}/models`)

  if (!result.ok) {
    return { success: false, message: `Server returned ${result.status}` }
  }

  const modelCount = result.data?.data?.length || 0
  if (modelCount > 0) {
    return { success: true, message: `Connected! ${modelCount} model(s) available` }
  }
  return { success: false, message: 'Connected, but no models loaded' }
}

export async function fetchLMStudioModelsDirect(
  baseUrl: string,
): Promise<Array<{ id: string; name?: string }>> {
  const result = await directFetch<{ data?: Array<{ id: string; name?: string }> }>(
    `${baseUrl}/models`,
  )

  if (!result.ok) {
    throw new Error(`Failed to fetch LM Studio models: ${result.statusText}`)
  }

  return result.data?.data || []
}

export async function generateLMStudioPromptDirect(
  url: string,
  _apiKey: string,
  model: string = '',
  options: GeneratePromptOptions = {},
  baseUrl: string = DEFAULT_LMSTUDIO_PROXY_URL,
): Promise<string> {
  const { data, mimeType } = await imageToBase64(url)

  const payload: Record<string, unknown> = {
    ...(model ? { model } : {}),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this image and create an effective prompt for AI image generation tools like Midjourney, DALL-E, or Stable Diffusion.

Focus on these key elements (keep descriptions concise):
1. Subject - who or what is the main focus
2. Art style/medium - photography, illustration, digital art, 3D render, etc.
3. Lighting - key light source and mood it creates
4. Colors - dominant color palette
5. Composition - camera angle, framing, perspective
6. Atmosphere/mood - emotional tone
7. Key details - only the most important visual elements that define the image

Then add relevant style keywords at the end as comma-separated modifiers (e.g., cinematic lighting, soft focus, detailed, vibrant colors).

CRITICAL OUTPUT INSTRUCTIONS:
- Return ONLY the prompt text.
- Do NOT use markdown (no bold **, no italics *, no headers ###).
- Do NOT include any introductory text like "Here is the prompt" or "Sure".
- Do NOT include any concluding text.
- Do NOT add aspect ratio notation like --ar 16:9 or similar.
- Just the raw prompt string.`,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${data}`,
            },
          },
        ],
      },
    ],
  }

  const result = await directFetch<{
    choices?: Array<{ message?: { content?: string } }>
    error?: { message?: string }
  }>(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!result.ok) {
    const errorData = result.data as any
    throw new Error(errorData?.error?.message || `LM Studio API error: ${result.statusText}`)
  }

  let content = result.data?.choices?.[0]?.message?.content || ''

  content = content
    .replace(/^###\s*/gm, '')
    .replace(/\*\*/g, '')
    .replace(/^["']|["']$/g, '')
    .replace(/--ar\s*\d+:\d+/gi, '')
    .replace(/--ar\s+\d+/gi, '')
    .trim()

  const prefixes = [
    'Here is a comprehensive prompt',
    'Here is the prompt',
    'Here is a detailed prompt',
    'Sure, here is',
    'Prompt:',
  ]

  for (const prefix of prefixes) {
    if (content.toLowerCase().startsWith(prefix.toLowerCase())) {
      const parts = content.split(/[:\n]/)
      if (parts.length > 1) {
        content = parts.slice(1).join(' ').trim()
        break
      }
    }
  }

  return content
}
