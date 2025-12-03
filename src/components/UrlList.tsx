/**
 * URL List Component
 */

import { Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react'
import { ImageCard } from './ImageCard'
import { PromptResult } from '../utils/gemini'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

interface UrlListProps {
    urls: string[]
    prompts: Map<string, PromptResult>
    loading: boolean
    copiedIndex: number | null
    onRemoveUrl: (index: number) => void
    onGeneratePrompts: () => void
    onCopyPrompt: (prompt: string, index: number) => void
}

export function UrlList({
    urls,
    prompts,
    loading,
    copiedIndex,
    onRemoveUrl,
    onGeneratePrompts,
    onCopyPrompt,
}: UrlListProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" />
                        Image URLs ({urls.length})
                    </CardTitle>
                    <Button
                        onClick={onGeneratePrompts}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Generate Prompts
                            </>
                        )}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex gap-4 pb-4">
                        {urls.map((url, index) => (
                            <div key={index} className="w-80 flex-shrink-0">
                                <ImageCard
                                    url={url}
                                    index={index}
                                    promptResult={prompts.get(url)}
                                    onRemove={() => onRemoveUrl(index)}
                                    onCopyPrompt={onCopyPrompt}
                                    isCopied={copiedIndex === index}
                                />
                            </div>
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
