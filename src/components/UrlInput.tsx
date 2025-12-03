/**
 * URL Input Component
 */

import { Link2, Clipboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface UrlInputProps {
    inputValue: string
    onInputChange: (value: string) => void
    onAddUrl: () => void
    onPasteFromClipboard: () => void
    modelSelector?: React.ReactNode
}

export function UrlInput({
    inputValue,
    onInputChange,
    onAddUrl,
    onPasteFromClipboard,
    modelSelector,
}: UrlInputProps) {
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onAddUrl()
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                {modelSelector}
                <Input
                    type="text"
                    value={inputValue}
                    onChange={(e) => onInputChange(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Paste image URL here..."
                    className="flex-1"
                />
                <Button onClick={onAddUrl}>
                    <Link2 className="w-4 h-4 mr-2" />
                    Add URL
                </Button>
            </div>

            <Button
                variant="outline"
                onClick={onPasteFromClipboard}
                className="w-full"
            >
                <Clipboard className="w-4 h-4 mr-2" />
                Paste from Clipboard
            </Button>
        </div>
    )
}
