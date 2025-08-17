/**
 * Voice Session Manager
 * Orchestrates audio capture, realtime API communication, and session state
 */

import { AudioManager } from './audio-manager'
import { RealtimeClient } from './realtime-client'
import { 
  VoiceSessionState, 
  VoiceSettings, 
  SessionConfig, 
  VoiceError,
  ConversationContext,
  VoiceSessionEvent,
  ConversationMessage
} from '@/types/voice'

export class VoiceSessionManager {
  private audioManager: AudioManager
  private realtimeClient: RealtimeClient
  private sessionState: VoiceSessionState
  private voiceSettings: VoiceSettings
  private conversationContext: ConversationContext
  private eventHandlers: Map<string, (event: VoiceSessionEvent) => void> = new Map()
  private isInitialized: boolean = false

  constructor(
    apiKey: string,
    userId: string,
    initialSettings?: Partial<VoiceSettings>
  ) {
    // Initialize voice settings with defaults
    this.voiceSettings = {
      microphoneVolume: 80,
      speakerVolume: 80,
      voiceActivation: true,
      pushToTalk: false,
      noiseSupression: true,
      echoCancellation: true,
      showTranscript: true,
      autoStartListening: true,
      ...initialSettings
    }

    // Initialize conversation context
    this.conversationContext = {
      userId,
      sessionId: '',
      currentIntent: 'greeting'
    }

    // Initialize session state
    this.sessionState = {
      sessionId: null,
      connectionState: 'disconnected',
      isListening: false,
      isSpeaking: false,
      currentAgent: null,
      conversationHistory: [],
      audioLevel: 0
    }

    // Initialize audio manager
    this.audioManager = new AudioManager(
      this.voiceSettings,
      this.handleAudioLevelUpdate.bind(this),
      this.handleError.bind(this)
    )

    // Initialize realtime client
    this.realtimeClient = new RealtimeClient(apiKey)
    this.setupRealtimeEventHandlers()
  }

  /**
   * Initialize the voice session manager
   */
  async initialize(): Promise<void> {
    try {
      // Check if audio is supported
      if (!AudioManager.isSupported()) {
        throw new Error('Audio not supported in this browser')
      }

      // Initialize audio manager
      await this.audioManager.initialize()
      
      this.isInitialized = true
      console.log('[SessionManager] Initialized successfully')
    } catch (error) {
      const voiceError: VoiceError = {
        code: 'INITIALIZATION_FAILED',
        message: 'Failed to initialize voice session',
        details: error,
        timestamp: new Date(),
        recoverable: false
      }
      this.handleError(voiceError)
      throw error
    }
  }

  /**
   * Start a voice session with the given configuration
   */
  async startSession(config: SessionConfig): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize()
      }

      // Connect to realtime API
      await this.realtimeClient.connect(config)
      
      // Start audio capture if auto-start is enabled
      if (this.voiceSettings.autoStartListening) {
        await this.startListening()
      }

      // Update session state
      const clientState = this.realtimeClient.getState()
      this.sessionState.sessionId = clientState.sessionId
      this.sessionState.connectionState = clientState.connectionState
      this.conversationContext.sessionId = clientState.sessionId || ''

      console.log('[SessionManager] Session started successfully')
    } catch (error) {
      const voiceError: VoiceError = {
        code: 'SESSION_START_FAILED',
        message: 'Failed to start voice session',
        details: error,
        timestamp: new Date(),
        recoverable: true
      }
      this.handleError(voiceError)
      throw error
    }
  }

  /**
   * Start listening for user audio input
   */
  async startListening(): Promise<void> {
    try {
      if (this.sessionState.isListening) {
        return
      }

      // Start audio capture
      const audioStream = await this.audioManager.startCapture()
      
      // Set up audio data streaming to realtime API
      this.setupAudioStreaming(audioStream)
      
      this.sessionState.isListening = true
      this.emit({ type: 'START_LISTENING' })
      
      console.log('[SessionManager] Started listening')
    } catch (error) {
      const voiceError: VoiceError = {
        code: 'LISTENING_START_FAILED',
        message: 'Failed to start listening',
        details: error,
        timestamp: new Date(),
        recoverable: true
      }
      this.handleError(voiceError)
      throw error
    }
  }

  /**
   * Stop listening for user audio input
   */
  stopListening(): void {
    if (!this.sessionState.isListening) {
      return
    }

    this.audioManager.stopCapture()
    this.sessionState.isListening = false
    this.emit({ type: 'STOP_LISTENING' })
    
    console.log('[SessionManager] Stopped listening')
  }

  /**
   * Send a text message to the agent
   */
  async sendMessage(message: string): Promise<void> {
    try {
      await this.realtimeClient.sendMessage(message)
    } catch (error) {
      const voiceError: VoiceError = {
        code: 'MESSAGE_SEND_FAILED',
        message: 'Failed to send message',
        details: error,
        timestamp: new Date(),
        recoverable: true
      }
      this.handleError(voiceError)
      throw error
    }
  }

  /**
   * End the current voice session
   */
  async endSession(): Promise<void> {
    try {
      // Stop listening
      this.stopListening()
      
      // Disconnect from realtime API
      await this.realtimeClient.disconnect()
      
      // Reset session state
      this.sessionState = {
        sessionId: null,
        connectionState: 'disconnected',
        isListening: false,
        isSpeaking: false,
        currentAgent: null,
        conversationHistory: [],
        audioLevel: 0
      }

      console.log('[SessionManager] Session ended')
    } catch (error) {
      console.error('[SessionManager] Error ending session:', error)
    }
  }

  /**
   * Update voice settings
   */
  updateSettings(newSettings: Partial<VoiceSettings>): void {
    this.voiceSettings = { ...this.voiceSettings, ...newSettings }
    this.audioManager.updateSettings(this.voiceSettings)
  }

  /**
   * Update conversation context
   */
  updateContext(context: Partial<ConversationContext>): void {
    this.conversationContext = { ...this.conversationContext, ...context }
  }

  /**
   * Get current session state
   */
  getState(): VoiceSessionState {
    const clientState = this.realtimeClient.getState()
    const audioState = this.audioManager.getState()

    return {
      ...this.sessionState,
      connectionState: clientState.connectionState,
      conversationHistory: clientState.conversationHistory,
      audioLevel: audioState.audioLevel
    }
  }

  /**
   * Get conversation context
   */
  getContext(): ConversationContext {
    return this.conversationContext
  }

  /**
   * Set up audio streaming to the realtime API
   */
  private setupAudioStreaming(audioStream: MediaStream): void {
    // This would typically involve setting up a MediaRecorder or similar
    // to capture audio chunks and send them to the realtime API
    // For now, we'll set up a basic implementation
    
    try {
      const mediaRecorder = new MediaRecorder(audioStream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      const audioChunks: BlobPart[] = []

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
          
          // Convert blob to ArrayBuffer and send to realtime API
          const arrayBuffer = await event.data.arrayBuffer()
          try {
            await this.realtimeClient.sendAudio(arrayBuffer)
          } catch (error) {
            console.error('[SessionManager] Failed to send audio chunk:', error)
          }
        }
      }

      mediaRecorder.onerror = (error) => {
        console.error('[SessionManager] MediaRecorder error:', error)
      }

      // Start recording with small time slices for low latency
      mediaRecorder.start(100) // 100ms chunks

      // Store recorder reference for cleanup
      ;(this as any).mediaRecorder = mediaRecorder
    } catch (error) {
      console.error('[SessionManager] Failed to set up audio streaming:', error)
    }
  }

  /**
   * Set up event handlers for realtime client
   */
  private setupRealtimeEventHandlers(): void {
    this.realtimeClient.on('all', (event: VoiceSessionEvent) => {
      // Forward all realtime events to our event handlers
      this.emit(event)
      
      // Handle specific events that affect session state
      switch (event.type) {
        case 'CONNECT_SUCCESS':
          this.sessionState.connectionState = 'connected'
          this.sessionState.sessionId = event.sessionId
          break
          
        case 'CONNECT_ERROR':
        case 'ERROR':
          this.sessionState.connectionState = 'error'
          break
          
        case 'DISCONNECT':
          this.sessionState.connectionState = 'disconnected'
          this.sessionState.sessionId = null
          break
          
        case 'MESSAGE_RECEIVED':
          this.sessionState.conversationHistory.push(event.message)
          break
      }
    })
  }

  /**
   * Handle audio level updates
   */
  private handleAudioLevelUpdate(level: number): void {
    this.sessionState.audioLevel = level
    this.emit({ type: 'AUDIO_LEVEL_UPDATE', level })
  }

  /**
   * Handle errors from audio manager or realtime client
   */
  private handleError(error: VoiceError): void {
    console.error('[SessionManager] Error:', error)
    this.emit({ type: 'ERROR', error })
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
   * Clean up resources
   */
  dispose(): void {
    this.endSession()
    this.audioManager.dispose()
    this.eventHandlers.clear()
    
    // Clean up media recorder if exists
    const mediaRecorder = (this as any).mediaRecorder
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
    
    console.log('[SessionManager] Disposed')
  }
}