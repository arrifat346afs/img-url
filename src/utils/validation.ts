/**
 * Validation utilities for URL handling
 */

/**
 * Validates if a URL is a valid image URL
 */
export function isValidImageUrl(url: string): boolean {
    try {
        new URL(url)
        return url.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) !== null
    } catch {
        return false
    }
}

/**
 * Extracts image URLs from text (e.g., clipboard content)
 */
export function extractUrlsFromText(text: string): string[] {
    const urlPattern = /(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|bmp))/gi
    return text.match(urlPattern) || []
}
