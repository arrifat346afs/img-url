import { createServerFn } from '@tanstack/react-start'

export const DEFAULT_LMSTUDIO_BASE_URL = 'http://localhost:1234/v1'

export interface ProxyRequest {
  path: string
  method?: string
  headers?: Record<string, string>
  body?: unknown
  baseUrl?: string
}

export interface ProxyResponse {
  ok: boolean
  status: number
  statusText: string
  data: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function readProxyRequest(data: unknown): ProxyRequest | null {
  if (!isRecord(data) || typeof data.path !== 'string') {
    return null
  }

  return data as unknown as ProxyRequest
}

function normalizeProxyUrl(path: string, baseUrl?: string): string {
  const normalizedBaseUrl = (baseUrl || DEFAULT_LMSTUDIO_BASE_URL).replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedBaseUrl}${normalizedPath}`
}

export const lmStudioProxy = createServerFn({ method: 'POST' })
  .handler(async ({ data }) => {
    const request = readProxyRequest(data)

    if (!request) {
      return {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        data: {
          error: {
            message: 'Missing LM Studio proxy request data. Please restart the dev server and try again.',
          },
        },
      } as ProxyResponse
    }

    const { path, method = 'GET', headers = {}, body, baseUrl } = request

    const url = normalizeProxyUrl(path, baseUrl)

    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }

    if (body !== undefined && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url, fetchOptions)

      const responseData = await response.json().catch(() => ({}))
      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      } as ProxyResponse
    } catch (error) {
      return {
        ok: false,
        status: 0,
        statusText: error instanceof Error ? error.message : 'Unknown error',
        data: null,
      } as ProxyResponse
    }
  })
