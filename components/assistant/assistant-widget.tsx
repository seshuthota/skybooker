"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, MessageCircle, Settings, Minimize2, Maximize2 } from "lucide-react"
import { ChatInterface } from "./chat-interface"
import { VoiceControls } from "./voice-controls"
import { VoiceSelector } from "./voice-selector"

interface Message {
  id: string
  content: string
  sender: 'user' | 'assistant'
  timestamp: number
}

export function AssistantWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedVoice, setSelectedVoice] = useState('af_bella')
  const [currentProvider, setCurrentProvider] = useState('')

  useEffect(() => {
    // Fetch provider info and add welcome message
    const initializeWidget = async () => {
      try {
        const response = await fetch('/api/config')
        const config = await response.json()
        setCurrentProvider(config.provider.name)
        
        const welcomeMessage: Message = {
          id: 'welcome',
          content: `Hi! I'm Maya. How can I assist you today?`,
          sender: 'assistant',
          timestamp: Date.now()
        }
        setMessages([welcomeMessage])
      } catch (error) {
        console.error('Failed to fetch config:', error)
        const welcomeMessage: Message = {
          id: 'welcome',
          content: "Hi! I'm Maya. How can I assist you today?",
          sender: 'assistant',
          timestamp: Date.now()
        }
        setMessages([welcomeMessage])
      }
    }
    
    initializeWidget()
  }, [])

  const handleSendMessage = async (message: string) => {
    if (isProcessing) return
    
    console.log('Sending message:', message)
    setIsProcessing(true)
    setError(null)

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: Date.now()
    }
    setMessages(prev => [...prev, userMessage])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      console.log('Received response:', data)

      // Add assistant response to chat
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message || 'Sorry, I didn\'t receive a proper response.',
        sender: 'assistant',
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, assistantMessage])

      // Try to synthesize speech (optional)
      if (!isMuted && data.message) {
        await synthesizeSpeech(data.message)
      }

    } catch (error) {
      console.error('Failed to send message:', error)
      setError('Failed to send message. Please try again.')
      
      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'assistant',
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  const synthesizeSpeech = async (text: string) => {
    try {
      setIsSpeaking(true)
      console.log('Synthesizing speech for:', text.substring(0, 50) + '...')
      
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          text,
          voice: selectedVoice,
          format: 'mp3'
        })
      })

      if (!response.ok) {
        console.warn('TTS request failed:', response.status)
        return
      }

      const contentType = response.headers.get('content-type')
      console.log('TTS response content-type:', contentType)

      if (contentType?.includes('audio')) {
        const audioBlob = await response.blob()
        console.log('Received audio blob size:', audioBlob.size)
        
        if (audioBlob.size > 0) {
          const audioUrl = URL.createObjectURL(audioBlob)
          const audio = new Audio(audioUrl)
          
          audio.onloadeddata = () => {
            console.log('Audio loaded, duration:', audio.duration)
          }
          
          audio.onended = () => {
            setIsSpeaking(false)
            URL.revokeObjectURL(audioUrl)
            console.log('Audio playback ended')
          }
          
          audio.onerror = (e) => {
            console.error('Audio playback error:', e)
            setIsSpeaking(false)
            URL.revokeObjectURL(audioUrl)
          }
          
          try {
            await audio.play()
            console.log('Audio playback started')
          } catch (playError) {
            console.error('Audio play failed:', playError)
          }
        }
      } else {
        // Handle JSON response (TTS service unavailable)
        const data = await response.json()
        console.log('TTS service response:', data.message)
      }
    } catch (error) {
      console.warn('TTS synthesis failed:', error)
    } finally {
      if (!isSpeaking) {
        setIsSpeaking(false)
      }
    }
  }

  const handleVoiceTranscription = (text: string) => {
    handleSendMessage(text)
  }

  const handleStartListening = () => {
    setIsListening(true)
  }

  const handleStopListening = () => {
    setIsListening(false)
  }

  const handleToggleMute = () => {
    setIsMuted(!isMuted)
  }

  const handleClearConversation = () => {
    setMessages([{
      id: 'welcome-reset',
      content: "Conversation cleared! How can I help you with your travel plans?",
      sender: 'assistant',
      timestamp: Date.now()
    }])
    setError(null)
  }

  const handleVoiceChange = (voice: string) => {
    setSelectedVoice(voice)
  }

  const handleTestVoice = async () => {
    await synthesizeSpeech("Hello! This is a test of the selected voice.")
  }

  const toggleWidget = () => {
    setIsOpen(!isOpen)
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={toggleWidget}
          className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className={`bg-background border shadow-xl transition-all duration-300 flex flex-col ${
        isMinimized 
          ? 'w-80 h-16' 
          : 'w-[420px] h-[700px]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageCircle className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Maya Assistant</h3>
              {!isMinimized && (
                <p className="text-xs text-muted-foreground">
                  {isProcessing ? 'Thinking...' : 
                   isSpeaking ? 'Speaking...' : 
                   isListening ? 'Listening...' : 'Ready to help'}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMinimize}
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleWidget}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <>
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border-b border-red-200 p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Voice Controls */}
            <div className="border-b p-2">
              <VoiceControls
                isListening={isListening}
                isSpeaking={isSpeaking}
                onStartListening={handleStartListening}
                onStopListening={handleStopListening}
                onTranscriptionReceived={handleVoiceTranscription}
                onToggleMute={handleToggleMute}
                isMuted={isMuted}
              />
            </div>

            {/* Chat Interface */}
            <div className="flex-1 flex flex-col min-h-0">
              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                isProcessing={isProcessing}
              />
            </div>

            {/* Settings */}
            <div className="border-t p-1.5 flex justify-between items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearConversation}
                className="text-xs h-7 px-2"
              >
                Clear Chat
              </Button>
              <VoiceSelector
                selectedVoice={selectedVoice}
                onVoiceChange={handleVoiceChange}
                onTestVoice={handleTestVoice}
                isPlaying={isSpeaking}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  )
}