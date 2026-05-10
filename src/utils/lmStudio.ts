/**
 * LM Studio API utilities (OpenAI-compatible local models)
 */

import { RateLimitConfig, imageToBase64, GeneratePromptOptions } from './gemini'

export const DEFAULT_LMSTUDIO_BASE_URL = 'http://localhost:1234/v1'

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
 * Fetch available models from LM Studio
 */
export async function fetchLMStudioModels(baseUrl: string): Promise<LMStudioModel[]> {
    try {
        const url = `${baseUrl}/models`
        const response = await fetch(url)

        if (!response.ok) {
            throw new Error(`Failed to fetch LM Studio models: ${response.statusText}`)
        }

        const data = await response.json()
        return data.data || []
    } catch (error) {
        console.error('Failed to fetch LM Studio models:', error)
        return []
    }
}

/**
 * Generate prompt using LM Studio API
 */
export async function generateLMStudioPrompt(
    url: string,
    _apiKey: string,
    model: string,
    options: GeneratePromptOptions = {},
    baseUrl: string = DEFAULT_LMSTUDIO_BASE_URL
): Promise<string> {
    const { data, mimeType } = await imageToBase64(url)

    const payload = {
        model,
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

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `LM Studio API error: ${response.statusText}`)
    }

    const result = await response.json()
    let content = result.choices[0]?.message?.content || ''

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
