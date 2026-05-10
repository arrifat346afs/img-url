/**
 * Model Selector Component with dynamic model fetching
 */

import { useState, useEffect } from 'react'

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Check, ChevronsUpDown, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

import { fetchAvailableModels } from '../utils/gemini'
import { fetchOpenRouterModels, OpenRouterModel } from '../utils/openRouter'
import { fetchLMStudioModels, LMStudioModel } from '../utils/lmStudio'

interface ModelSelectorProps {
    provider: 'google' | 'openrouter' | 'lmstudio'
    apiKey: string
    baseUrl?: string
    selectedModel: string
    onModelChange: (model: string) => void
    onIsFreeChange?: (isFree: boolean) => void
    showLabel?: boolean
    className?: string
}

export function ModelSelector({
    provider,
    apiKey,
    baseUrl,
    selectedModel,
    onModelChange,
    onIsFreeChange,
    showLabel = true,
    className
}: ModelSelectorProps) {
    const [googleModels, setGoogleModels] = useState<string[]>([])
    const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModel[]>([])
    const [lmstudioModels, setLmstudioModels] = useState<LMStudioModel[]>([])

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [open, setOpen] = useState(false) // For combobox

    useEffect(() => {
        loadModels()
    }, [provider, apiKey, baseUrl])

    const loadModels = async () => {
        setLoading(true)
        setError(null)
        try {
            if (provider === 'google') {
                const models = await fetchAvailableModels(apiKey)
                setGoogleModels(models)
                setOpenRouterModels([])
                setLmstudioModels([])

                if (!selectedModel || !models.includes(selectedModel)) {
                    if (models.includes('gemini-1.5-flash')) {
                        onModelChange('gemini-1.5-flash')
                    } else if (models.length > 0) {
                        onModelChange(models[0])
                    }
                }
            } else if (provider === 'openrouter') {
                const models = await fetchOpenRouterModels(apiKey)
                setOpenRouterModels(models)
                setGoogleModels([])
                setLmstudioModels([])

                const currentModelData = models.find(m => m.id === selectedModel)
                const currentExists = !!currentModelData

                if (!selectedModel || !currentExists) {
                    const defaultModel = models.find(m => m.id === 'google/gemini-flash-1.5') ??
                        models.find(m => m.id === 'anthropic/claude-3-haiku') ??
                        models[0]
                    if (defaultModel) {
                        onModelChange(defaultModel.id)
                        onIsFreeChange?.(isFree(defaultModel))
                    }
                } else if (currentModelData) {
                    onIsFreeChange?.(isFree(currentModelData))
                }
            } else { // provider === 'lmstudio'
                const models = await fetchLMStudioModels(baseUrl || 'http://localhost:1234/v1')
                setLmstudioModels(models)
                setGoogleModels([])
                setOpenRouterModels([])

                if (!selectedModel || !models.find(m => m.id === selectedModel)) {
                    if (models.length > 0) {
                        onModelChange(models[0].id)
                    }
                }
            }
        } catch (err) {
            console.error('Failed to load models:', err)
            setError('Failed to load models')
            if (provider === 'google' && !selectedModel) onModelChange('gemini-1.5-flash')
        } finally {
            setLoading(false)
        }
    }

    const isFree = (model: OpenRouterModel) => {
        return model.pricing.prompt === "0" && model.pricing.completion === "0"
    }

    if (error) {
        return (
            <div className="flex items-center space-x-2 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
                <Button variant="ghost" size="sm" onClick={loadModels} className="h-6 px-2">Retry</Button>
            </div>
        )
    }

    return (
        <div className={cn("space-y-2", className)}>
            {showLabel && <label className="text-sm font-medium">Model</label>}

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between font-normal"
                        disabled={loading}
                    >
                        {loading ? "Loading models..." : (
                            selectedModel
                                ? (provider === 'google'
                                    ? googleModels.find(m => m === selectedModel)
                                    : provider === 'openrouter'
                                    ? openRouterModels.find((model) => model.id === selectedModel)?.name
                                    : lmstudioModels.find((model) => model.id === selectedModel)?.name || selectedModel)
                                : "Select model..."
                        )}
                        {loading ? <Loader2 className="ml-2 h-4 w-4 animate-spin shrink-0 opacity-50" /> : <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Search models..." />
                        <CommandList>
                            <CommandEmpty>No model found.</CommandEmpty>
                            <CommandGroup>
                                {provider === 'google' ? (
                                    googleModels.map((model) => (
                                        <CommandItem
                                            key={model}
                                            value={model}
                                            onSelect={() => {
                                                onModelChange(model)
                                                setOpen(false)
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedModel === model ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {model}
                                        </CommandItem>
                                    ))
                                ) : provider === 'openrouter' ? (
                                    openRouterModels.map((model) => (
                                        <CommandItem
                                            key={model.id}
                                            value={model.name}
                                            onSelect={() => {
                                                onModelChange(model.id)
                                                onIsFreeChange?.(isFree(model))
                                                setOpen(false)
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedModel === model.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {model.name}
                                            {isFree(model) && (
                                                <span className="ml-2 text-xs text-green-500">(Free)</span>
                                            )}
                                        </CommandItem>
                                    ))
                                ) : (
                                    lmstudioModels.map((model) => (
                                        <CommandItem
                                            key={model.id}
                                            value={model.name || model.id}
                                            onSelect={() => {
                                                onModelChange(model.id)
                                                setOpen(false)
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedModel === model.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {model.name || model.id}
                                        </CommandItem>
                                    ))
                                )}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}
