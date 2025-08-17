"use client"

/**
 * Realtime Voice Agent Component
 * Main component for SkyBooker's voice-first travel booking interface
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, MicOff, Phone, PhoneOff, Settings, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { VoiceSessionManager } from '@/lib/voice/session-manager'
import { 
  VoiceSessionState, 
  VoiceSettings, 
  SessionConfig, 
  VoiceSessionEvent,
  ConversationMessage 
} from '@/types/voice'
import { useAuth } from '@/hooks/use-auth'

interface RealtimeVoiceAgentProps {
  className?: string
  onClose?: () => void
  initialSettings?: Partial<VoiceSettings>
}

export function RealtimeVoiceAgent({ 
  className = '',
  onClose,
  initialSettings 
}: RealtimeVoiceAgentProps) {
  const { user } = useAuth()
  const [sessionState, setSessionState] = useState<VoiceSessionState>({
    sessionId: null,
    connectionState: 'disconnected',
    isListening: false,
    isSpeaking: false,
    currentAgent: null,
    conversationHistory: [],
    audioLevel: 0
  })
  
  const [showTranscript, setShowTranscript] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const sessionManagerRef = useRef<VoiceSessionManager | null>(null)

  // Get OpenAI API key from environment
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY

  /**
   * Initialize session manager
   */
  useEffect(() => {
    if (!user || !apiKey) return

    const initializeSession = async () => {
      try {
        const sessionManager = new VoiceSessionManager(
          apiKey,
          user.id,
          initialSettings
        )

        // Set up event handlers
        sessionManager.on('all', handleSessionEvent)

        // Initialize the session manager
        await sessionManager.initialize()
        
        sessionManagerRef.current = sessionManager
        console.log('[RealtimeVoiceAgent] Session manager initialized')
      } catch (error) {
        console.error('[RealtimeVoiceAgent] Failed to initialize session manager:', error)
        setError('Failed to initialize voice system. Please check your microphone permissions.')
      }
    }

    initializeSession()

    // Cleanup on unmount
    return () => {
      if (sessionManagerRef.current) {
        sessionManagerRef.current.dispose()
        sessionManagerRef.current = null
      }
    }
  }, [user, apiKey, initialSettings])

  /**
   * Handle session events from the voice session manager
   */
  const handleSessionEvent = useCallback((event: VoiceSessionEvent) => {
    switch (event.type) {
      case 'CONNECT_SUCCESS':
        setSessionState(prev => ({
          ...prev,
          sessionId: event.sessionId,
          connectionState: 'connected'
        }))
        setError(null)
        break

      case 'CONNECT_ERROR':
      case 'ERROR':
        setError(event.error.message)
        setSessionState(prev => ({
          ...prev,
          connectionState: 'error'
        }))
        break

      case 'DISCONNECT':
        setSessionState(prev => ({
          ...prev,
          sessionId: null,
          connectionState: 'disconnected',
          isListening: false,
          isSpeaking: false
        }))
        break

      case 'START_LISTENING':
        setSessionState(prev => ({ ...prev, isListening: true }))
        break

      case 'STOP_LISTENING':
        setSessionState(prev => ({ ...prev, isListening: false }))
        break

      case 'START_SPEAKING':
        setSessionState(prev => ({ ...prev, isSpeaking: true }))
        break

      case 'STOP_SPEAKING':
        setSessionState(prev => ({ ...prev, isSpeaking: false }))
        break

      case 'MESSAGE_RECEIVED':
        setSessionState(prev => ({
          ...prev,
          conversationHistory: [...prev.conversationHistory, event.message]
        }))
        break

      case 'AUDIO_LEVEL_UPDATE':
        setSessionState(prev => ({ ...prev, audioLevel: event.level }))
        break

      default:
        break
    }
  }, [])

  /**
   * Start a voice session
   */
  const startSession = async () => {
    if (!sessionManagerRef.current) return

    try {
      setError(null)
      
      const config: SessionConfig = {
        model: 'gpt-4o-realtime-preview',
        voice: 'alloy',
        instructions: `You are Maya, SkyBooker's friendly travel assistant. Help users find and book flights through natural conversation.
        
        You are professional yet warm, and always confirm important details like dates, names, and flight information by repeating them back to the user.
        
        Current conversation flow:
        1. Greet the user warmly and ask how you can help with their travel plans
        2. Gather travel details (origin, destination, dates, passengers)
        3. Search for flights and present options
        4. Help with booking and passenger information
        5. Assist with payment and confirmation
        
        Always be proactive in suggesting alternatives and improvements to their travel plans.`,
        tools: [], // We'll add tools in the next phase
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
      console.error('[RealtimeVoiceAgent] Failed to start session:', error)
      setError('Failed to start voice session. Please try again.')
    }
  }

  /**
   * End the current voice session
   */
  const endSession = async () => {
    if (!sessionManagerRef.current) return

    try {
      await sessionManagerRef.current.endSession()
    } catch (error) {
      console.error('[RealtimeVoiceAgent] Failed to end session:', error)
    }
  }

  /**
   * Toggle listening state
   */
  const toggleListening = async () => {
    if (!sessionManagerRef.current) return

    try {
      if (sessionState.isListening) {
        sessionManagerRef.current.stopListening()
      } else {
        await sessionManagerRef.current.startListening()
      }
    } catch (error) {
      console.error('[RealtimeVoiceAgent] Failed to toggle listening:', error)
      setError('Failed to toggle microphone. Please check your permissions.')
    }
  }

  /**
   * Get connection status display
   */
  const getConnectionStatus = () => {
    switch (sessionState.connectionState) {
      case 'connected':
        return { text: 'Connected', color: 'bg-green-500' }
      case 'connecting':
        return { text: 'Connecting...', color: 'bg-yellow-500' }
      case 'error':
        return { text: 'Error', color: 'bg-red-500' }
      default:
        return { text: 'Disconnected', color: 'bg-gray-500' }
    }
  }

  const connectionStatus = getConnectionStatus()

  if (!user) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please sign in to use the voice assistant.</p>
        </CardContent>
      </Card>
    )
  }

  if (!apiKey) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Voice assistant is not configured. Please check your API settings.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`${className} w-full max-w-2xl mx-auto`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Maya - Voice Assistant</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${connectionStatus.color}`} />
              {connectionStatus.text}
            </Badge>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Audio Level Indicator */}
        {sessionState.isListening && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Microphone Level</span>
              <span className="text-muted-foreground">{Math.round(sessionState.audioLevel)}%</span>
            </div>
            <Progress value={sessionState.audioLevel} className="h-2" />
          </div>
        )}

        {/* Session Controls */}
        <div className="flex items-center justify-center gap-4">
          {sessionState.connectionState === 'disconnected' ? (
            <Button 
              onClick={startSession}
              className="flex items-center gap-2"
              size="lg"
            >
              <Phone className="h-5 w-5" />
              Start Voice Session
            </Button>
          ) : (
            <>
              <Button
                onClick={toggleListening}
                variant={sessionState.isListening ? "default" : "outline"}
                size="lg"
                className="flex items-center gap-2"
                disabled={sessionState.connectionState !== 'connected'}
              >
                {sessionState.isListening ? (
                  <>
                    <Mic className="h-5 w-5" />
                    Listening...
                  </>
                ) : (
                  <>
                    <MicOff className="h-5 w-5" />
                    Click to Talk
                  </>
                )}
              </Button>

              <Button
                onClick={endSession}
                variant="destructive"
                size="lg"
                className="flex items-center gap-2"
              >
                <PhoneOff className="h-5 w-5" />
                End Session
              </Button>
            </>
          )}
        </div>

        {/* Speaking Indicator */}
        {sessionState.isSpeaking && (
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <div className="animate-pulse">
              <MessageSquare className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium">Maya is speaking...</span>
          </div>
        )}

        {/* Conversation History */}
        {showTranscript && sessionState.conversationHistory.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Conversation</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTranscript(!showTranscript)}
                className="text-xs"
              >
                Hide Transcript
              </Button>
            </div>
            
            <div className="max-h-60 overflow-y-auto space-y-2 p-3 bg-muted/30 rounded-md">
              {sessionState.conversationHistory.map((message) => (
                <div
                  key={message.id}
                  className={`text-sm p-2 rounded ${
                    message.type === 'user'
                      ? 'bg-blue-100 text-blue-900 ml-8'
                      : 'bg-gray-100 text-gray-900 mr-8'
                  }`}
                >
                  <div className="font-medium text-xs mb-1">
                    {message.type === 'user' ? 'You' : message.agentName || 'Maya'}
                  </div>
                  <div>{message.content}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Session Info */}
        {sessionState.sessionId && (
          <div className="text-xs text-muted-foreground text-center">
            Session: {sessionState.sessionId}
          </div>
        )}
      </CardContent>
    </Card>
  )
}