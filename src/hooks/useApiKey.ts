/**
 * Custom hook for API key management with localStorage persistence
 */

import { useState, useEffect } from 'react'

const GOOGLE_API_KEY_STORAGE_KEY = 'gemini_api_key'
const OPENROUTER_API_KEY_STORAGE_KEY = 'openrouter_api_key'
const GOOGLE_AI_MODEL_STORAGE_KEY = 'google_ai_model'
const OPENROUTER_MODEL_STORAGE_KEY = 'openrouter_model'

export function useApiKey() {
    const [googleApiKey, setGoogleApiKey] = useState('')
    const [openRouterApiKey, setOpenRouterApiKey] = useState('')
    const [googleAiModel, setGoogleAiModel] = useState('')
    const [openRouterModel, setOpenRouterModel] = useState('')

    // Load API keys and models from localStorage on mount
    useEffect(() => {
        const savedGoogleKey = localStorage.getItem(GOOGLE_API_KEY_STORAGE_KEY)
        const savedOpenRouterKey = localStorage.getItem(OPENROUTER_API_KEY_STORAGE_KEY)
        const savedGoogleModel = localStorage.getItem(GOOGLE_AI_MODEL_STORAGE_KEY)
        const savedOpenRouterModel = localStorage.getItem(OPENROUTER_MODEL_STORAGE_KEY)

        if (savedGoogleKey) setGoogleApiKey(savedGoogleKey)
        if (savedOpenRouterKey) setOpenRouterApiKey(savedOpenRouterKey)
        if (savedGoogleModel) setGoogleAiModel(savedGoogleModel)
        if (savedOpenRouterModel) setOpenRouterModel(savedOpenRouterModel)
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

    // Save Google AI model
    const saveGoogleAiModel = (model: string) => {
        localStorage.setItem(GOOGLE_AI_MODEL_STORAGE_KEY, model.trim())
        setGoogleAiModel(model.trim())
    }

    // Save OpenRouter model
    const saveOpenRouterModel = (model: string) => {
        localStorage.setItem(OPENROUTER_MODEL_STORAGE_KEY, model.trim())
        setOpenRouterModel(model.trim())
    }

    return {
        googleApiKey,
        openRouterApiKey,
        googleAiModel,
        openRouterModel,
        saveGoogleApiKey,
        saveOpenRouterApiKey,
        saveGoogleAiModel,
        saveOpenRouterModel,
    }
}
