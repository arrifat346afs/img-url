/**
 * Custom hook for API key management with localStorage persistence
 */

import { useState, useEffect } from 'react'

const API_KEY_STORAGE_KEY = 'gemini_api_key'

export function useApiKey() {
    const [apiKey, setApiKey] = useState('')
    const [tempApiKey, setTempApiKey] = useState('')

    // Load API key from localStorage on mount
    useEffect(() => {
        const savedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY)
        if (savedApiKey) {
            setApiKey(savedApiKey)
            setTempApiKey(savedApiKey)
        }
    }, [])

    // Save API key to localStorage
    const saveApiKey = () => {
        if (tempApiKey.trim()) {
            localStorage.setItem(API_KEY_STORAGE_KEY, tempApiKey.trim())
            setApiKey(tempApiKey.trim())
            return true
        }
        return false
    }

    return {
        apiKey,
        tempApiKey,
        setTempApiKey,
        saveApiKey,
    }
}
