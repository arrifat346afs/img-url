import { useState, useEffect } from 'react'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from './ui/label'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type Provider = 'google' | 'openrouter' | 'lmstudio'

interface ApiKeyManagerProps {
    provider: Provider
    onProviderChange: (provider: Provider) => void
    googleApiKey: string
    openRouterApiKey: string
    lmstudioBaseUrl: string
    onSaveGoogleKey: (key: string) => void
    onSaveOpenRouterKey: (key: string) => void
    onSaveLmstudioBaseUrl: (url: string) => void
}

export function ApiKeyManager({
    provider,
    onProviderChange,
    googleApiKey,
    openRouterApiKey,
    lmstudioBaseUrl,
    onSaveGoogleKey,
    onSaveOpenRouterKey,
    onSaveLmstudioBaseUrl,
}: ApiKeyManagerProps) {
    const [showInput, setShowInput] = useState(false)
    const [tempGoogleKey, setTempGoogleKey] = useState('')
    const [tempOpenRouterKey, setTempOpenRouterKey] = useState('')
    const [tempLmstudioBaseUrl, setTempLmstudioBaseUrl] = useState('')

    useEffect(() => {
        setTempGoogleKey(googleApiKey)
    }, [googleApiKey])

    useEffect(() => {
        setTempOpenRouterKey(openRouterApiKey)
    }, [openRouterApiKey])

    useEffect(() => {
        setTempLmstudioBaseUrl(lmstudioBaseUrl)
    }, [lmstudioBaseUrl])

    const handleSave = () => {
        if (provider === 'google') {
            onSaveGoogleKey(tempGoogleKey)
        } else if (provider === 'openrouter') {
            onSaveOpenRouterKey(tempOpenRouterKey)
        } else if (provider === 'lmstudio') {
            onSaveLmstudioBaseUrl(tempLmstudioBaseUrl)
        }
    }

    const isCurrentKeySet = provider === 'google' ? !!googleApiKey : provider === 'openrouter' ? !!openRouterApiKey : true

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Tabs value={provider} onValueChange={(val) => onProviderChange(val as Provider)} className="w-[500px]">
                    <TabsList>
                        <TabsTrigger value="google">Google AI</TabsTrigger>
                        <TabsTrigger value="openrouter">OpenRouter</TabsTrigger>
                        <TabsTrigger value="lmstudio">LM Studio</TabsTrigger>
                    </TabsList>
                </Tabs>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowInput(!showInput)}
                    className={isCurrentKeySet ? "text-green-600" : "text-muted-foreground"}
                >
                    <Settings className="w-4 h-4 mr-2" />
                    {provider === 'lmstudio' ? 'Configure' : isCurrentKeySet ? 'Key Configured' : 'Set API Key'}
                </Button>
            </div>

            {showInput && (
                <div className="space-y-3 p-4 border rounded-md bg-muted/50">
                    <Label htmlFor="api-key">
                        {provider === 'google' ? 'Google AI API Key' : provider === 'openrouter' ? 'OpenRouter API Key' : 'LM Studio Base URL'}
                    </Label>
                    <div className="flex gap-2">
                        <Input
                            id="api-key"
                            type={provider === 'lmstudio' ? 'text' : 'password'}
                            value={provider === 'google' ? tempGoogleKey : provider === 'openrouter' ? tempOpenRouterKey : tempLmstudioBaseUrl}
                            onChange={(e) => provider === 'google' ? setTempGoogleKey(e.target.value) : provider === 'openrouter' ? setTempOpenRouterKey(e.target.value) : setTempLmstudioBaseUrl(e.target.value)}
                            placeholder={provider === 'lmstudio' ? 'http://localhost:1234/v1' : `Enter your ${provider === 'google' ? 'Google' : 'OpenRouter'} API key`}
                            className="flex-1"
                        />
                        <Button onClick={handleSave}>
                            Save
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {provider === 'google' ? (
                            <>
                                Get your API key from{' '}
                                <a
                                    href="https://makersuite.google.com/app/apikey"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    Google AI Studio
                                </a>
                            </>
                        ) : provider === 'openrouter' ? (
                            <>
                                Get your API key from{' '}
                                <a
                                    href="https://openrouter.ai/keys"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    OpenRouter Dashboard
                                </a>
                            </>
                        ) : (
                            <>
                                Enter the URL of your local LM Studio server. Default:{' '}
                                <code className="text-xs">http://localhost:1234/v1</code>
                            </>
                        )}
                    </p>
                </div>
            )}
        </div>
    )
}
