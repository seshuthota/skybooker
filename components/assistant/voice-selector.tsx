"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { VOICE_OPTIONS, getModelOptions, getAssistantConfig } from "@/lib/config/assistant-config"
import { Settings, Zap, Bot } from "lucide-react"

interface VoiceSelectorProps {
  selectedVoice: string
  onVoiceChange: (voice: string) => void
  onTestVoice: () => void
  isPlaying: boolean
}

export function VoiceSelector({ 
  selectedVoice, 
  onVoiceChange, 
  onTestVoice, 
  isPlaying 
}: VoiceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentProvider, setCurrentProvider] = useState('')
  const [currentModel, setCurrentModel] = useState('')
  const [availableModels, setAvailableModels] = useState<any[]>([])

  useEffect(() => {
    // Fetch current configuration from API
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config')
        const config = await response.json()
        setCurrentProvider(config.provider.name)
        setCurrentModel(config.model)
        setAvailableModels(config.availableModels)
      } catch (error) {
        console.error('Failed to fetch config:', error)
        // Fallback to default
        setCurrentProvider('OpenAI')
        setCurrentModel('gpt-3.5-turbo')
        setAvailableModels([])
      }
    }
    
    fetchConfig()
  }, [])

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1"
        aria-label="Voice settings"
      >
        <Settings className="w-3 h-3" />
        {!isOpen && (
          <Badge variant="secondary" className="text-xs px-1">
            {currentProvider}
          </Badge>
        )}
      </Button>
      
      {isOpen && (
        <div className="flex flex-col gap-2 p-2 bg-background border rounded-md shadow-lg min-w-60">
          {/* Provider Info */}
          <div className="flex items-center gap-2 pb-2 border-b">
            <Bot className="w-4 h-4 text-primary" />
            <div className="flex-1">
              <div className="text-xs font-medium">{currentProvider}</div>
              <div className="text-xs text-muted-foreground">{currentModel}</div>
            </div>
            <Badge variant="outline" className="text-xs">
              {currentProvider === 'Groq' && <Zap className="w-3 h-3 mr-1" />}
              Active
            </Badge>
          </div>

          {/* Available Models */}
          <div className="space-y-1">
            <div className="text-xs font-medium">Available Models:</div>
            <div className="text-xs text-muted-foreground max-h-20 overflow-y-auto">
              {availableModels.map((model, index) => (
                <div 
                  key={model.value} 
                  className={`flex justify-between items-center p-1 rounded ${
                    model.value === currentModel ? 'bg-primary/10' : ''
                  }`}
                >
                  <span className={model.value === currentModel ? 'font-medium' : ''}>
                    {model.label}
                  </span>
                  {model.value === currentModel && <span className="text-primary">•</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Voice Selection */}
          <div className="space-y-2 pt-2 border-t">
            <div className="text-xs font-medium">Voice Settings:</div>
            <div className="flex items-center gap-2">
              <Select value={selectedVoice} onValueChange={onVoiceChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent>
                  {VOICE_OPTIONS.map((voice) => (
                    <SelectItem key={voice.value} value={voice.value}>
                      {voice.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={onTestVoice}
                disabled={isPlaying}
                className="text-xs h-8"
                aria-label="Test voice"
              >
                {isPlaying ? 'Playing...' : 'Test'}
              </Button>
            </div>
          </div>

          {/* Configuration Note */}
          <div className="text-xs text-muted-foreground pt-2 border-t">
            To change provider/model, update environment variables and restart.
          </div>
        </div>
      )}
    </div>
  )
}