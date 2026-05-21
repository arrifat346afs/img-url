/**
 * LM Studio API utilities (OpenAI-compatible local models)
 */

import { RateLimitConfig, imageToBase64, GeneratePromptOptions } from './gemini'
import { lmStudioProxy } from './lmStudioProxy'
import {
  sendChatMessageDirect,
  testLmStudioConnectionDirect,
  fetchLMStudioModelsDirect,
  generateLMStudioPromptDirect,
} from './lmStudioDirect'

export const DEFAULT_LMSTUDIO_BASE_URL = 'http://localhost:1234/v1'

let directFetchMode = false

export function setDirectFetchMode(enabled: boolean) {
  directFetchMode = enabled
}

export function isDirectFetchMode(): boolean {
  return directFetchMode
}

export const LMSTUDIO_RATE_LIMIT: RateLimitConfig = {
    requestsPerSecond: 10 / 60,
    delayMs: 1000,
    maxRetries: 3,
    initialBackoffMs: 1000,
    maxBackoffMs: 15000,
    backoffMultiplier: 2,
}

export interface LMStudioModel {
    id: string
    name?: string
}

/**
 * Send chat message to LM Studio and get response
 */
export async function sendChatMessage(
    message: string,
    baseUrl: string = DEFAULT_LMSTUDIO_BASE_URL
): Promise<{ success: boolean; response?: string; error?: string }> {
    if (directFetchMode) {
        return sendChatMessageDirect(message, baseUrl)
    }
    try {
        const payload = {
            messages: [
                {
                    role: 'user',
                    content: message
                }
            ]
        }

        const result = await lmStudioProxy({
            path: '/chat/completions',
            method: 'POST',
            body: payload,
            baseUrl,
        })

        if (!result.ok) {
            const errorData = result.data as any
            return { success: false, error: errorData?.error?.message || `Error: ${result.statusText}` }
        }

        const responseData = result.data as any
        const content = responseData?.choices?.[0]?.message?.content || 'No response'

        return { success: true, response: content }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
}

/**
 * Test connection to LM Studio server
 */
export async function testLmStudioConnection(baseUrl: string): Promise<{ success: boolean; message: string }> {
    if (directFetchMode) {
        return testLmStudioConnectionDirect(baseUrl)
    }
    try {
        const result = await lmStudioProxy({
            path: '/models',
            baseUrl,
        })
        
        if (!result.ok) {
            return { success: false, message: `Server returned ${result.status}` }
        }

        const responseData = result.data as any
        const modelCount = responseData.data?.length || 0
        
        if (modelCount > 0) {
            return { success: true, message: `Connected! ${modelCount} model(s) available` }
        } else {
            return { success: false, message: 'Connected, but no models loaded' }
        }
    } catch (error) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
            return { success: false, message: 'Connection refused - is LM Studio running?' }
        }
        return { success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }
    }
}

/**
 * Fetch available models from LM Studio
 */
export async function fetchLMStudioModels(baseUrl: string): Promise<LMStudioModel[]> {
    if (directFetchMode) {
        return fetchLMStudioModelsDirect(baseUrl)
    }
    try {
        const result = await lmStudioProxy({
            path: '/models',
            baseUrl,
        })

        if (!result.ok) {
            throw new Error(`Failed to fetch LM Studio models: ${result.statusText}`)
        }

        const responseData = result.data as any
        return responseData.data || []
    } catch (error) {
        console.error('Failed to fetch LM Studio models:', error)
        return []
    }
}

/**
 * Generate prompt using LM Studio API
 * If model is not provided or empty, LM Studio will use its currently loaded model
 */
export async function generateLMStudioPrompt(
    url: string,
    _apiKey: string,
    model: string = '',
    options: GeneratePromptOptions = {},
    baseUrl: string = DEFAULT_LMSTUDIO_BASE_URL
): Promise<string> {
    if (directFetchMode) {
        return generateLMStudioPromptDirect(url, _apiKey, model, options, baseUrl)
    }
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
- Just the raw prompt string.`
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: `data:${mimeType};base64,${data}`
                        }
                    }
                ]
            }
        ]
    }

    const proxyResult = await lmStudioProxy({
        path: '/chat/completions',
        method: 'POST',
        body: payload,
        baseUrl,
    })

    if (!proxyResult.ok) {
        const errorData = proxyResult.data as any
        throw new Error(errorData?.error?.message || `LM Studio API error: ${proxyResult.statusText}`)
    }

    const result = proxyResult.data as any
    let content = result.choices?.[0]?.message?.content || ''

    content = content
        .replace(/^###\s*/gm, '')
        .replace(/\*\*/g, '')
        .replace(/^["']|["']$/g, '')
        .replace(/--ar\s*\d+:\d+/gi, '')
        .replace(/--ar\s+\d+/gi, '')
        .trim()

    const prefixes = [
        "Here is a comprehensive prompt",
        "Here is the prompt",
        "Here is a detailed prompt",
        "Sure, here is",
        "Prompt:",
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
