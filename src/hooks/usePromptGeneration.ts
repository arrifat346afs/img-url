/**
 * Custom hook for AI prompt generation
 */

import { useState } from 'react'
import { generatePromptForImage, PromptResult } from '../utils/gemini'

export function usePromptGeneration() {
    const [prompts, setPrompts] = useState<Map<string, PromptResult>>(new Map())
    const [loading, setLoading] = useState(false)
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

    const generatePrompts = async (
        urls: string[],
        apiKey: string,
        model: string
    ) => {
        setLoading(true)
        const newPrompts = new Map(prompts)

        for (const url of urls) {
            try {
                const prompt = await generatePromptForImage(url, apiKey, model)
                newPrompts.set(url, {
                    url,
                    prompt,
                })
            } catch (err) {
                newPrompts.set(url, {
                    url,
                    prompt: '',
                    error: err instanceof Error ? err.message : 'Failed to generate prompt',
                })
            }

            // Update prompts progressively
            setPrompts(new Map(newPrompts))
        }

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

    return {
        prompts,
        loading,
        copiedIndex,
        generatePrompts,
        copyPrompt,
        clearPrompts,
        removePrompt,
    }
}
