import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

// Components
import { ApiKeyManager } from '../components/ApiKeyManager'
import { ModelSelector } from '../components/ModelSelector'
import { UrlInput } from '../components/UrlInput'
import { UrlList } from '../components/UrlList'
import { EmptyState } from '../components/EmptyState'

// Hooks
import { useApiKey } from '../hooks/useApiKey'
import { useUrls } from '../hooks/useUrls'
import { usePromptGeneration } from '../hooks/usePromptGeneration'

// shadcn/ui components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/mode-toggle'

export const Route = createFileRoute('/')({ component: App })

function App() {
  // State management via custom hooks
  const { apiKey, tempApiKey, setTempApiKey, saveApiKey } = useApiKey()
  const {
    urls,
    addUrl,
    removeUrl,
    pasteFromClipboard,
    setError,
    clearError,
  } = useUrls()
  const { prompts, loading, copiedIndex, generatePrompts, copyPrompt, removePrompt } =
    usePromptGeneration()

  // Local UI state
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const [inputUrl, setInputUrl] = useState('')
  const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash-lite')

  // Handlers
  const handleSaveApiKey = () => {
    if (saveApiKey()) {
      setShowApiKeyInput(false)
      clearError()
    }
  }

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

  const handleGeneratePrompts = async () => {
    if (!apiKey) {
      setError('Please set your Google AI API key first')
      setShowApiKeyInput(true)
      return
    }

    if (urls.length === 0) {
      setError('Please add at least one image URL')
      return
    }

    clearError()
    await generatePrompts(urls, apiKey, selectedModel)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <ThemeToggle />
        <div className="space-y-6">
          {/* API Key Manager */}
          {!apiKey && (
            <Card>
              <CardHeader>
                <CardTitle>API Configuration</CardTitle>
                <CardDescription>
                  Set up your Google AI API key and select your preferred model
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ApiKeyManager
                  apiKey={apiKey}
                  tempApiKey={tempApiKey}
                  showInput={showApiKeyInput}
                  onToggleInput={() => setShowApiKeyInput(!showApiKeyInput)}
                  onApiKeyChange={setTempApiKey}
                  onSave={handleSaveApiKey}
                />
              </CardContent>
            </Card>
          )}

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
                    apiKey={apiKey}
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
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
              copiedIndex={copiedIndex}
              onRemoveUrl={handleRemoveUrl}
              onGeneratePrompts={handleGeneratePrompts}
              onCopyPrompt={copyPrompt}
            />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  )
}
