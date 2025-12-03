/**
 * Google Gemini AI API utilities
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

export interface PromptResult {
    url: string
    prompt: string
    error?: string
}

/**
 * Fetch available models from Google AI
 */
export async function fetchAvailableModels(): Promise<string[]> {
    try {
        // Note: listModels may not be available in all SDK versions
        // Fallback to a predefined list of known models
        const knownModels = [
            'gemini-2.0-flash-lite',
            'gemini-1.5-flash',
            'gemini-1.5-flash-8b',
            'gemini-1.5-pro',
            'gemini-pro',
        ]

        return knownModels
    } catch (error) {
        console.error('Failed to fetch models:', error)
        // Return default models on error
        return ['gemini-2.0-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-pro']
    }
}

/**
 * Convert image URL to base64
 */
export async function imageToBase64(
    url: string
): Promise<{ data: string; mimeType: string }> {
    const response = await fetch(url)
    const blob = await response.blob()

    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
            const base64String = reader.result as string
            resolve({
                data: base64String.split(',')[1],
                mimeType: blob.type,
            })
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
    })
}

/**
 * Generate AI prompt for a single image
 */
export async function generatePromptForImage(
    url: string,
    apiKey: string,
    model: string
): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey)
    const generativeModel = genAI.getGenerativeModel({ model })

    const { data, mimeType } = await imageToBase64(url)

    const imagePart = {
        inlineData: {
            data,
            mimeType,
        },
    }

    const promptText = `Analyze this image in detail and create a comprehensive prompt that could be used to generate a similar image using AI image generation tools like Midjourney, DALL-E, or Stable Diffusion.

Include the following in your prompt:
1. Main subject and composition
2. Art style and medium (e.g., photography, digital art, painting, 3D render)
3. Lighting and atmosphere
4. Color palette and mood
5. Camera angle and perspective
6. Technical details (depth of field, resolution quality)
7. Any text or graphic elements
8. Background and environment
9. Specific details about objects, people, or elements
10. Keywords for style modifiers

Format the response as a single, detailed prompt that starts with the main subject and flows naturally. Make it ready to use directly in an AI image generator.`

    const result = await generativeModel.generateContent([promptText, imagePart])
    return result.response.text()
}
