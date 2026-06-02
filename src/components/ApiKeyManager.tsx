import { useState, useEffect } from "react";
import {
  Settings,
  Loader2,
  CheckCircle,
  XCircle,
  Send,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DEFAULT_LMSTUDIO_BASE_URL,
  testLmStudioConnection,
  sendChatMessage,
} from "../utils/lmStudio";

export type Provider = "google" | "openrouter" | "lmstudio";

interface ApiKeyManagerProps {
  provider: Provider;
  onProviderChange: (provider: Provider) => void;
  googleApiKey: string;
  openRouterApiKey: string;
  lmstudioBaseUrl: string;
  lmstudioDirectFetch: boolean;
  onSaveGoogleKey: (key: string) => void;
  onSaveOpenRouterKey: (key: string) => void;
  onSaveLmstudioBaseUrl: (url: string) => void;
}

export function ApiKeyManager({
  provider,
  onProviderChange,
  googleApiKey,
  openRouterApiKey,
  lmstudioBaseUrl,
  lmstudioDirectFetch,
  onSaveGoogleKey,
  onSaveOpenRouterKey,
  onSaveLmstudioBaseUrl,
}: ApiKeyManagerProps) {
  const [showInput, setShowInput] = useState(false);
  const [tempGoogleKey, setTempGoogleKey] = useState("");
  const [tempOpenRouterKey, setTempOpenRouterKey] = useState("");
  const [tempLmstudioBaseUrl, setTempLmstudioBaseUrl] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "testing" | "success" | "failed"
  >("idle");
  const [connectionMessage, setConnectionMessage] = useState("");

  const [chatMessage, setChatMessage] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  useEffect(() => {
    setTempGoogleKey(googleApiKey);
  }, [googleApiKey]);

  useEffect(() => {
    setTempOpenRouterKey(openRouterApiKey);
  }, [openRouterApiKey]);

  useEffect(() => {
    setTempLmstudioBaseUrl(lmstudioBaseUrl);
  }, [lmstudioBaseUrl]);

  useEffect(() => {
    setConnectionStatus("idle");
    setConnectionMessage("");
  }, [provider]);

  const handleTestConnection = async () => {
    const url = tempLmstudioBaseUrl || lmstudioBaseUrl;
    setConnectionStatus("testing");
    setConnectionMessage("");

    const result = await testLmStudioConnection(url);

    if (result.success) {
      setConnectionStatus("success");
    } else {
      setConnectionStatus("failed");
    }
    setConnectionMessage(result.message);
  };

  const handleSendChat = async () => {
    if (!chatMessage.trim()) return;

    const url = tempLmstudioBaseUrl || lmstudioBaseUrl;
    setChatLoading(true);
    setChatError("");

    const result = await sendChatMessage(chatMessage, url);

    if (result.success) {
      setChatResponse(result.response || "");
    } else {
      setChatError(result.error || "Failed to get response");
    }
    setChatLoading(false);
  };

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  };

  const handleSave = () => {
    if (provider === "google") {
      onSaveGoogleKey(tempGoogleKey);
    } else if (provider === "openrouter") {
      onSaveOpenRouterKey(tempOpenRouterKey);
    } else if (provider === "lmstudio") {
      onSaveLmstudioBaseUrl(tempLmstudioBaseUrl);
    }
  };

  const isCurrentKeySet =
    provider === "google"
      ? !!googleApiKey
      : provider === "openrouter"
        ? !!openRouterApiKey
        : true;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs
          value={provider}
          onValueChange={(val) => onProviderChange(val as Provider)}
          className="w-125"
        >
          <TabsList>
            <TabsTrigger value="google">Google AI</TabsTrigger>
            <TabsTrigger value="openrouter">OpenRouter</TabsTrigger>
            <TabsTrigger value="lmstudio">LM Studio</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowInput(!showInput)}
          className={
            isCurrentKeySet ? "text-green-600" : "text-muted-foreground"
          }
        >
          <Settings className="w-4 h-4 mr-2" />
          {provider === "lmstudio"
            ? "Configure"
            : isCurrentKeySet
              ? "Key Configured"
              : "Set API Key"}
        </Button>
      </div>

      {showInput && (
        <div className="space-y-3 p-4 border rounded-md bg-muted/50">
          <Label htmlFor="api-key">
            {provider === "google"
              ? "Google AI API Key"
              : provider === "openrouter"
                ? "OpenRouter API Key"
                : "LM Studio Base URL"}
          </Label>
          <div className="flex gap-2">
            <Input
              id="api-key"
              type={provider === "lmstudio" ? "text" : "password"}
              value={
                provider === "google"
                  ? tempGoogleKey
                  : provider === "openrouter"
                    ? tempOpenRouterKey
                    : tempLmstudioBaseUrl
              }
              onChange={(e) =>
                provider === "google"
                  ? setTempGoogleKey(e.target.value)
                  : provider === "openrouter"
                    ? setTempOpenRouterKey(e.target.value)
                    : setTempLmstudioBaseUrl(e.target.value)
              }
              placeholder={
                provider === "lmstudio"
                  ? DEFAULT_LMSTUDIO_BASE_URL
                  : `Enter your ${provider === "google" ? "Google" : "OpenRouter"} API key`
              }
              className="flex-1"
            />
            {provider === "lmstudio" && (
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={connectionStatus === "testing"}
              >
                {connectionStatus === "testing" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Test"
                )}
              </Button>
            )}
            <Button onClick={handleSave}>Save</Button>
          </div>
          {provider === "lmstudio" && connectionStatus !== "idle" && (
            <div
              className={`flex items-center gap-2 text-sm ${
                connectionStatus === "success"
                  ? "text-green-600"
                  : connectionStatus === "failed"
                    ? "text-red-600"
                    : ""
              }`}
            >
              {connectionStatus === "success" && (
                <CheckCircle className="w-4 h-4" />
              )}
              {connectionStatus === "failed" && <XCircle className="w-4 h-4" />}
              <span>{connectionMessage}</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {provider === "google" ? (
              <>
                Get your API key from{" "}
                <a
                  href="https://makersuite.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google AI Studio
                </a>
              </>
            ) : provider === "openrouter" ? (
              <>
                Get your API key from{" "}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  OpenRouter Dashboard
                </a>
              </>
            ) : (
              <>
                {lmstudioDirectFetch ? (
                  <>
                    Direct Browser Fetch calls LM Studio directly at{" "}
                    <code className="text-xs">{DEFAULT_LMSTUDIO_BASE_URL}</code>.
                    LM Studio must allow browser CORS/PNA requests from the deployed site.
                  </>
                ) : (
                  <>
                    Use your LM Studio server URL. Default:{" "}
                    <code className="text-xs">{DEFAULT_LMSTUDIO_BASE_URL}</code>.
                  </>
                )}
              </>
            )}
          </p>
        </div>
      )}

      {provider === "lmstudio" && (
        <div className="space-y-3 p-4 border rounded-md bg-muted/50">
          <Label>Quick Chat Test</Label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={handleChatKeyPress}
                placeholder="Send a message to test the AI..."
                disabled={chatLoading}
              />
              <Button
                onClick={handleSendChat}
                disabled={chatLoading || !chatMessage.trim()}
              >
                {chatLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>

            {(chatResponse || chatError) && (
              <div className="mt-3 p-3 bg-background rounded-md border">
                {chatError ? (
                  <div className="text-sm text-red-500 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    {chatError}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Bot className="w-3 h-3" />
                      <span>AI Response:</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">
                      {chatResponse}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Use this to quickly test if your local AI is responding.
          </p>
        </div>
      )}
    </div>
  );
}
