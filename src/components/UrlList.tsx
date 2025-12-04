/**
 * URL List Component
 */

import { Image as ImageIcon, Sparkles, Loader2, Download } from 'lucide-react'
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
    // Get all successfully generated prompts (non-empty, no errors)
    const getSuccessfulPrompts = (): string[] => {
        const successfulPrompts: string[] = []
        prompts.forEach((result) => {
            if (result.prompt && !result.error) {
                // Normalize the prompt to a single line by replacing newlines with spaces
                const singleLinePrompt = result.prompt.replace(/[\r\n]+/g, ' ').trim()
                if (singleLinePrompt) {
                    successfulPrompts.push(singleLinePrompt)
                }
            }
        })
        return successfulPrompts
    }

    const handleExportPrompts = () => {
        const successfulPrompts = getSuccessfulPrompts()
        if (successfulPrompts.length === 0) {
            return
        }

        // Join prompts with single newline (no blank lines between)
        const content = successfulPrompts.join('\n')

        // Create blob and trigger download
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'generated-prompts.txt'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    const hasExportablePrompts = getSuccessfulPrompts().length > 0

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" />
                        Image URLs ({urls.length})
                    </CardTitle>
                    <div className="flex items-center gap-2">
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
                        <Button
                            variant="outline"
                            onClick={handleExportPrompts}
                            disabled={!hasExportablePrompts || loading}
                            title={hasExportablePrompts ? 'Export prompts to text file' : 'No prompts to export'}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex gap-4 pb-4">
                        {urls.map((url, index) => (
                            <div key={index} className="w-80 shrink-0">
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
