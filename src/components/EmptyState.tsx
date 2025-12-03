/**
 * Empty state component when no URLs are added
 */

import { Image as ImageIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function EmptyState() {
    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <ImageIcon className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                    No images yet
                </h3>
                <p className="text-muted-foreground">
                    Add image URLs to get started with AI prompt generation
                </p>
            </CardContent>
        </Card>
    )
}
