/**
 * Individual Image Card Component
 */

import { Trash2, Copy, Check, Loader2, Clock, AlertTriangle } from 'lucide-react'
import { PromptResult } from '../utils/gemini'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

interface ImageCardProps {
    url: string
    index: number
    promptResult?: PromptResult
    onRemove: () => void
    onCopyPrompt: (prompt: string, index: number) => void
    onPromptChange?: (url: string, newPrompt: string) => void
    isCopied: boolean
}

export function ImageCard({
    url,
    index,
    promptResult,
    onRemove,
    onCopyPrompt,
    onPromptChange,
    isCopied,
}: ImageCardProps) {
    const renderContent = () => {
        if (!promptResult) {
            return (
                <div className="text-sm text-muted-foreground italic">
                    Ready to generate
                </div>
            )
        }

        const { status, error, prompt } = promptResult

        switch (status) {
            case 'pending':
                return (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                        <Clock className="w-4 h-4" />
                        <span>Waiting in queue...</span>
                    </div>
                )
            case 'generating':
                return (
                    <div className="flex items-center gap-2 text-sm text-blue-500 bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-md">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating prompt...</span>
                    </div>
                )
            case 'retrying':
                return (
                    <div className="flex items-center gap-2 text-sm text-amber-500 bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-md">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{error || 'Rate limit hit. Retrying...'}</span>
                    </div>
                )
            case 'error':
                return (
                    <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{error || 'Failed to generate prompt'}</span>
                    </div>
                )
            case 'completed':
            default:
                // Fallback for existing prompts without status or completed ones
                if (error) {
                    return (
                        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )
                }
                return (
                    <div className="relative">
                        <Textarea
                            value={prompt}
                            onChange={(e) => onPromptChange?.(url, e.target.value)}
                            placeholder="Generated prompt will appear here..."
                            rows={4}
                            className="text-sm pr-10"
                        />
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onCopyPrompt(prompt, index)}
                            className="absolute top-2 right-2 h-7 w-7"
                            title={isCopied ? 'Copied!' : 'Copy Prompt'}
                        >
                            {isCopied ? (
                                <Check className="w-4 h-4 text-green-500" />
                            ) : (
                                <Copy className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                )
        }
    }

    return (
        <Card className="group relative">
            <CardContent className="p-0">
                {/* Image Preview */}
                <div className="relative h-48 bg-muted overflow-hidden rounded-t-lg">
                    <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                            e.currentTarget.src =
                                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23334155" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="14"%3EImage Error%3C/text%3E%3C/svg%3E'
                        }}
                    />
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={onRemove}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>

                <div className="p-4 space-y-3">
                    {/* URL */}
                    <div className="text-sm text-muted-foreground truncate">
                        {url}
                    </div>

                    {/* Prompt Result / Status */}
                    <div className="space-y-2">
                        {renderContent()}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
