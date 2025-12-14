/**
 * Custom hook for API key management with localStorage persistence
 */

import { useState, useEffect } from 'react'

const GOOGLE_API_KEY_STORAGE_KEY = 'gemini_api_key'
const OPENROUTER_API_KEY_STORAGE_KEY = 'openrouter_api_key'

export function useApiKey() {
    const [googleApiKey, setGoogleApiKey] = useState('')
    const [openRouterApiKey, setOpenRouterApiKey] = useState('')

    // Load API keys from localStorage on mount
    useEffect(() => {
        const savedGoogleKey = localStorage.getItem(GOOGLE_API_KEY_STORAGE_KEY)
        const savedOpenRouterKey = localStorage.getItem(OPENROUTER_API_KEY_STORAGE_KEY)

        if (savedGoogleKey) setGoogleApiKey(savedGoogleKey)
        if (savedOpenRouterKey) setOpenRouterApiKey(savedOpenRouterKey)
    }, [])

    // Save Google API key
    const saveGoogleApiKey = (key: string) => {
        if (key.trim()) {
            localStorage.setItem(GOOGLE_API_KEY_STORAGE_KEY, key.trim())
            setGoogleApiKey(key.trim())
            return true
        }
        return false
    }

    // Save OpenRouter API key
    const saveOpenRouterApiKey = (key: string) => {
        if (key.trim()) {
            localStorage.setItem(OPENROUTER_API_KEY_STORAGE_KEY, key.trim())
            setOpenRouterApiKey(key.trim())
            return true
        }
        return false
    }

    return {
        googleApiKey,
        openRouterApiKey,
        saveGoogleApiKey,
        saveOpenRouterApiKey,
    }
}
