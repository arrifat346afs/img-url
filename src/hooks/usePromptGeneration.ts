/**
 * Custom hook for AI prompt generation
 */

import { useState } from 'react'
import {
    generatePromptForImage,
    PromptResult,
    GeneratePromptOptions,
    RateLimitConfig,
    DEFAULT_RATE_LIMIT_CONFIG,
    configureRateLimiter,
    getRateLimiterConfig,
    clearRequestQueue,
} from '../utils/gemini'

export interface ProgressInfo {
    current: number
    total: number
    percentage: number
}

export interface UsePromptGenerationOptions {
    /** Initial rate limit configuration */
    rateLimitConfig?: Partial<RateLimitConfig>
}

export function usePromptGeneration(options: UsePromptGenerationOptions = {}) {
    const [prompts, setPrompts] = useState<Map<string, PromptResult>>(new Map())
    const [loading, setLoading] = useState(false)
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
    const [progress, setProgress] = useState<ProgressInfo>({ current: 0, total: 0, percentage: 0 })
    const [rateLimitConfig, setRateLimitConfigState] = useState<RateLimitConfig>({
        ...DEFAULT_RATE_LIMIT_CONFIG,
        ...options.rateLimitConfig,
    })

    /**
     * Update rate limit configuration
     */
    const updateRateLimitConfig = (config: Partial<RateLimitConfig>) => {
        const newConfig = { ...rateLimitConfig, ...config }
        setRateLimitConfigState(newConfig)
        configureRateLimiter(newConfig)
    }

    /**
     * Get current rate limit configuration
     */
    const getCurrentRateLimitConfig = (): RateLimitConfig => {
        return getRateLimiterConfig()
    }

    /**
     * Cancel all pending requests
     */
    const cancelPendingRequests = () => {
        clearRequestQueue()
    }

    const generatePrompts = async (
        urls: string[],
        apiKey: string,
        model: string,
        promptOptions?: GeneratePromptOptions
    ) => {
        setLoading(true)
        const total = urls.length
        setProgress({ current: 0, total, percentage: 0 })

        // Initialize all prompts as pending
        setPrompts((prev) => {
            const newMap = new Map(prev)
            urls.forEach((url) => {
                if (!newMap.has(url) || newMap.get(url)?.status === 'error') {
                    newMap.set(url, {
                        url,
                        prompt: '',
                        status: 'pending'
                    })
                }
            })
            return newMap
        })

        // Merge provided options with current rate limit config
        const mergedOptions: GeneratePromptOptions = {
            rateLimitConfig,
            useRateLimiting: true,
            useRetry: true,
            ...promptOptions,
        }

        let completedCount = 0
        const updateProgress = () => {
            completedCount++
            setProgress({
                current: completedCount,
                total,
                percentage: Math.round((completedCount / total) * 100)
            })
        }

        const promises = urls.map(async (url) => {
            try {
                // Update status to generating when we start processing (or queuing)
                setPrompts((prev) => {
                    const newMap = new Map(prev)
                    const current = newMap.get(url)
                    // Only update if not already completed (in case of re-run)
                    if (current?.status !== 'completed') {
                        newMap.set(url, { ...current!, url, status: 'generating', error: undefined })
                    }
                    return newMap
                })

                const prompt = await generatePromptForImage(url, apiKey, model, {
                    ...mergedOptions,
                    onRetry: (_attempt, delayMs) => {
                        setPrompts((prev) => {
                            const newMap = new Map(prev)
                            const current = newMap.get(url)
                            if (current) {
                                newMap.set(url, {
                                    ...current,
                                    status: 'retrying',
                                    error: `Rate limit hit. Retrying in ${Math.round(delayMs / 1000)}s...`
                                })
                            }
                            return newMap
                        })
                    }
                })

                setPrompts((prev) => {
                    const newMap = new Map(prev)
                    newMap.set(url, {
                        url,
                        prompt,
                        status: 'completed',
                        error: undefined
                    })
                    return newMap
                })
            } catch (err) {
                setPrompts((prev) => {
                    const newMap = new Map(prev)
                    newMap.set(url, {
                        url,
                        prompt: '',
                        status: 'error',
                        error: err instanceof Error ? err.message : 'Failed to generate prompt',
                    })
                    return newMap
                })
            } finally {
                updateProgress()
            }
        })

        await Promise.all(promises)
        setLoading(false)
    }

    const copyPrompt = async (prompt: string, index: number) => {
        try {
            await navigator.clipboard.writeText(prompt)
            setCopiedIndex(index)
            setTimeout(() => setCopiedIndex(null), 2000)
            return true
        } catch (err) {
            console.error('Failed to copy to clipboard:', err)
            return false
        }
    }

    const clearPrompts = () => {
        setPrompts(new Map())
    }

    const removePrompt = (url: string) => {
        const newPrompts = new Map(prompts)
        newPrompts.delete(url)
        setPrompts(newPrompts)
    }

    const updatePrompt = (url: string, newPrompt: string) => {
        const newPrompts = new Map(prompts)
        const existing = newPrompts.get(url)
        if (existing) {
            newPrompts.set(url, { ...existing, prompt: newPrompt })
            setPrompts(newPrompts)
        }
    }

    return {
        prompts,
        loading,
        progress,
        copiedIndex,
        rateLimitConfig,
        generatePrompts,
        copyPrompt,
        clearPrompts,
        removePrompt,
        updatePrompt,
        updateRateLimitConfig,
        getCurrentRateLimitConfig,
        cancelPendingRequests,
    }
}
