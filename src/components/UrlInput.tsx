/**
 * URL Input Component
 */

import { Link2, Clipboard, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface UrlInputProps {
    inputValue: string
    onInputChange: (value: string) => void
    onAddUrl: () => void
    onPasteFromClipboard: () => void
    onSaveUrls?: () => boolean
    currentUrlsCount?: number
    modelSelector?: React.ReactNode
}

export function UrlInput({
    inputValue,
    onInputChange,
    onAddUrl,
    onPasteFromClipboard,
    onSaveUrls,
    currentUrlsCount = 0,
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

            <div className="flex gap-2">
                <Button
                    variant="outline"
                    onClick={onPasteFromClipboard}
                    className="flex-1"
                >
                    <Clipboard className="w-4 h-4 mr-2" />
                    Paste from Clipboard
                </Button>
                {onSaveUrls && currentUrlsCount > 0 && (
                    <Button
                        variant="outline"
                        onClick={onSaveUrls}
                        className="flex-1"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Save URLs ({currentUrlsCount})
                    </Button>
                )}
            </div>
        </div>
    )
}
