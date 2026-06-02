import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'

// Components
import { ApiKeyManager, Provider } from '../components/ApiKeyManager'
import { ModelSelector } from '../components/ModelSelector'
import { UrlInput } from '../components/UrlInput'
import { UrlList } from '../components/UrlList'
import { StoredLinksManager } from '../components/StoredLinksManager'
import { EmptyState } from '../components/EmptyState'

// Hooks
import { useApiKey } from '../hooks/useApiKey'
import { useUrls } from '../hooks/useUrls'
import { usePromptGeneration } from '../hooks/usePromptGeneration'

// Utils
import { generateOpenRouterPrompt, FREE_MODEL_RATE_LIMIT } from '../utils/openRouter'
import { generateLMStudioPrompt, LMSTUDIO_RATE_LIMIT, DEFAULT_LMSTUDIO_BASE_URL } from '../utils/lmStudio'
import { generatePromptForImage, GeneratePromptOptions, RateLimitConfig } from '../utils/gemini'
import {
  clampLmstudioFastModeConcurrency,
  LMSTUDIO_FAST_MODE_MAX_CONCURRENCY,
  LMSTUDIO_FAST_MODE_MIN_CONCURRENCY,
} from '../utils/lmStudioFastMode'

// shadcn/ui components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/mode-toggle'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const {
    googleApiKey,
    openRouterApiKey,
    googleAiModel,
    openRouterModel,
    lmstudioBaseUrl,
    lmstudioDirectFetch,
    saveGoogleApiKey,
    saveOpenRouterApiKey,
    saveGoogleAiModel,
    saveOpenRouterModel,
    saveLmstudioBaseUrl,
    setLmstudioDirectFetch,
  } = useApiKey()

  const {
    urls,
    storedUrls,
    addUrl,
    removeUrl,
    pasteFromClipboard,
    setError,
    clearError,
    saveUrlsToStorage,
    clearAllStoredUrls,
    removeStoredUrl,
    loadUrlsFromStorage,
  } = useUrls()

  const { prompts, loading, progress, copiedIndex, generatePrompts: generatePromptsGoogle, generatePromptsParallel, generateSinglePrompt, copyPrompt, removePrompt, updatePrompt } =
    usePromptGeneration()

  const [provider, setProvider] = useState<Provider>('google')
  const [inputUrl, setInputUrl] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [isFreeModel, setIsFreeModel] = useState(false)
  const [delaySeconds, setDelaySeconds] = useState(2)
  const [lmstudioFastMode, setLmstudioFastMode] = useState(false)
  const [lmstudioMaxConcurrency, setLmstudioMaxConcurrency] = useState(LMSTUDIO_FAST_MODE_MAX_CONCURRENCY)

  useEffect(() => {
    if (provider === 'google') {
      setSelectedModel(googleAiModel)
    } else if (provider === 'openrouter') {
      setSelectedModel(openRouterModel)
    } else {
      setSelectedModel('')
    }
  }, [provider, googleAiModel, openRouterModel])

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

  const handleSaveUrls = () => {
    const success = saveUrlsToStorage()
    if (!success) {
      setError('No URLs to save')
      return false
    }
    setError('')
    return true
  }

  const handleProviderChange = (newProvider: Provider) => {
    setProvider(newProvider)
    const newModel = newProvider === 'google' ? googleAiModel : newProvider === 'openrouter' ? openRouterModel : ''
    setSelectedModel(newModel)
  }

  const handleModelChange = (model: string) => {
    setSelectedModel(model)
    if (provider === 'google') {
      saveGoogleAiModel(model)
    } else if (provider === 'openrouter') {
      saveOpenRouterModel(model)
    }
  }

  const handleGenerateSinglePrompt = async (url: string) => {
    let apiKey = ''
    let generatorFn: ((url: string, apiKey: string, model: string, options?: GeneratePromptOptions) => Promise<string>) | undefined
    let promptOptions: { rateLimitConfig?: RateLimitConfig; delayBetweenRequestsMs: number } = { delayBetweenRequestsMs: 0 }

    if (provider === 'google') {
      apiKey = googleApiKey
      if (!apiKey) {
        setError('Please set your Google AI API key first')
        return
      }
      generatorFn = undefined
    } else if (provider === 'openrouter') {
      apiKey = openRouterApiKey
      if (!apiKey) {
        setError('Please set your OpenRouter API key first')
        return
      }
      generatorFn = generateOpenRouterPrompt
      promptOptions.rateLimitConfig = isFreeModel ? FREE_MODEL_RATE_LIMIT : undefined
    } else {
      generatorFn = (url, _apiKey, model, opts) => generateLMStudioPrompt(url, _apiKey, model, opts, lmstudioBaseUrl || DEFAULT_LMSTUDIO_BASE_URL)
      promptOptions.rateLimitConfig = LMSTUDIO_RATE_LIMIT
    }

    clearError()

    try {
      await generateSinglePrompt(url, apiKey, selectedModel, promptOptions, generatorFn)
    } catch (err) {
      console.error('Failed to generate single prompt:', err)
    }
  }

  const handleGeneratePrompts = async () => {
    let apiKey = ''
    let generatorFn: ((url: string, apiKey: string, model: string, options?: GeneratePromptOptions) => Promise<string>) | undefined

    if (provider === 'google') {
      apiKey = googleApiKey
      if (!apiKey) {
        setError('Please set your Google AI API key first')
        return
      }
    } else if (provider === 'openrouter') {
      apiKey = openRouterApiKey
      if (!apiKey) {
        setError('Please set your OpenRouter API key first')
        return
      }
      generatorFn = generateOpenRouterPrompt
    } else {
      generatorFn = (url, _apiKey, model, opts) => generateLMStudioPrompt(url, _apiKey, model, opts, lmstudioBaseUrl || DEFAULT_LMSTUDIO_BASE_URL)
    }

    if (urls.length === 0) {
      setError('Please add at least one image URL')
      return
    }

    clearError()

    // Use parallel mode for LM Studio fast mode
    if (provider === 'lmstudio' && lmstudioFastMode) {
      await generatePromptsParallel(urls, apiKey, selectedModel, generatorFn!, { maxConcurrency: clampLmstudioFastModeConcurrency(lmstudioMaxConcurrency) })
    } else {
      // Use sequential mode with rate limiting
      const promptOptions: { rateLimitConfig?: RateLimitConfig; delayBetweenRequestsMs: number } = {
        delayBetweenRequestsMs: delaySeconds * 1000
      }

      if (provider === 'openrouter') {
        promptOptions.rateLimitConfig = isFreeModel ? FREE_MODEL_RATE_LIMIT : undefined
      } else if (provider === 'lmstudio') {
        promptOptions.rateLimitConfig = LMSTUDIO_RATE_LIMIT
      }

      await generatePromptsGoogle(urls, apiKey, selectedModel, promptOptions, generatorFn)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <ThemeToggle />
        <div className="space-y-6">
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
                onProviderChange={handleProviderChange}
                googleApiKey={googleApiKey}
                openRouterApiKey={openRouterApiKey}
                lmstudioBaseUrl={lmstudioBaseUrl}
                lmstudioDirectFetch={lmstudioDirectFetch}
                onSaveGoogleKey={saveGoogleApiKey}
                onSaveOpenRouterKey={saveOpenRouterApiKey}
                onSaveLmstudioBaseUrl={saveLmstudioBaseUrl}
              />

              <div className="pt-4 border-t">
                <div className="space-y-4">
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium">Delay between requests (seconds)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={delaySeconds}
                      onChange={(e) => setDelaySeconds(Number(e.target.value))}
                      disabled={provider === 'lmstudio' && lmstudioFastMode}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 max-w-[200px]"
                    />
                    <p className="text-xs text-muted-foreground">Adjust wait time to avoid rate limits.</p>
                  </div>

                  {provider === 'lmstudio' && (
                    <>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="fastMode"
                          checked={lmstudioFastMode}
                          onChange={(e) => setLmstudioFastMode(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="fastMode" className="text-sm font-medium cursor-pointer">
                          Fast Mode (up to 5 parallel requests)
                        </label>
                        <span className="text-xs text-muted-foreground">(no rate limiting)</span>
                      </div>
                      {lmstudioFastMode && (
                        <div className="max-w-xs space-y-2 pl-6">
                          <div className="flex items-center justify-between gap-4">
                            <label htmlFor="parallelRequests" className="text-sm font-medium">
                              Parallel requests
                            </label>
                            <span className="text-sm text-muted-foreground">{lmstudioMaxConcurrency}</span>
                          </div>
                          <input
                            id="parallelRequests"
                            type="range"
                            min={LMSTUDIO_FAST_MODE_MIN_CONCURRENCY}
                            max={LMSTUDIO_FAST_MODE_MAX_CONCURRENCY}
                            step="1"
                            value={lmstudioMaxConcurrency}
                            onChange={(e) => setLmstudioMaxConcurrency(clampLmstudioFastModeConcurrency(Number(e.target.value)))}
                            className="h-2 w-full cursor-pointer accent-primary"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{LMSTUDIO_FAST_MODE_MIN_CONCURRENCY}</span>
                            <span>{LMSTUDIO_FAST_MODE_MAX_CONCURRENCY}</span>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="directFetch"
                          checked={lmstudioDirectFetch}
                          onChange={(e) => setLmstudioDirectFetch(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="directFetch" className="text-sm font-medium cursor-pointer">
                          Direct Browser Fetch
                        </label>
                        <span className="text-xs text-muted-foreground">
                          (bypass server proxy — run <code className="text-xs bg-muted px-1 rounded">bun run proxy</code> and use <code className="text-xs bg-muted px-1 rounded">http://localhost:3001/v1</code>)
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

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
                onSaveUrls={handleSaveUrls}
                currentUrlsCount={urls.length}
                modelSelector={
                  provider !== 'lmstudio' ? (
                    <ModelSelector
                      provider={provider}
                      apiKey={provider === 'google' ? googleApiKey : openRouterApiKey}
                      baseUrl={lmstudioBaseUrl}
                      selectedModel={selectedModel}
                      onModelChange={handleModelChange}
                      onIsFreeChange={setIsFreeModel}
                      showLabel={false}
                      className="w-auto"
                    />
                  ) : undefined
                }
              />
            </CardContent>
          </Card>

          {urls.length > 0 ? (
            <UrlList
              urls={urls}
              prompts={prompts}
              loading={loading}
              progress={progress}
              copiedIndex={copiedIndex}
              onRemoveUrl={handleRemoveUrl}
              onGeneratePrompts={handleGeneratePrompts}
              onGenerateSinglePrompt={handleGenerateSinglePrompt}
              onCopyPrompt={copyPrompt}
              onPromptChange={updatePrompt}
            />
          ) : (
            <EmptyState />
          )}

          <StoredLinksManager
            storedUrls={storedUrls}
            onLoadUrls={loadUrlsFromStorage}
            onRemoveStoredUrl={removeStoredUrl}
            onClearAllStoredUrls={clearAllStoredUrls}
          />
        </div>
      </div>
    </div>
  )
}
