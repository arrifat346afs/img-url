/**
 * API Key Manager Component
 */

import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from './ui/label'

interface ApiKeyManagerProps {
    apiKey: string
    tempApiKey: string
    showInput: boolean
    onToggleInput: () => void
    onApiKeyChange: (key: string) => void
    onSave: () => void
}

export function ApiKeyManager({
    apiKey,
    tempApiKey,
    showInput,
    onToggleInput,
    onApiKeyChange,
    onSave,
}: ApiKeyManagerProps) {
    return (
        <div className="space-y-4">
            <Button
                variant="outline"
                onClick={onToggleInput}
                className="w-full justify-start"
            >
                <Settings className="w-4 h-4 mr-2" />
                {apiKey ? 'API Key Configured' : 'Set API Key'}
            </Button>

            {showInput && (
                <div className="space-y-3">
                    <Label htmlFor="api-key">Google AI API Key</Label>
                    <div className="flex gap-2">
                        <Input
                            id="api-key"
                            type="password"
                            value={tempApiKey}
                            onChange={(e) => onApiKeyChange(e.target.value)}
                            placeholder="Enter your Google AI API key"
                            className="flex-1"
                        />
                        <Button onClick={onSave}>
                            Save
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Get your API key from{' '}
                        <a
                            href="https://makersuite.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                        >
                            Google AI Studio
                        </a>
                    </p>
                </div>
            )}
        </div>
    )
}
