/**
 * Custom hook for URL list management
 */

import { useState } from 'react'
import { isValidImageUrl, extractUrlsFromText } from '../utils/validation'

export function useUrls() {
    const [urls, setUrls] = useState<string[]>([])
    const [error, setError] = useState('')

    const addUrl = (url: string) => {
        const trimmedUrl = url.trim()
        if (!trimmedUrl) return false

        if (!isValidImageUrl(trimmedUrl)) {
            setError('Please enter a valid image URL (jpg, jpeg, png, gif, webp, bmp)')
            return false
        }

        if (urls.includes(trimmedUrl)) {
            setError('This URL is already in the list')
            return false
        }

        setUrls([...urls, trimmedUrl])
        setError('')
        return true
    }

    const removeUrl = (index: number) => {
        setUrls(urls.filter((_, i) => i !== index))
    }

    const pasteFromClipboard = async () => {
        try {
            const text = await navigator.clipboard.readText()
            const foundUrls = extractUrlsFromText(text)

            if (foundUrls.length === 0) {
                setError('No image URLs found in clipboard')
                return false
            }

            const newUrls = foundUrls.filter((url) => !urls.includes(url))
            if (newUrls.length === 0) {
                setError('All URLs from clipboard are already in the list')
                return false
            }

            setUrls([...urls, ...newUrls])
            setError('')
            return true
        } catch (err) {
            setError('Failed to read clipboard. Please grant clipboard permissions.')
            return false
        }
    }

    const clearError = () => setError('')

    return {
        urls,
        addUrl,
        removeUrl,
        pasteFromClipboard,
        error,
        setError,
        clearError,
    }
}
