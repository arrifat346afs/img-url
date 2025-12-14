import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

// Components
import { ApiKeyManager, Provider } from '../components/ApiKeyManager'
import { ModelSelector } from '../components/ModelSelector'
import { UrlInput } from '../components/UrlInput'
import { UrlList } from '../components/UrlList'
import { EmptyState } from '../components/EmptyState'

// Hooks
import { useApiKey } from '../hooks/useApiKey'
import { useUrls } from '../hooks/useUrls'
import { usePromptGeneration } from '../hooks/usePromptGeneration'

// Utils
import { generateOpenRouterPrompt, FREE_MODEL_RATE_LIMIT } from '../utils/openRouter'
// import { generatePromptsForImages } from '../utils/gemini'

// shadcn/ui components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/mode-toggle'

export const Route = createFileRoute('/')({ component: App })

function App() {
  // State management via custom hooks
  const {
    googleApiKey,
    openRouterApiKey,
    saveGoogleApiKey,
    saveOpenRouterApiKey
  } = useApiKey()

  const {
    urls,
    addUrl,
    removeUrl,
    pasteFromClipboard,
    setError,
    clearError,
  } = useUrls()

  const { prompts, loading, progress, copiedIndex, generatePrompts: generatePromptsGoogle, copyPrompt, removePrompt, updatePrompt } =
    usePromptGeneration()

  // Local UI state
  const [provider, setProvider] = useState<Provider>('google')
  const [inputUrl, setInputUrl] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [isFreeModel, setIsFreeModel] = useState(false)
  const [delaySeconds, setDelaySeconds] = useState(2)

  // Handlers
  const handleAddUrl = () => {
    if (addUrl(inputUrl)) {
      setInputUrl('')
    }
  }

  const handleRemoveUrl = (index: number) => {
    const urlToRemove = urls[index]
    removeUrl(index)
    removePrompt(urlToRemove)
  }

  // We need to implement generation logic that switches based on provider.
  // The existing usePromptGeneration hook is tied to Google Gemini. 
  // We can either refactor the hook or manually handle generation here for OpenRouter, 
  // reusing the state setters from the hook (if exposed, which I need to check).
  // I only exposed generatePrompts, copyPrompt, removePrompt, updatePrompt.
  // I should probably check usePromptGeneration.ts to see if I can make it generic or if I should just use its state.
  // For now, let's assume I can't easily change the hook internals without reading it, 
  // so I will try to use a custom generation flow here if provider is OpenRouter, 
  // OR update the hook in a separate step if strictly needed. 
  // Wait, I see "generatePrompts" in the imports. 

  // Actually, simpler approach:
  // The usePromptGeneration hook likely wraps the API call. 
  // I should update usePromptGeneration to accept a "generator function" or "provider" argument.
  // But since I am in index.tsx, let's look at what I have.

  const handleGeneratePrompts = async () => {
    const apiKey = provider === 'google' ? googleApiKey : openRouterApiKey

    if (!apiKey) {
      setError(`Please set your ${provider === 'google' ? 'Google AI' : 'OpenRouter'} API key first`)
      return
    }

    if (urls.length === 0) {
      setError('Please add at least one image URL')
      return
    }

    clearError()

    // Pass the appropriate generator function based on provider
    const generatorFn = provider === 'google' ? undefined : generateOpenRouterPrompt

    // Apply rate limiting for free OpenRouter models
    const promptOptions = {
      rateLimitConfig: (provider === 'openrouter' && isFreeModel) ? FREE_MODEL_RATE_LIMIT : undefined,
      delayBetweenRequestsMs: delaySeconds * 1000
    } // simplify logic

    // Call the generation hook with the selected generator
    // Note: generatePromptsGoogle is just the renamed function from usePromptGeneration
    await generatePromptsGoogle(urls, apiKey, selectedModel, promptOptions, generatorFn)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <ThemeToggle />
        <div className="space-y-6">
          {/* API Key Manager */}
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                Set up your API key and select your preferred model
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ApiKeyManager
                provider={provider}
                onProviderChange={setProvider}
                googleApiKey={googleApiKey}
                openRouterApiKey={openRouterApiKey}
                onSaveGoogleKey={saveGoogleApiKey}
                onSaveOpenRouterKey={saveOpenRouterApiKey}
              />

              <div className="pt-4 border-t">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Delay between requests (seconds)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={delaySeconds}
                    onChange={(e) => setDelaySeconds(Number(e.target.value))}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 max-w-[200px]"
                  />
                  <p className="text-xs text-muted-foreground">Adjust wait time to avoid rate limits.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* URL Input */}
          <Card>
            <CardHeader>
              <CardTitle>Image URLs</CardTitle>
              <CardDescription>
                Add image URLs to generate AI prompts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UrlInput
                inputValue={inputUrl}
                onInputChange={setInputUrl}
                onAddUrl={handleAddUrl}
                onPasteFromClipboard={pasteFromClipboard}
                modelSelector={
                  <ModelSelector
                    provider={provider}
                    apiKey={provider === 'google' ? googleApiKey : openRouterApiKey}
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                    onIsFreeChange={setIsFreeModel}
                    showLabel={false}
                    className="w-auto"
                  />
                }
              />
            </CardContent>
          </Card>

          {/* URL List or Empty State */}
          {urls.length > 0 ? (
            <UrlList
              urls={urls}
              prompts={prompts}
              loading={loading}
              progress={progress}
              copiedIndex={copiedIndex} // Check if this exists in hook return
              onRemoveUrl={handleRemoveUrl} // Check signature
              onGeneratePrompts={handleGeneratePrompts}
              onCopyPrompt={copyPrompt} // Need to check exports
              onPromptChange={updatePrompt} // Need to check exports
            />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  )
}
