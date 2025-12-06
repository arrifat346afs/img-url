/**
 * Google Gemini AI API utilities
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

export interface PromptResult {
    url: string
    prompt: string
    error?: string
    status?: 'pending' | 'generating' | 'retrying' | 'completed' | 'error'
}

/**
 * Rate limit configuration for Gemini API requests
 */
export interface RateLimitConfig {
    /** Maximum requests per second (default: 1) */
    requestsPerSecond: number
    /** Delay between requests in milliseconds (default: 1000) */
    delayMs: number
    /** Maximum number of retries on 429 error (default: 5) */
    maxRetries: number
    /** Initial backoff delay in milliseconds (default: 1000) */
    initialBackoffMs: number
    /** Maximum backoff delay in milliseconds (default: 60000) */
    maxBackoffMs: number
    /** Backoff multiplier (default: 2) */
    backoffMultiplier: number
}

/**
 * Default rate limit configuration
 */
export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
    requestsPerSecond: 0.5,
    delayMs: 2000,
    maxRetries: 3,
    initialBackoffMs: 2000,
    maxBackoffMs: 30000,
    backoffMultiplier: 2,
}

/**
 * Request queue item
 */
interface QueueItem<T> {
    execute: () => Promise<T>
    resolve: (value: T) => void
    reject: (error: Error) => void
}

/**
 * Rate limiter class to manage API request throttling and queuing
 */
class RateLimiter {
    private queue: QueueItem<unknown>[] = []
    private isProcessing = false
    private lastRequestTime = 0
    private config: RateLimitConfig

    constructor(config: Partial<RateLimitConfig> = {}) {
        this.config = { ...DEFAULT_RATE_LIMIT_CONFIG, ...config }
    }

    /**
     * Update rate limit configuration
     */
    updateConfig(config: Partial<RateLimitConfig>): void {
        this.config = { ...this.config, ...config }
    }

    /**
     * Get current configuration
     */
    getConfig(): RateLimitConfig {
        return { ...this.config }
    }

    /**
     * Add a request to the queue
     */
    async enqueue<T>(execute: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.queue.push({
                execute: execute as () => Promise<unknown>,
                resolve: resolve as (value: unknown) => void,
                reject,
            })
            this.processQueue()
        })
    }

    /**
     * Process the request queue
     */
    private async processQueue(): Promise<void> {
        if (this.isProcessing || this.queue.length === 0) {
            return
        }

        this.isProcessing = true

        while (this.queue.length > 0) {
            const item = this.queue.shift()!

            // Calculate delay needed to respect rate limit
            const now = Date.now()
            const timeSinceLastRequest = now - this.lastRequestTime
            const minDelay = Math.max(
                this.config.delayMs,
                1000 / this.config.requestsPerSecond
            )
            const delay = Math.max(0, minDelay - timeSinceLastRequest)

            if (delay > 0) {
                await this.sleep(delay)
            }

            this.lastRequestTime = Date.now()

            try {
                const result = await item.execute()
                item.resolve(result)
            } catch (error) {
                item.reject(error instanceof Error ? error : new Error(String(error)))
            }
        }

        this.isProcessing = false
    }

    /**
     * Sleep utility
     */
    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms))
    }

    /**
     * Get current queue size
     */
    getQueueSize(): number {
        return this.queue.length
    }

    /**
     * Clear the queue
     */
    clearQueue(): void {
        const items = this.queue.splice(0)
        items.forEach((item) => item.reject(new Error('Queue cleared')))
    }
}

// Global rate limiter instance
let rateLimiter = new RateLimiter()

/**
 * Configure the rate limiter with custom settings
 */
export function configureRateLimiter(config: Partial<RateLimitConfig>): void {
    rateLimiter.updateConfig(config)
}

/**
 * Get current rate limiter configuration
 */
export function getRateLimiterConfig(): RateLimitConfig {
    return rateLimiter.getConfig()
}

/**
 * Reset rate limiter to default configuration
 */
export function resetRateLimiter(): void {
    rateLimiter = new RateLimiter()
}

/**
 * Get current queue size
 */
export function getQueueSize(): number {
    return rateLimiter.getQueueSize()
}

/**
 * Clear all pending requests in the queue
 */
export function clearRequestQueue(): void {
    rateLimiter.clearQueue()
}

/**
 * Check if an error is a rate limit error (429)
 */
function isRateLimitError(error: unknown): boolean {
    if (error instanceof Error) {
        const message = error.message.toLowerCase()
        return (
            message.includes('429') ||
            message.includes('rate limit') ||
            message.includes('resource exhausted') ||
            message.includes('too many requests')
        )
    }
    return false
}

/**
 * Execute a function with retry logic and exponential backoff
 */
async function withRetry<T>(
    fn: () => Promise<T>,
    config: RateLimitConfig,
    onRetry?: (attempt: number, delayMs: number) => void
): Promise<T> {
    let lastError: Error | null = null
    let backoffMs = config.initialBackoffMs

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
        try {
            return await fn()
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error))

            // Only retry on rate limit errors
            if (!isRateLimitError(error)) {
                throw lastError
            }

            // Don't wait after the last attempt
            if (attempt < config.maxRetries) {
                console.warn(
                    `Rate limit hit, retrying in ${backoffMs}ms (attempt ${attempt + 1}/${config.maxRetries})`
                )
                onRetry?.(attempt + 1, backoffMs)
                await new Promise((resolve) => setTimeout(resolve, backoffMs))

                // Exponential backoff with cap
                backoffMs = Math.min(
                    backoffMs * config.backoffMultiplier,
                    config.maxBackoffMs
                )
            }
        }
    }

    throw lastError || new Error('Max retries exceeded')
}

/**
 * Fetch available models from Google AI
 */
export async function fetchAvailableModels(): Promise<string[]> {
    try {
        // Note: listModels may not be available in all SDK versions
        // Fallback to a predefined list of known models
        const knownModels = [
            'gemini-2.0-flash-lite',
            'gemini-1.5-flash',
            'gemini-1.5-flash-8b',
            'gemini-1.5-pro',
            'gemini-pro',
        ]

        return knownModels
    } catch (error) {
        console.error('Failed to fetch models:', error)
        // Return default models on error
        return ['gemini-2.0-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-pro']
    }
}

/**
 * Convert image URL to base64
 */
export async function imageToBase64(
    url: string
): Promise<{ data: string; mimeType: string }> {
    const response = await fetch(url)
    const blob = await response.blob()

    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
            const base64String = reader.result as string
            resolve({
                data: base64String.split(',')[1],
                mimeType: blob.type,
            })
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
    })
}

/**
 * Options for generating prompts
 */
export interface GeneratePromptOptions {
    /** Custom rate limit configuration */
    rateLimitConfig?: Partial<RateLimitConfig>
    /** Whether to use rate limiting (default: true) */
    useRateLimiting?: boolean
    /** Whether to use retry logic (default: true) */
    useRetry?: boolean
    /** Callback when a retry occurs */
    onRetry?: (attempt: number, delayMs: number) => void
}

/**
 * Generate AI prompt for a single image (internal function without rate limiting)
 */
async function generatePromptInternal(
    url: string,
    apiKey: string,
    model: string
): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey)
    const generativeModel = genAI.getGenerativeModel({ model })

    const { data, mimeType } = await imageToBase64(url)

    const imagePart = {
        inlineData: {
            data,
            mimeType,
        },
    }

    const promptText = `Analyze this image in detail and create a comprehensive prompt that could be used to generate a similar image using AI image generation tools like Midjourney, DALL-E, or Stable Diffusion.

Include the following in your prompt:
1. Main subject and composition
2. Art style and medium (e.g., photography, digital art, painting, 3D render)
3. Lighting and atmosphere
4. Color palette and mood
5. Camera angle and perspective
6. Technical details (depth of field, resolution quality)
7. Any text or graphic elements
8. Background and environment
9. Specific details about objects, people, or elements
10. Keywords for style modifiers

Format the response as a single, detailed prompt that starts with the main subject and flows naturally. Make it ready to use directly in an AI image generator.`

    const result = await generativeModel.generateContent([promptText, imagePart])
    console.log('Result:', result)
    return result.response.text()
}

/**
 * Generate AI prompt for a single image with rate limiting and retry logic
 */
export async function generatePromptForImage(
    url: string,
    apiKey: string,
    model: string,
    options: GeneratePromptOptions = {}
): Promise<string> {
    const {
        rateLimitConfig,
        useRateLimiting = true,
        useRetry = true,
    } = options

    // Apply custom rate limit config if provided
    if (rateLimitConfig) {
        configureRateLimiter(rateLimitConfig)
    }

    const config = getRateLimiterConfig()

    // Create the execution function
    const execute = async (): Promise<string> => {
        if (useRetry) {
            return withRetry(
                () => generatePromptInternal(url, apiKey, model),
                config,
                options.onRetry
            )
        }
        return generatePromptInternal(url, apiKey, model)
    }

    // Use rate limiter if enabled
    if (useRateLimiting) {
        return rateLimiter.enqueue(execute)
    }

    return execute()
}

/**
 * Generate prompts for multiple images with rate limiting
 */
export async function generatePromptsForImages(
    urls: string[],
    apiKey: string,
    model: string,
    options: GeneratePromptOptions = {},
    onProgress?: (completed: number, total: number, result: PromptResult) => void
): Promise<PromptResult[]> {
    const results: PromptResult[] = []

    for (let i = 0; i < urls.length; i++) {
        const url = urls[i]
        try {
            const prompt = await generatePromptForImage(url, apiKey, model, options)
            const result: PromptResult = { url, prompt }
            results.push(result)
            onProgress?.(i + 1, urls.length, result)
        } catch (err) {
            const result: PromptResult = {
                url,
                prompt: '',
                error: err instanceof Error ? err.message : 'Failed to generate prompt',
            }
            results.push(result)
            onProgress?.(i + 1, urls.length, result)
        }
    }

    return results
}
