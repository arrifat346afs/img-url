/**
 * Custom hook for URL list management with localStorage persistence
 */

import { useState, useEffect } from 'react'
import { isValidImageUrl, extractUrlsFromText } from '../utils/validation'

export interface StoredUrlEntry {
  id: string
  url: string
  timestamp: number
  date: string
}

const STORED_URLS_KEY = 'stored_image_urls'

export function useUrls() {
    const [urls, setUrls] = useState<string[]>([])
    const [error, setError] = useState('')
    const [storedUrls, setStoredUrls] = useState<StoredUrlEntry[]>([])

    // Load stored URLs with timestamps on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORED_URLS_KEY)
        if (stored) {
            try {
                const parsedStored = JSON.parse(stored)
                setStoredUrls(parsedStored)
            } catch (err) {
                console.error('Failed to load stored URLs:', err)
            }
        }
    }, [])

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

    // Storage functions
    const saveUrlsToStorage = () => {
        if (urls.length === 0) return false

        const newEntries: StoredUrlEntry[] = urls.map(url => ({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            url,
            timestamp: Date.now(),
            date: new Date().toLocaleDateString()
        }))

        const updatedStored = [...storedUrls, ...newEntries]
        setStoredUrls(updatedStored)
        localStorage.setItem(STORED_URLS_KEY, JSON.stringify(updatedStored))
        return true
    }

    const clearAllStoredUrls = () => {
        setStoredUrls([])
        localStorage.removeItem(STORED_URLS_KEY)
    }

    const removeStoredUrl = (id: string) => {
        const updated = storedUrls.filter(entry => entry.id !== id)
        setStoredUrls(updated)
        localStorage.setItem(STORED_URLS_KEY, JSON.stringify(updated))
    }

    const loadUrlsFromStorage = (entries: StoredUrlEntry[]) => {
        const urlsToLoad = entries.map(entry => entry.url)
        const uniqueUrls = [...new Set([...urls, ...urlsToLoad])]
        setUrls(uniqueUrls)
    }

    const getStoredUrlsByDate = (date: string): StoredUrlEntry[] => {
        return storedUrls.filter(entry => entry.date === date)
    }

    const getUniqueDates = (): string[] => {
        const dates = storedUrls.map(entry => entry.date)
        return [...new Set(dates)].sort((a, b) => {
            const dateA = new Date(a).getTime()
            const dateB = new Date(b).getTime()
            return dateB - dateA // Most recent first
        })
    }

    return {
        urls,
        storedUrls,
        addUrl,
        removeUrl,
        pasteFromClipboard,
        error,
        setError,
        clearError,
        saveUrlsToStorage,
        clearAllStoredUrls,
        removeStoredUrl,
        loadUrlsFromStorage,
        getStoredUrlsByDate,
        getUniqueDates,
    }
}
