/**
 * OpenRouter API utilities
 */

import { RateLimitConfig, imageToBase64, GeneratePromptOptions } from './gemini'
import { ANALYZE_IMAGE_PROMPT } from './promptTemplate'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1'

// Rate limit for free models: 20 request per minute, 200 per day
// We'll use a conservative 5s delay between requests for free models
// Rate limit for free models: 20 request per minute, 200 per day
// We'll use a conservative 6s delay between requests for free models
export const FREE_MODEL_RATE_LIMIT: RateLimitConfig = {
    requestsPerSecond: 10 / 60, // ~0.16 requests per second
    delayMs: 6000,
    maxRetries: 3,
    initialBackoffMs: 2000,
    maxBackoffMs: 30000,
    backoffMultiplier: 2,
}

export interface OpenRouterModel {
    id: string
    name: string
    description?: string
    context_length?: number
    pricing: {
        prompt: string
        completion: string
    }
}

/**
 * Fetch available models from OpenRouter
 */
export async function fetchOpenRouterModels(apiKey?: string): Promise<OpenRouterModel[]> {
    try {
        const response = await fetch(`${OPENROUTER_API_URL}/models`, {
            headers: apiKey ? {
                'Authorization': `Bearer ${apiKey}`,
            } : {},
        })

        if (!response.ok) {
            throw new Error(`Failed to fetch OpenRouter models: ${response.statusText}`)
        }

        const data = await response.json()
        return data.data
    } catch (error) {
        console.error('Failed to fetch OpenRouter models:', error)
        return []
    }
}

/**
 * Generate prompt using OpenRouter API
 */
export async function generateOpenRouterPrompt(
    url: string,
    apiKey: string,
    model: string,
    _options: GeneratePromptOptions = {}
): Promise<string> {
    const { data, mimeType } = await imageToBase64(url)

    // Construct the payload for OpenAI-compatible chat completion
    const payload = {
        model,
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: ANALYZE_IMAGE_PROMPT
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

    const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://localhost:3000', // Required by OpenRouter
            'X-Title': 'Image to Prompt App', // Optional
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `OpenRouter API error: ${response.statusText}`)
    }

    const result = await response.json()
    let content = result.choices[0]?.message?.content || ''

    // Clean up the response
    // Remove markdown headers (### ), bold markers (**), and quotes
    content = content
        .replace(/^###\s*/gm, '') // Remove headers
        .replace(/\*\*/g, '')      // Remove bold
        .replace(/^["']|["']$/g, '') // Remove wrapping quotes
        .replace(/--ar\s*\d+:\d+/gi, '')
        .replace(/--ar\s+\d+/gi, '')
        .trim()

    // Try to remove conversational prefixes if present (simple heuristic)
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
                // Return everything after the first colon or newline
                content = parts.slice(1).join(' ').trim()
                break
            }
        }
    }

    return content
}
