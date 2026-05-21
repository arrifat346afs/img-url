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

export const lmStudioProxy = createServerFn({ method: 'POST' })
  .handler(async ({ data }) => {
    const { path, method = 'GET', headers = {}, body, baseUrl } = data as ProxyRequest

    const url = `${baseUrl || DEFAULT_LMSTUDIO_BASE_URL}${path}`

    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }

    if (body && method !== 'GET') {
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
