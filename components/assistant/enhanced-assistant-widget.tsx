"use client"

/**
 * Enhanced Assistant Widget
 * Integrates text chat and OpenAI Realtime voice modes in a unified interface
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, MessageCircle, Settings, Minimize2, Maximize2, Mic, MicOff, AlertCircle } from "lucide-react"
import { ChatInterface } from "./chat-interface"
import { VoiceControls } from "./voice-controls"
import { VoiceSelector } from "./voice-selector"
import { VoiceModeToggle } from "../voice/voice-mode-toggle"
import { RealtimeVoiceAgent } from "../voice/realtime-voice-agent"
import { VoiceSessionManager } from "@/lib/voice/session-manager"
import { useAuth } from "@/hooks/use-auth"
import { 
  AssistantMode, 
  UnifiedMessage, 
  AssistantState, 
  AssistantSettings,
  ModeTransition 
} from "@/types/assistant"
import {
  VoiceSessionEvent,
  ConversationMessage,
  SessionConfig
} from "@/types/voice"

export function EnhancedAssistantWidget() {
  const { user } = useAuth()
  const [state, setState] = useState<AssistantState>({
    mode: 'text',
    isOpen: false,
    isMinimized: false,
    messages: [],
    isProcessing: false,
    error: null,
    isMuted: false,
    selectedVoice: 'af_bella',
    voiceSessionId: null,
    connectionState: 'disconnected',
    isListening: false,
    isSpeaking: false,
    audioLevel: 0
  })

  const [settings, setSettings] = useState<AssistantSettings>({
    enableTTS: true,
    selectedTTSVoice: 'af_bella',
    microphoneVolume: 80,
    speakerVolume: 80,
    voiceActivation: true,
    pushToTalk: false,
    noiseSupression: true,
    echoCancellation: true,
    showTranscript: true,
    autoStartListening: true
  })

  const sessionManagerRef = useRef<VoiceSessionManager | null>(null)
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY

  /**
   * Initialize assistant widget
   */
  useEffect(() => {
    const initializeWidget = async () => {
      try {
        // Fetch provider info
        const response = await fetch('/api/config')
        const config = await response.json()
        
        // Add welcome message
        const welcomeMessage: UnifiedMessage = {
          id: 'welcome',
          content: `Hi! I'm Maya, your travel assistant. I can help you find and book flights. ${
            apiKey ? 'You can chat with me or switch to voice mode for hands-free interaction!' : 'Chat with me to get started!'
          }`,
          sender: 'assistant',
          timestamp: Date.now(),
          mode: 'text'
        }
        
        setState(prev => ({ 
          ...prev, 
          messages: [welcomeMessage] 
        }))
      } catch (error) {
        console.error('Failed to initialize assistant widget:', error)
        setState(prev => ({ 
          ...prev, 
          error: 'Failed to initialize assistant. Please refresh the page.' 
        }))
      }
    }
    
    initializeWidget()
  }, [apiKey])

  /**
   * Initialize voice session manager when switching to voice mode
   */
  useEffect(() => {
    if (state.mode === 'voice' && user && apiKey && !sessionManagerRef.current) {
      const initializeVoiceSession = async () => {
        try {
          const sessionManager = new VoiceSessionManager(
            apiKey,
            user.id,
            {
              microphoneVolume: settings.microphoneVolume,
              speakerVolume: settings.speakerVolume,
              voiceActivation: settings.voiceActivation,
              pushToTalk: settings.pushToTalk,
              noiseSupression: settings.noiseSupression,
              echoCancellation: settings.echoCancellation,
              showTranscript: settings.showTranscript,
              autoStartListening: settings.autoStartListening
            }
          )

          // Set up event handlers
          sessionManager.on('all', handleVoiceSessionEvent)

          // Initialize the session manager
          await sessionManager.initialize()
          
          sessionManagerRef.current = sessionManager
          console.log('[EnhancedAssistantWidget] Voice session manager initialized')
        } catch (error) {
          console.error('[EnhancedAssistantWidget] Failed to initialize voice session:', error)
          setState(prev => ({ 
            ...prev, 
            error: 'Failed to initialize voice mode. Switching back to text chat.',
            mode: 'text'
          }))
        }
      }

      initializeVoiceSession()
    }

    // Cleanup when switching away from voice mode
    return () => {
      if (state.mode !== 'voice' && sessionManagerRef.current) {
        sessionManagerRef.current.dispose()
        sessionManagerRef.current = null
      }
    }
  }, [state.mode, user, apiKey, settings])

  /**
   * Handle voice session events
   */
  const handleVoiceSessionEvent = useCallback((event: VoiceSessionEvent) => {
    setState(prev => {
      switch (event.type) {
        case 'CONNECT_SUCCESS':
          return {
            ...prev,
            voiceSessionId: event.sessionId,
            connectionState: 'connected',
            error: null
          }

        case 'CONNECT_ERROR':
        case 'ERROR':
          return {
            ...prev,
            connectionState: 'error',
            error: event.error.message
          }

        case 'DISCONNECT':
          return {
            ...prev,
            voiceSessionId: null,
            connectionState: 'disconnected',
            isListening: false,
            isSpeaking: false
          }

        case 'START_LISTENING':
          return { ...prev, isListening: true }

        case 'STOP_LISTENING':
          return { ...prev, isListening: false }

        case 'START_SPEAKING':
          return { ...prev, isSpeaking: true }

        case 'STOP_SPEAKING':
          return { ...prev, isSpeaking: false }

        case 'MESSAGE_RECEIVED':
          // Convert voice message to unified format
          const unifiedMessage: UnifiedMessage = {
            id: event.message.id,
            content: event.message.content,
            sender: event.message.type === 'user' ? 'user' : 'assistant',
            timestamp: event.message.timestamp.getTime(),
            mode: 'voice',
            audioUrl: event.message.audioUrl,
            agentName: event.message.agentName
          }
          
          return {
            ...prev,
            messages: [...prev.messages, unifiedMessage]
          }

        case 'AUDIO_LEVEL_UPDATE':
          return { ...prev, audioLevel: event.level }

        default:
          return prev
      }
    })
  }, [])

  /**
   * Handle mode switching
   */
  const handleModeSwitch = useCallback(async (newMode: AssistantMode) => {
    if (newMode === state.mode) return

    const transition: ModeTransition = {
      fromMode: state.mode,
      toMode: newMode,
      preserveHistory: true,
      reason: 'user_request'
    }

    setState(prev => ({ ...prev, mode: newMode, error: null }))

    // Add transition message
    const transitionMessage: UnifiedMessage = {
      id: `transition_${Date.now()}`,
      content: newMode === 'voice' 
        ? 'Switched to voice mode. You can now talk to me directly!' 
        : 'Switched to text mode. Type your message below.',
      sender: 'assistant',
      timestamp: Date.now(),
      mode: newMode
    }

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, transitionMessage]
    }))

    // Start voice session if switching to voice mode
    if (newMode === 'voice' && sessionManagerRef.current) {
      try {
        const config: SessionConfig = {
          model: 'gpt-4o-realtime-preview',
          voice: 'alloy',
          instructions: `You are Maya, SkyBooker's friendly travel assistant. Help users find and book flights through natural conversation.
          
          You are professional yet warm, and always confirm important details like dates, names, and flight information by repeating them back to the user.
          
          Current conversation context:
          - User has been chatting with you in text mode
          - Previous conversation history is available
          - Continue the conversation naturally in voice mode
          
          Always be proactive in suggesting alternatives and improvements to their travel plans.`,
          tools: [], // We'll add flight booking tools in the next phase
          temperature: 0.7,
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500
          }
        }

        await sessionManagerRef.current.startSession(config)
      } catch (error) {
        console.error('Failed to start voice session:', error)
        setState(prev => ({
          ...prev,
          error: 'Failed to start voice session. Please try again.',
          mode: 'text'
        }))
      }
    }
  }, [state.mode])

  /**
   * Handle text message sending
   */
  const handleSendTextMessage = async (message: string) => {
    if (state.isProcessing) return
    
    setState(prev => ({ ...prev, isProcessing: true, error: null }))

    // Add user message
    const userMessage: UnifiedMessage = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: Date.now(),
      mode: 'text'
    }
    
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage]
    }))

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      // Add assistant response
      const assistantMessage: UnifiedMessage = {
        id: (Date.now() + 1).toString(),
        content: data.message || 'Sorry, I didn\'t receive a proper response.',
        sender: 'assistant',
        timestamp: Date.now(),
        mode: 'text'
      }
      
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage]
      }))

      // Synthesize speech if enabled and not muted
      if (settings.enableTTS && !state.isMuted && data.message) {
        await synthesizeSpeech(data.message)
      }

    } catch (error) {
      console.error('Failed to send message:', error)
      setState(prev => ({
        ...prev,
        error: 'Failed to send message. Please try again.'
      }))
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }))
    }
  }

  /**
   * Synthesize speech for text responses
   */
  const synthesizeSpeech = async (text: string) => {
    try {
      setState(prev => ({ ...prev, isSpeaking: true }))
      
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text,
          voice: settings.selectedTTSVoice,
          format: 'mp3'
        })
      })

      if (response.ok && response.headers.get('content-type')?.includes('audio')) {
        const audioBlob = await response.blob()
        if (audioBlob.size > 0) {
          const audioUrl = URL.createObjectURL(audioBlob)
          const audio = new Audio(audioUrl)
          
          audio.onended = () => {
            setState(prev => ({ ...prev, isSpeaking: false }))
            URL.revokeObjectURL(audioUrl)
          }
          
          audio.onerror = () => {
            setState(prev => ({ ...prev, isSpeaking: false }))
            URL.revokeObjectURL(audioUrl)
          }
          
          await audio.play()
        }
      }
    } catch (error) {
      console.warn('TTS synthesis failed:', error)
    } finally {
      setState(prev => ({ ...prev, isSpeaking: false }))
    }
  }

  /**
   * Handle voice controls (for text mode speech recognition)
   */
  const handleVoiceTranscription = (text: string) => {
    handleSendTextMessage(text)
  }

  const handleStartListening = () => {
    setState(prev => ({ ...prev, isListening: true }))
  }

  const handleStopListening = () => {
    setState(prev => ({ ...prev, isListening: false }))
  }

  const handleToggleMute = () => {
    setState(prev => ({ ...prev, isMuted: !prev.isMuted }))
  }

  /**
   * Utility functions
   */
  const handleClearConversation = () => {
    setState(prev => ({
      ...prev,
      messages: [{
        id: 'welcome-reset',
        content: "Conversation cleared! How can I help you with your travel plans?",
        sender: 'assistant',
        timestamp: Date.now(),
        mode: prev.mode
      }],
      error: null
    }))
  }

  const handleVoiceChange = (voice: string) => {
    setSettings(prev => ({ ...prev, selectedTTSVoice: voice }))
    setState(prev => ({ ...prev, selectedVoice: voice }))
  }

  const handleTestVoice = async () => {
    await synthesizeSpeech("Hello! This is a test of the selected voice.")
  }

  const toggleWidget = () => {
    setState(prev => ({ ...prev, isOpen: !prev.isOpen }))
  }

  const toggleMinimize = () => {
    setState(prev => ({ ...prev, isMinimized: !prev.isMinimized }))
  }

  /**
   * Get status display
   */
  const getStatusText = () => {
    if (state.mode === 'voice') {
      if (state.connectionState === 'connected') {
        return state.isListening ? 'Listening...' : 
               state.isSpeaking ? 'Speaking...' : 'Voice Ready'
      }
      return state.connectionState === 'connecting' ? 'Connecting...' : 'Voice Disconnected'
    }
    
    return state.isProcessing ? 'Thinking...' : 
           state.isSpeaking ? 'Speaking...' : 
           state.isListening ? 'Listening...' : 'Ready to help'
  }

  const getConnectionIndicator = () => {
    if (state.mode === 'voice') {
      switch (state.connectionState) {
        case 'connected': return 'bg-green-500'
        case 'connecting': return 'bg-yellow-500'
        case 'error': return 'bg-red-500'
        default: return 'bg-gray-500'
      }
    }
    return 'bg-blue-500'
  }

  // Floating button when closed
  if (!state.isOpen) {
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
        state.isMinimized 
          ? 'w-80 h-16' 
          : 'w-[420px] h-[700px]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              {state.mode === 'voice' ? (
                <Mic className="w-3.5 h-3.5 text-primary" />
              ) : (
                <MessageCircle className="w-3.5 h-3.5 text-primary" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-sm">Maya Assistant</h3>
              {!state.isMinimized && (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    {getStatusText()}
                  </p>
                  <div className={`w-2 h-2 rounded-full ${getConnectionIndicator()}`} />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {!state.isMinimized && apiKey && (
              <VoiceModeToggle
                isVoiceMode={state.mode === 'voice'}
                onToggle={(isVoice) => handleModeSwitch(isVoice ? 'voice' : 'text')}
                disabled={state.isProcessing}
                className="mr-2"
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMinimize}
            >
              {state.isMinimized ? (
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
        {!state.isMinimized && (
          <>
            {/* Error Display */}
            {state.error && (
              <div className="bg-red-50 border-b border-red-200 p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-600">{state.error}</p>
                </div>
                {state.mode === 'voice' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleModeSwitch('text')}
                    className="mt-2 text-xs h-7"
                  >
                    Switch to Text Mode
                  </Button>
                )}
              </div>
            )}

            {/* Mode-specific Content */}
            {state.mode === 'text' ? (
              <>
                {/* Text Mode: Voice Controls */}
                <div className="border-b p-2">
                  <VoiceControls
                    isListening={state.isListening}
                    isSpeaking={state.isSpeaking}
                    onStartListening={handleStartListening}
                    onStopListening={handleStopListening}
                    onTranscriptionReceived={handleVoiceTranscription}
                    onToggleMute={handleToggleMute}
                    isMuted={state.isMuted}
                  />
                </div>

                {/* Chat Interface */}
                <div className="flex-1 flex flex-col min-h-0">
                  <ChatInterface
                    messages={state.messages.map(msg => ({
                      id: msg.id,
                      content: msg.content,
                      sender: msg.sender,
                      timestamp: msg.timestamp,
                      isStreaming: msg.isStreaming
                    }))}
                    onSendMessage={handleSendTextMessage}
                    isProcessing={state.isProcessing}
                  />
                </div>

                {/* Text Mode Settings */}
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
                    selectedVoice={settings.selectedTTSVoice}
                    onVoiceChange={handleVoiceChange}
                    onTestVoice={handleTestVoice}
                    isPlaying={state.isSpeaking}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Voice Mode: Realtime Voice Agent */}
                <div className="flex-1 flex flex-col min-h-0 p-4">
                  <RealtimeVoiceAgent 
                    className="h-full border-0 shadow-none"
                    onClose={() => handleModeSwitch('text')}
                  />
                </div>
              </>
            )}
          </>
        )}
      </Card>
    </div>
  )
}