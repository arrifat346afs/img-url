/**
 * Direct browser-to-LM-Studio fetch utilities
 *
 * Makes direct fetch() calls from the browser to LM Studio (or its proxy),
 * using the appropriate targetAddressSpace to satisfy Chrome's Private
 * Network Access (PNA) requirement.
 *
 * Requires the standalone proxy (local-proxy.mjs) or LM Studio itself
 * to respond with Access-Control-Allow-Private-Network: true on OPTIONS.
 */

import { RateLimitConfig, imageToBase64, GeneratePromptOptions } from './gemini'
import { ANALYZE_IMAGE_PROMPT } from './promptTemplate'

export const DEFAULT_LMSTUDIO_PROXY_URL = 'http://localhost:3001/v1'

type LocalTargetAddressSpace = 'local' | 'loopback'

function isLoopbackHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '::1' || /^127(?:\.[0-9]{1,3}){3}$/.test(hostname)
}

function isPrivateIpv4Hostname(hostname: string): boolean {
  if (/^10(?:\.[0-9]{1,3}){3}$/.test(hostname)) return true
  if (/^192\.168(?:\.[0-9]{1,3}){2}$/.test(hostname)) return true
  if (/^169\.254(?:\.[0-9]{1,3}){2}$/.test(hostname)) return true

  const match = hostname.match(/^172\.([0-9]{1,3})(?:\.[0-9]{1,3}){2}$/)
  if (!match) return false

  const secondOctet = Number(match[1])
  return secondOctet >= 16 && secondOctet <= 31
}

export function resolveTargetAddressSpace(url: string): LocalTargetAddressSpace | undefined {
  try {
    const { hostname } = new URL(url)

    if (isLoopbackHostname(hostname)) {
      return 'loopback'
    }

    if (hostname.endsWith('.local') || isPrivateIpv4Hostname(hostname)) {
      return 'local'
    }

    return undefined
  } catch {
    return undefined
  }
}

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
  const targetAddressSpace = resolveTargetAddressSpace(url)
  const fetchOptions: RequestInit & { targetAddressSpace?: LocalTargetAddressSpace } = {
    ...options,
    ...(targetAddressSpace ? { targetAddressSpace } : {}),
  }

  try {
    const response = await fetch(url, fetchOptions)
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
            text: ANALYZE_IMAGE_PROMPT,
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
