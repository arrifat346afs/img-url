/**
 * Model Selector Component with dynamic model fetching
 */

import { useState, useEffect } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { fetchAvailableModels } from '../utils/gemini'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from './ui/label'

interface ModelSelectorProps {
    apiKey: string
    selectedModel: string
    onModelChange: (model: string) => void
}

export function ModelSelector({
    apiKey,
    selectedModel,
    onModelChange,
    className,
    showLabel = true,
}: ModelSelectorProps & { className?: string; showLabel?: boolean }) {
    const [models, setModels] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (apiKey) {
            loadModels()
        }
    }, [apiKey])

    const loadModels = async () => {
        setLoading(true)
        setError('')
        try {
            const availableModels = await fetchAvailableModels()
            setModels(availableModels)

            // Set default model if not already selected
            if (!selectedModel && availableModels.length > 0) {
                // Prefer gemini-2.0-flash-lite specifically
                const defaultModel =
                    availableModels.find((m) => m === 'gemini-2.0-flash-lite') ||
                    availableModels.find((m) => m.includes('gemini-2.0-flash-lite')) ||
                    availableModels.find((m) => m.includes('gemini-1.5-flash')) ||
                    availableModels[0]
                onModelChange(defaultModel)
            }
        } catch (err) {
            setError('Failed to load models')
            // Fallback to default models
            const fallbackModels = ['gemini-2.0-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-pro']
            setModels(fallbackModels)
            if (!selectedModel) {
                onModelChange(fallbackModels[0])
            }
        } finally {
            setLoading(false)
        }
    }

    if (!apiKey) {
        return null
    }

    return (
        <div className={className || "space-y-2"}>
            {showLabel && <Label htmlFor="model-select">AI Model</Label>}
            <Select value={selectedModel} onValueChange={onModelChange} disabled={loading}>
                <SelectTrigger className={!showLabel ? "w-[200px]" : ""}>
                    <div className="flex items-center">
                        <Sparkles className="w-4 h-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Select a model" />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    {loading ? (
                        <div className="flex items-center justify-center p-2">
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Loading models...
                        </div>
                    ) : models.length > 0 ? (
                        models.map((model) => (
                            <SelectItem key={model} value={model}>
                                {model}
                            </SelectItem>
                        ))
                    ) : (
                        <SelectItem value="" disabled>
                            No models available
                        </SelectItem>
                    )}
                </SelectContent>
            </Select>
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    )
}
