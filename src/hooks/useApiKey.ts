/**
 * Custom hook for API key management with localStorage persistence
 */

import { useState, useEffect } from 'react'
import { DEFAULT_LMSTUDIO_BASE_URL, setDirectFetchMode } from '../utils/lmStudio'
import { DEFAULT_LMSTUDIO_PROXY_URL } from '../utils/lmStudioDirect'

const GOOGLE_API_KEY_STORAGE_KEY = 'gemini_api_key'
const OPENROUTER_API_KEY_STORAGE_KEY = 'openrouter_api_key'
const GOOGLE_AI_MODEL_STORAGE_KEY = 'google_ai_model'
const OPENROUTER_MODEL_STORAGE_KEY = 'openrouter_model'
const LMSTUDIO_BASE_URL_STORAGE_KEY = 'lmstudio_base_url'
const LMSTUDIO_DIRECT_FETCH_KEY = 'lmstudio_direct_fetch'

export function getDefaultLmStudioBaseUrl(_directFetchEnabled: boolean): string {
    return DEFAULT_LMSTUDIO_BASE_URL
}

export function resolveLmStudioBaseUrl(currentBaseUrl: string, directFetchEnabled: boolean): string {
    const trimmedBaseUrl = currentBaseUrl.trim()

    if (
        !trimmedBaseUrl ||
        trimmedBaseUrl === DEFAULT_LMSTUDIO_BASE_URL ||
        trimmedBaseUrl === DEFAULT_LMSTUDIO_PROXY_URL
    ) {
        return getDefaultLmStudioBaseUrl(directFetchEnabled)
    }

    return trimmedBaseUrl
}

export function useApiKey() {
    const [googleApiKey, setGoogleApiKey] = useState('')
    const [openRouterApiKey, setOpenRouterApiKey] = useState('')
    const [googleAiModel, setGoogleAiModel] = useState('')
    const [openRouterModel, setOpenRouterModel] = useState('')
    const [lmstudioBaseUrl, setLmstudioBaseUrl] = useState(DEFAULT_LMSTUDIO_BASE_URL)
    const [lmstudioDirectFetch, setLmstudioDirectFetchState] = useState(false)

    // Load API keys and models from localStorage on mount
    useEffect(() => {
        const savedGoogleKey = localStorage.getItem(GOOGLE_API_KEY_STORAGE_KEY)
        const savedOpenRouterKey = localStorage.getItem(OPENROUTER_API_KEY_STORAGE_KEY)
        const savedGoogleModel = localStorage.getItem(GOOGLE_AI_MODEL_STORAGE_KEY)
        const savedOpenRouterModel = localStorage.getItem(OPENROUTER_MODEL_STORAGE_KEY)
        const savedLmstudioBaseUrl = localStorage.getItem(LMSTUDIO_BASE_URL_STORAGE_KEY)
        const savedDirectFetch = localStorage.getItem(LMSTUDIO_DIRECT_FETCH_KEY) === 'true'

        if (savedGoogleKey) setGoogleApiKey(savedGoogleKey)
        if (savedOpenRouterKey) setOpenRouterApiKey(savedOpenRouterKey)
        if (savedGoogleModel) setGoogleAiModel(savedGoogleModel)
        if (savedOpenRouterModel) setOpenRouterModel(savedOpenRouterModel)
        if (savedLmstudioBaseUrl) {
            const resolvedBaseUrl = resolveLmStudioBaseUrl(savedLmstudioBaseUrl, savedDirectFetch)
            setLmstudioBaseUrl(resolvedBaseUrl)
            localStorage.setItem(LMSTUDIO_BASE_URL_STORAGE_KEY, resolvedBaseUrl)
        } else if (savedDirectFetch) {
            const defaultBaseUrl = getDefaultLmStudioBaseUrl(true)
            setLmstudioBaseUrl(defaultBaseUrl)
            localStorage.setItem(LMSTUDIO_BASE_URL_STORAGE_KEY, defaultBaseUrl)
        }

        if (savedDirectFetch) {
            setLmstudioDirectFetchState(true)
            setDirectFetchMode(true)
        }
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

    // Save LM Studio base URL
    const saveLmstudioBaseUrl = (url: string) => {
        const nextBaseUrl = resolveLmStudioBaseUrl(url, lmstudioDirectFetch)
        localStorage.setItem(LMSTUDIO_BASE_URL_STORAGE_KEY, nextBaseUrl)
        setLmstudioBaseUrl(nextBaseUrl)
    }

    // Toggle direct browser fetch mode (browser calls LM Studio directly)
    const setLmstudioDirectFetch = (enabled: boolean) => {
        const nextBaseUrl = resolveLmStudioBaseUrl(lmstudioBaseUrl, enabled)
        localStorage.setItem(LMSTUDIO_DIRECT_FETCH_KEY, String(enabled))
        localStorage.setItem(LMSTUDIO_BASE_URL_STORAGE_KEY, nextBaseUrl)
        setLmstudioBaseUrl(nextBaseUrl)
        setLmstudioDirectFetchState(enabled)
        setDirectFetchMode(enabled)
    }

    return {
        googleApiKey,
        openRouterApiKey,
        googleAiModel,
        openRouterModel,
        lmstudioBaseUrl,
        lmstudioDirectFetch,
        saveGoogleApiKey,
        saveOpenRouterApiKey,
        saveGoogleAiModel,
        saveOpenRouterModel,
        saveLmstudioBaseUrl,
        setLmstudioDirectFetch,
    }
}
