import { useState, useEffect } from 'react'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from './ui/label'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type Provider = 'google' | 'openrouter'

interface ApiKeyManagerProps {
    provider: Provider
    onProviderChange: (provider: Provider) => void
    googleApiKey: string
    openRouterApiKey: string
    onSaveGoogleKey: (key: string) => void
    onSaveOpenRouterKey: (key: string) => void
}

export function ApiKeyManager({
    provider,
    onProviderChange,
    googleApiKey,
    openRouterApiKey,
    onSaveGoogleKey,
    onSaveOpenRouterKey,
}: ApiKeyManagerProps) {
    const [showInput, setShowInput] = useState(false)
    const [tempGoogleKey, setTempGoogleKey] = useState('')
    const [tempOpenRouterKey, setTempOpenRouterKey] = useState('')

    useEffect(() => {
        setTempGoogleKey(googleApiKey)
    }, [googleApiKey])

    useEffect(() => {
        setTempOpenRouterKey(openRouterApiKey)
    }, [openRouterApiKey])

    const handleSave = () => {
        if (provider === 'google') {
            onSaveGoogleKey(tempGoogleKey)
        } else {
            onSaveOpenRouterKey(tempOpenRouterKey)
        }
    }

    const isCurrentKeySet = provider === 'google' ? !!googleApiKey : !!openRouterApiKey

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Tabs value={provider} onValueChange={(val) => onProviderChange(val as Provider)} className="w-[400px]">
                    <TabsList>
                        <TabsTrigger value="google">Google AI</TabsTrigger>
                        <TabsTrigger value="openrouter">OpenRouter</TabsTrigger>
                    </TabsList>
                </Tabs>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowInput(!showInput)}
                    className={isCurrentKeySet ? "text-green-600" : "text-muted-foreground"}
                >
                    <Settings className="w-4 h-4 mr-2" />
                    {isCurrentKeySet ? 'Key Configured' : 'Set API Key'}
                </Button>
            </div>

            {showInput && (
                <div className="space-y-3 p-4 border rounded-md bg-muted/50">
                    <Label htmlFor="api-key">
                        {provider === 'google' ? 'Google AI API Key' : 'OpenRouter API Key'}
                    </Label>
                    <div className="flex gap-2">
                        <Input
                            id="api-key"
                            type="password"
                            value={provider === 'google' ? tempGoogleKey : tempOpenRouterKey}
                            onChange={(e) => provider === 'google' ? setTempGoogleKey(e.target.value) : setTempOpenRouterKey(e.target.value)}
                            placeholder={`Enter your ${provider === 'google' ? 'Google' : 'OpenRouter'} API key`}
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
                        ) : (
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
                        )}
                    </p>
                </div>
            )}
        </div>
    )
}
