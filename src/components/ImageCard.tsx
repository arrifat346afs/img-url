/**
 * Individual Image Card Component
 */

import { Trash2, Copy, Check } from 'lucide-react'
import { PromptResult } from '../utils/gemini'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface ImageCardProps {
    url: string
    index: number
    promptResult?: PromptResult
    onRemove: () => void
    onCopyPrompt: (prompt: string, index: number) => void
    isCopied: boolean
}

export function ImageCard({
    url,
    index,
    promptResult,
    onRemove,
    onCopyPrompt,
    isCopied,
}: ImageCardProps) {
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

                    {/* Prompt Result */}
                    {promptResult && (
                        <div className="space-y-2">
                            {promptResult.error ? (
                                <p className="text-sm text-destructive">Error: {promptResult.error}</p>
                            ) : (
                                <div className="space-y-2">
                                    <div className="max-h-32 overflow-y-auto text-sm bg-muted p-3 rounded-md">
                                        {promptResult.prompt}
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onCopyPrompt(promptResult.prompt, index)}
                                        className="w-full"
                                    >
                                        {isCopied ? (
                                            <>
                                                <Check className="w-4 h-4 mr-2" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-4 h-4 mr-2" />
                                                Copy Prompt
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
