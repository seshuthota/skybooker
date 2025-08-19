"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, MessageCircle, Minimize2, Maximize2, Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react"
import { ChatInterface } from "./chat-interface"
import { useRealtimeSession } from "@/app/hooks/useRealtimeSession"

interface Message {
  id: string
  content: string
  sender: 'user' | 'assistant'
  timestamp: number
}

export function AssistantWidget() {
  console.log('[AssistantWidget] Component mounting...')
  
  const [isOpen, setIsOpen] = useState(process.env.NEXT_PUBLIC_E2E_OPEN === '1')
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentProvider, setCurrentProvider] = useState('')
  
  // Unified voice session state
  const {
    status: voiceStatus,
    listening,
    muted,
    error: voiceError,
    transcript,
    audioLevel,
    connect: connectVoice,
    disconnect: disconnectVoice,
    toggleListening,
    toggleMute,
    sendText,
  } = useRealtimeSession()

  // Append realtime transcript into the same chat list
  const lastTranscriptCount = useRef(0)
  useEffect(() => {
    if (transcript.length > lastTranscriptCount.current) {
      const newItems = transcript.slice(lastTranscriptCount.current)
      lastTranscriptCount.current = transcript.length
      setMessages(prev => ([
        ...prev,
        ...newItems.map(t => ({
          id: `${t.timestamp}-${Math.random().toString(36).slice(2,7)}`,
          content: t.content,
          sender: t.role,
          timestamp: t.timestamp,
        }))
      ]))
    }
  }, [transcript])

  useEffect(() => {
    console.log('[AssistantWidget] Initializing widget...')
    
    // Fetch provider info and add welcome message
    const initializeWidget = async () => {
      try {
        console.log('[AssistantWidget] Fetching config...')
        const response = await fetch('/api/config')
        
        if (!response.ok) {
          throw new Error(`Config API failed: ${response.status}`)
        }
        
        const config = await response.json()
        console.log('[AssistantWidget] Config received:', config)
        setCurrentProvider(config.provider?.name || 'Unknown')
        
        const welcomeMessage: Message = {
          id: 'welcome',
          content: `Hi! I'm Maya. How can I assist you today?`,
          sender: 'assistant',
          timestamp: Date.now()
        }
        setMessages([welcomeMessage])
        console.log('[AssistantWidget] Welcome message added')
      } catch (error) {
        console.error('[AssistantWidget] Failed to fetch config:', error)
        setCurrentProvider('OpenAI')
        
        const welcomeMessage: Message = {
          id: 'welcome',
          content: "Hi! I'm Maya. How can I assist you today?",
          sender: 'assistant',
          timestamp: Date.now()
        }
        setMessages([welcomeMessage])
        console.log('[AssistantWidget] Fallback welcome message added')
      }
    }
    
    initializeWidget()
  }, [])

  const handleSendMessage = async (message: string) => {
    if (isProcessing) return
    setIsProcessing(true)
    setError(null)
    try {
      await Promise.resolve(sendText(message))
    } catch (e) {
      console.error('Failed to send text via realtime:', e)
      setError('Failed to send message. Please try again.')
    } finally {
      setIsProcessing(false)
    }
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

  const toggleWidget = () => {
    console.log('[AssistantWidget] Toggling widget, current state:', isOpen)
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
          data-testid="assistant-open"
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
        <div className="flex flex-col gap-2 p-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageCircle className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Maya Assistant</h3>
                {!isMinimized && (
                  <p className="text-xs text-muted-foreground">
                    {isProcessing ? 'Thinking…' : 'Type or speak — one thread'}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={toggleMinimize}>
                {isMinimized ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Minimize2 className="w-4 h-4" />
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleWidget}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Unified Voice Controls */}
          {!isMinimized && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {voiceStatus === 'connected' || voiceStatus === 'ready' ? (
                  <Button size="sm" variant="destructive" onClick={disconnectVoice}>
                    <PhoneOff className="w-4 h-4 mr-2" /> Disconnect
                  </Button>
                ) : (
                  <Button size="sm" onClick={connectVoice}>
                    <Phone className="w-4 h-4 mr-2" /> Connect Voice
                  </Button>
                )}

                <Button
                  size="sm"
                  variant={muted ? 'destructive' : 'outline'}
                  onClick={toggleMute}
                  disabled={!(voiceStatus === 'connected' || voiceStatus === 'ready')}
                >
                  {muted ? <VolumeX className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />} 
                  {muted ? 'Muted' : 'Mute'}
                </Button>

                <Button
                  size="sm"
                  onClick={toggleListening}
                  disabled={!(voiceStatus === 'connected' || voiceStatus === 'ready')}
                >
                  {listening ? (<><MicOff className="w-4 h-4 mr-2" /> Stop Listening</>) : (<><Mic className="w-4 h-4 mr-2" /> Start Listening</>)}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-end gap-0.5 h-5">
                  {Array.from({ length: 8 }).map((_, i) => {
                    const active = i < Math.round(Math.max(0, Math.min(1, audioLevel)) * 8)
                    const height = 2 + i * 1.6
                    return (
                      <div key={i} className="w-1.5 rounded-sm" style={{ height: `${height}px`, backgroundColor: active && listening ? '#2563eb' : '#e5e7eb', opacity: active ? 1 : 0.5 }} />
                    )
                  })}
                </div>
                <Badge variant={voiceStatus === 'ready' ? 'default' : voiceStatus === 'connected' ? 'secondary' : voiceStatus === 'error' ? 'destructive' : 'outline'}>
                  {voiceStatus === 'ready' ? 'Voice: Ready' : voiceStatus.charAt(0).toUpperCase() + voiceStatus.slice(1)}
                </Badge>
              </div>
            </div>
          )}
          {voiceError && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">{voiceError}</div>
          )}
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

            {/* Unified Chat + Transcript */}
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
              <div className="text-xs text-muted-foreground px-2">Type or speak — one thread</div>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
