/**
 * Stored Links Manager Component
 */

import { useState } from 'react'
import { Trash2, Calendar, Download, Eye } from 'lucide-react'
import { StoredUrlEntry } from '../hooks/useUrls'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface StoredLinksManagerProps {
    storedUrls: StoredUrlEntry[]
    onLoadUrls: (entries: StoredUrlEntry[]) => void
    onRemoveStoredUrl: (id: string) => void
    onClearAllStoredUrls: () => void
}

export function StoredLinksManager({
    storedUrls,
    onLoadUrls,
    onRemoveStoredUrl,
    onClearAllStoredUrls,
}: StoredLinksManagerProps) {
    const [selectedDate, setSelectedDate] = useState<string>('')
    const [selectedUrls, setSelectedUrls] = useState<string[]>([])

    const uniqueDates = storedUrls
        .map(entry => entry.date)
        .filter((date, index, self) => self.indexOf(date) === index)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    const filteredUrls = selectedDate
        ? storedUrls.filter(entry => entry.date === selectedDate)
        : storedUrls

    const handleUrlSelection = (id: string) => {
        setSelectedUrls(prev =>
            prev.includes(id)
                ? prev.filter(urlId => urlId !== id)
                : [...prev, id]
        )
    }

    const handleLoadSelected = () => {
        const entriesToLoad = storedUrls.filter(entry => selectedUrls.includes(entry.id))
        onLoadUrls(entriesToLoad)
        setSelectedUrls([])
    }

    const handleLoadAll = () => {
        onLoadUrls(filteredUrls)
        setSelectedUrls([])
    }

    const handleDeleteSelected = () => {
        selectedUrls.forEach(id => onRemoveStoredUrl(id))
        setSelectedUrls([])
    }

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Stored Links ({storedUrls.length})
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {selectedUrls.length > 0 && (
                            <>
                                <Badge variant="secondary">{selectedUrls.length} selected</Badge>
                                <Button
                                    size="sm"
                                    onClick={handleLoadSelected}
                                    className="text-xs"
                                >
                                    Load Selected
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={handleDeleteSelected}
                                    className="text-xs"
                                >
                                    Delete Selected
                                </Button>
                            </>
                        )}
                        {storedUrls.length > 0 && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={onClearAllStoredUrls}
                                className="text-xs"
                            >
                                Clear All
                            </Button>
                        )}
                    </div>
                </div>
                <CardDescription>
                    Manage your saved image URLs. Load them back to workspace or delete them.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {storedUrls.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No stored links yet. Save your current URLs to see them here.
                    </div>
                ) : (
                    <>
                        {/* Date Filter */}
                        {uniqueDates.length > 1 && (
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    size="sm"
                                    variant={!selectedDate ? "default" : "outline"}
                                    onClick={() => setSelectedDate('')}
                                    className="text-xs"
                                >
                                    All Dates
                                </Button>
                                {uniqueDates.map(date => (
                                    <Button
                                        key={date}
                                        size="sm"
                                        variant={selectedDate === date ? "default" : "outline"}
                                        onClick={() => setSelectedDate(date)}
                                        className="text-xs"
                                    >
                                        {date}
                                        <Badge variant="secondary" className="ml-1 text-xs">
                                            {storedUrls.filter(entry => entry.date === date).length}
                                        </Badge>
                                    </Button>
                                ))}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                onClick={handleLoadAll}
                                disabled={filteredUrls.length === 0}
                                className="text-xs"
                            >
                                <Download className="w-3 h-3 mr-1" />
                                Load All ({filteredUrls.length})
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedUrls(filteredUrls.map(entry => entry.id))}
                                disabled={filteredUrls.length === 0}
                                className="text-xs"
                            >
                                Select All
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedUrls([])}
                                disabled={selectedUrls.length === 0}
                                className="text-xs"
                            >
                                Clear Selection
                            </Button>
                        </div>

                        {/* URLs List */}
                        <ScrollArea className="w-full h-64">
                            <div className="space-y-2">
                                {filteredUrls.map(entry => (
                                    <div
                                        key={entry.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                                            selectedUrls.includes(entry.id)
                                                ? 'bg-primary/10 border-primary'
                                                : 'bg-background border-border'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedUrls.includes(entry.id)}
                                            onChange={() => handleUrlSelection(entry.id)}
                                            className="shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className="text-xs">
                                                    {entry.date}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatTimestamp(entry.timestamp)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="truncate text-sm font-mono">
                                                    {entry.url}
                                                </div>
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-6 w-6 p-0 shrink-0"
                                                        >
                                                            <Eye className="w-3 h-3" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Image URL</DialogTitle>
                                                            <DialogDescription>
                                                                Full URL for the stored image
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="p-3 bg-muted rounded-lg">
                                                            <code className="text-sm break-all">
                                                                {entry.url}
                                                            </code>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => onRemoveStoredUrl(entry.id)}
                                            className="shrink-0 text-destructive hover:text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <ScrollBar orientation="vertical" />
                        </ScrollArea>
                    </>
                )}
            </CardContent>
        </Card>
    )
}