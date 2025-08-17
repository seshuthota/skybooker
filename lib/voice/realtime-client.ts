/**
 * Realtime Client for OpenAI Realtime API
 * Handles WebSocket connection and communication with OpenAI's speech-to-speech model
 */

import { RealtimeAgent } from '@openai/agents/realtime'
import { 
  VoiceSessionState, 
  SessionConfig, 
  RealtimeEvent, 
  ConversationMessage,
  VoiceError,
  ToolCall,
  VoiceSessionEvent
} from '@/types/voice'

export class RealtimeClient {
  private agent: RealtimeAgent | null = null
  private sessionId: string | null = null
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected'
  private conversationHistory: ConversationMessage[] = []
  private eventHandlers: Map<string, (event: VoiceSessionEvent) => void> = new Map()
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey
    this.baseUrl = baseUrl || 'wss://api.openai.com/v1/realtime'
  }

  /**
   * Connect to OpenAI Realtime API with given session configuration
   */
  async connect(config: SessionConfig): Promise<void> {
    try {
      this.connectionState = 'connecting'
      this.emit({ type: 'CONNECT_START' })

      // Create RealtimeAgent with configuration
      this.agent = new RealtimeAgent({
        name: 'Maya Travel Assistant',
        instructions: config.instructions,
        voice: config.voice,
        tools: config.tools || [],
        apiKey: this.apiKey
      })

      // Set up event listeners
      this.setupEventListeners()

      // Connect to the realtime API
      await this.agent.connect()

      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`
      this.connectionState = 'connected'
      
      console.log('[RealtimeClient] Connected successfully', { sessionId: this.sessionId })
      this.emit({ type: 'CONNECT_SUCCESS', sessionId: this.sessionId })

    } catch (error) {
      this.connectionState = 'error'
      const voiceError: VoiceError = {
        code: 'CONNECTION_FAILED',
        message: 'Failed to connect to OpenAI Realtime API',
        details: error,
        timestamp: new Date(),
        recoverable: true
      }
      
      console.error('[RealtimeClient] Connection failed:', error)
      this.emit({ type: 'CONNECT_ERROR', error: voiceError })
      throw error
    }
  }

  /**
   * Set up event listeners for the realtime agent
   */
  private setupEventListeners(): void {
    if (!this.agent) return

    // Handle incoming messages from the agent
    this.agent.on('message', (message: any) => {
      const conversationMessage: ConversationMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        timestamp: new Date(),
        type: 'assistant',
        content: message.content || '',
        agentName: this.agent?.name || 'Assistant'
      }

      this.conversationHistory.push(conversationMessage)
      this.emit({ type: 'MESSAGE_RECEIVED', message: conversationMessage })
    })

    // Handle tool calls
    this.agent.on('tool_call', (toolCall: any) => {
      const tool: ToolCall = {
        id: toolCall.id || `tool_${Date.now()}`,
        name: toolCall.function?.name || 'unknown',
        parameters: toolCall.function?.arguments || {},
        timestamp: new Date()
      }

      this.emit({ type: 'TOOL_CALL', toolCall: tool })
    })

    // Handle errors
    this.agent.on('error', (error: any) => {
      const voiceError: VoiceError = {
        code: 'AGENT_ERROR',
        message: error.message || 'Unknown agent error',
        details: error,
        timestamp: new Date(),
        recoverable: true
      }

      console.error('[RealtimeClient] Agent error:', error)
      this.emit({ type: 'ERROR', error: voiceError })
    })

    // Handle connection state changes
    this.agent.on('disconnect', () => {
      this.connectionState = 'disconnected'
      this.sessionId = null
      console.log('[RealtimeClient] Disconnected')
      this.emit({ type: 'DISCONNECT' })
    })
  }

  /**
   * Send audio data to the realtime API
   */
  async sendAudio(audioData: ArrayBuffer): Promise<void> {
    if (!this.agent || this.connectionState !== 'connected') {
      throw new Error('Not connected to realtime API')
    }

    try {
      // Convert ArrayBuffer to the format expected by the agent
      const audioBase64 = this.arrayBufferToBase64(audioData)
      
      await this.agent.sendAudio(audioBase64)
    } catch (error) {
      const voiceError: VoiceError = {
        code: 'AUDIO_SEND_FAILED',
        message: 'Failed to send audio data',
        details: error,
        timestamp: new Date(),
        recoverable: true
      }
      
      console.error('[RealtimeClient] Failed to send audio:', error)
      this.emit({ type: 'ERROR', error: voiceError })
      throw error
    }
  }

  /**
   * Send a text message to the agent
   */
  async sendMessage(message: string): Promise<void> {
    if (!this.agent || this.connectionState !== 'connected') {
      throw new Error('Not connected to realtime API')
    }

    try {
      // Add user message to conversation history
      const conversationMessage: ConversationMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        timestamp: new Date(),
        type: 'user',
        content: message
      }

      this.conversationHistory.push(conversationMessage)
      this.emit({ type: 'MESSAGE_RECEIVED', message: conversationMessage })

      // Send message to agent
      await this.agent.sendMessage(message)
    } catch (error) {
      const voiceError: VoiceError = {
        code: 'MESSAGE_SEND_FAILED',
        message: 'Failed to send text message',
        details: error,
        timestamp: new Date(),
        recoverable: true
      }
      
      console.error('[RealtimeClient] Failed to send message:', error)
      this.emit({ type: 'ERROR', error: voiceError })
      throw error
    }
  }

  /**
   * Update session configuration
   */
  async updateSession(config: Partial<SessionConfig>): Promise<void> {
    if (!this.agent || this.connectionState !== 'connected') {
      throw new Error('Not connected to realtime API')
    }

    try {
      // Update agent configuration
      if (config.instructions) {
        await this.agent.updateInstructions(config.instructions)
      }
      
      if (config.tools) {
        await this.agent.updateTools(config.tools)
      }

      console.log('[RealtimeClient] Session updated successfully')
    } catch (error) {
      console.error('[RealtimeClient] Failed to update session:', error)
      throw error
    }
  }

  /**
   * Disconnect from the realtime API
   */
  async disconnect(): Promise<void> {
    if (this.agent) {
      try {
        await this.agent.disconnect()
      } catch (error) {
        console.error('[RealtimeClient] Error during disconnect:', error)
      }
      this.agent = null
    }

    this.connectionState = 'disconnected'
    this.sessionId = null
    console.log('[RealtimeClient] Disconnected')
  }

  /**
   * Get current session state
   */
  getState(): VoiceSessionState {
    return {
      sessionId: this.sessionId,
      connectionState: this.connectionState,
      isListening: false, // This will be managed by the session manager
      isSpeaking: false,  // This will be managed by the session manager
      currentAgent: this.agent?.name || null,
      conversationHistory: this.conversationHistory,
      audioLevel: 0 // This will be managed by the audio manager
    }
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = []
  }

  /**
   * Register event handler
   */
  on(eventType: string, handler: (event: VoiceSessionEvent) => void): void {
    this.eventHandlers.set(eventType, handler)
  }

  /**
   * Unregister event handler
   */
  off(eventType: string): void {
    this.eventHandlers.delete(eventType)
  }

  /**
   * Emit event to registered handlers
   */
  private emit(event: VoiceSessionEvent): void {
    const handler = this.eventHandlers.get(event.type)
    if (handler) {
      handler(event)
    }

    // Also emit to 'all' handler if exists
    const allHandler = this.eventHandlers.get('all')
    if (allHandler) {
      allHandler(event)
    }
  }

  /**
   * Convert ArrayBuffer to Base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    bytes.forEach(byte => binary += String.fromCharCode(byte))
    return btoa(binary)
  }

  /**
   * Check if client is connected
   */
  isConnected(): boolean {
    return this.connectionState === 'connected' && this.agent !== null
  }

  /**
   * Get connection state
   */
  getConnectionState(): string {
    return this.connectionState
  }
}