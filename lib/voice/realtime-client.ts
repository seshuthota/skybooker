/**
 * OpenAI Realtime Client using Official Agents SDK (or a LocalTestSession in tests)
 * Implements speech-to-speech architecture with WebRTC transport
 */
import { LocalTestSession } from './local-test-session'
import { VoiceSessionStorage } from './session-storage'
import { VoiceErrorHandler, ErrorHandlingResult } from './error-handler'
import { 
  VoiceSessionState, 
  SessionConfig, 
  ConversationMessage,
  VoiceError,
  VoiceSessionEvent,
  ConnectionState,
  ConnectionDetails,
  AudioQualityMetrics,
  ConversationContext
} from '@/types/voice'

export class RealtimeClient {
  private agent: any | null = null
  private session: any | null = null
  private sessionId: string | null = null
  private connectionState: ConnectionState = 'disconnected'
  private connectionDetails: ConnectionDetails
  private conversationHistory: ConversationMessage[] = []
  private eventHandlers: Map<string, (event: VoiceSessionEvent) => void> = new Map()
  private apiKey: string
  private config: SessionConfig | null = null
  private isListening: boolean = false
  private isSpeaking: boolean = false
  private audioQuality: AudioQualityMetrics
  private reconnectTimer: NodeJS.Timeout | null = null
  private connectionTimeout: NodeJS.Timeout | null = null
  private activityTimer: NodeJS.Timeout | null = null
  private lastActivity: Date | null = null
  private audioLevelTimer: NodeJS.Timeout | null = null
  private audioLevelUpdateInterval: number = 100 // Update every 100ms
  private sessionStorage: VoiceSessionStorage
  private conversationContext: ConversationContext
  private userId: string
  private autoSaveInterval: NodeJS.Timeout | null = null
  private autoSaveDelay: number = 5000 // Auto-save every 5 seconds
  private currentError: ErrorHandlingResult | null = null
  private retryCount: number = 0
  private maxRetries: number = 3
  private errorRecoveryCallback: ((error: ErrorHandlingResult) => void) | null = null
  private appendedItemIds: Set<string> = new Set()
  private toolStatusSeen: Map<string, Set<'in_progress' | 'completed'>> = new Map()

  constructor(apiKey: string, userId: string) {
    this.apiKey = apiKey
    this.userId = userId
    
    // Initialize connection details
    this.connectionDetails = {
      attempts: 0,
      lastError: null,
      connectedAt: null,
      reconnectDelay: 1000, // Start with 1 second
      maxReconnectAttempts: 5,
      isReconnecting: false,
      connectionQuality: 'good',
      latency: 0
    }
    
    // Initialize audio quality metrics
    this.audioQuality = {
      inputLevel: 0,
      outputLevel: 0,
      noiseLevel: 0,
      signalToNoise: 0,
      latency: 0,
      jitter: 0,
      packetsLost: 0,
      connectionStability: 100
    }
    
    // Initialize session storage
    this.sessionStorage = new VoiceSessionStorage({
      maxSessions: 10,
      maxHistoryLength: 200,
      sessionTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
      autoCleanup: true
    })
    
    // Initialize conversation context
    this.conversationContext = {
      userId: this.userId,
      sessionId: '',
      currentIntent: 'greeting'
    }
    
    console.log('[RealtimeClient] Initialized with enhanced session management and persistence')
  }

  /**
   * Connect to OpenAI Realtime API using the official SDK
   */
  async connect(config: SessionConfig): Promise<void> {
    try {
      // Update connection attempt
      this.connectionDetails.attempts++
      this.connectionState = 'initializing'
      this.config = config
      this.emit({ type: 'CONNECT_START' })

      console.log(`[RealtimeClient] Starting connection attempt ${this.connectionDetails.attempts}`)
      
      // Set connection timeout
      this.setConnectionTimeout()
      
      // Create Maya Travel Assistant using the official SDK
      this.connectionState = 'requesting_permissions'
      this.emit({ type: 'PERMISSIONS_REQUESTED' })
      
      const useLocal = typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_REALTIME_TEST === 'local' || process.env.NODE_ENV === 'test')

      console.log('[RealtimeClient] Creating RealtimeAgent with Maya persona...')
      if (useLocal) {
        this.agent = {
          name: 'Maya',
          model: config.model || 'gpt-4o-realtime-preview',
          instructions: this.buildMayaInstructions(config.instructions),
          voice: config.voice || 'alloy',
          temperature: config.temperature || 0.7,
          tools: config.tools || [],
        }
        console.log('[RealtimeClient] Creating LocalTestSession...')
        this.session = new LocalTestSession(this.agent)
      } else {
        // Lazy require to avoid loading SDK in test environment
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const sdk = require('@openai/agents/realtime')
        const RA = sdk.RealtimeAgent
        const RS = sdk.RealtimeSession
        this.agent = new RA({
          name: 'Maya',
          model: config.model || 'gpt-4o-realtime-preview',
          instructions: this.buildMayaInstructions(config.instructions),
          voice: config.voice || 'alloy',
          temperature: config.temperature || 0.7,
          tools: config.tools || [],
        })
        console.log('[RealtimeClient] Creating RealtimeSession...')
        this.session = new RS(this.agent)
      }

      // Set up event listeners for the session
      this.setupSessionEventHandlers()

      // Update state to connecting
      this.connectionState = 'connecting'
      this.emit({ type: 'CONNECTING' })
      this.emit({ type: 'PERMISSIONS_GRANTED' })

      // Connect using the session - this handles WebRTC automatically in browser
      console.log('[RealtimeClient] Connecting to OpenAI Realtime API...')
      const startTime = Date.now()
      
      if ((this.session as any).connect) {
        await (this.session as any).connect({
          apiKey: this.apiKey,
          useInsecureApiKey: true
        } as any)
      }

      // Apply session-level config such as VAD and audio formats
      try {
        const turn = this.config?.turn_detection
          ? {
              type: this.config.turn_detection.type,
              threshold: this.config.turn_detection.threshold,
              prefixPaddingMs: this.config.turn_detection.prefix_padding_ms,
              silenceDurationMs: this.config.turn_detection.silence_duration_ms,
            }
          : { type: 'server_vad', threshold: 0.6, prefixPaddingMs: 200, silenceDurationMs: 650 }
        const transport: any = (this.session as any).transport
        if (transport && typeof transport.updateSessionConfig === 'function') {
          transport.updateSessionConfig({
            inputAudioFormat: 'pcm16',
            outputAudioFormat: 'pcm16',
            inputAudioTranscription: {
              model: 'gpt-4o-mini-transcribe',
              language: 'en',
            },
            turnDetection: turn as any,
          } as any)
        } else {
          console.warn('[RealtimeClient] transport.updateSessionConfig not available; using defaults')
        }
      } catch (e) {
        console.warn('[RealtimeClient] Failed to apply session config', e)
      }

      // Calculate connection latency
      this.audioQuality.latency = Date.now() - startTime
      
      // Clear timeout and update state
      this.clearConnectionTimeout()
      this.sessionId = `realtime_session_${Date.now()}`
      this.connectionState = 'connected'
      this.connectionDetails.connectedAt = new Date()
      this.connectionDetails.lastError = null
      this.lastActivity = new Date()
      
      // Update conversation context with session ID
      this.conversationContext.sessionId = this.sessionId
      
      console.log('[RealtimeClient] Successfully connected to OpenAI Realtime API')
      this.emit({ type: 'CONNECT_SUCCESS', sessionId: this.sessionId })
      
      // Transition to ready state after a brief moment
      setTimeout(() => {
        if (this.connectionState === 'connected') {
          this.connectionState = 'ready'
          this.emit({ type: 'CONNECTION_READY' })
          this.startActivityMonitoring()
          this.startAutoSave()
        }
      }, 500)

    } catch (error) {
      this.clearConnectionTimeout()
      this.handleConnectionError(error)
    }
  }

  /**
   * Build Maya's comprehensive travel assistant instructions
   */
  private buildMayaInstructions(customInstructions?: string): string {
    const mayaPersona = `
# Personality and Tone

## Identity
You are Maya, a professional and friendly travel booking assistant for SkyBooker, a premium flight booking platform. You have extensive expertise in travel planning, flight searches, airline policies, and booking assistance. You're warm, approachable, and always eager to help travelers find their perfect flights. You've been helping travelers for years and take pride in making their booking experience smooth and enjoyable.

## Task
You are an expert at helping users find and book flights through natural conversation. You can search for flights, explain options, gather passenger details, guide users through the booking process, and provide travel advice. Your goal is to turn every interaction into a successful booking while ensuring the traveler feels confident and well-informed.

## Demeanor
Professional yet warm, patient, and proactive in suggesting travel improvements and alternatives. You're empathetic when dealing with travel concerns or changes, and you maintain a positive attitude even when handling complex requests.

## Tone
Warm and conversational but professional. Friendly and helpful without being overly casual. You speak clearly and with confidence about travel matters.

## Level of Enthusiasm
Moderately enthusiastic - excited to help with travel plans but not overwhelming. You show genuine interest in making their trip perfect.

## Level of Formality
Casual but respectful. Use "you" instead of formal titles unless the customer prefers otherwise. Strike a balance between approachable and professional.

## Level of Emotion
Empathetic and understanding, especially when dealing with travel concerns, changes, or complications. You acknowledge stress and provide reassurance.

## Filler Words
Occasionally use natural speech patterns like "um," "let's see," "alright," "hmm" to sound more human and conversational.

## Pacing
Clear and measured. Give users time to process flight options and make decisions. Don't rush through important information.

# Instructions

## Critical Communication Rules
- Always confirm important details like names, dates, destinations, and flight times by repeating them back clearly
- If a user provides specific information like names or confirmation numbers, spell them back letter by letter for absolute clarity
- When you make corrections or the user corrects you, acknowledge it straightforwardly and confirm the new information
- Be proactive in suggesting alternatives if initial searches don't meet their needs or budget
- Always explain flight options clearly including price, duration, layovers, and any important details like baggage fees
- Guide users step by step through the booking process without overwhelming them
- If you're unsure about any travel detail, ask clarifying questions rather than making assumptions

## Tools
- Use "search_flights" to fetch flight options once you have origin, destination, dates, and passenger count.
- Use "book_flight" after the user selects an option and provides required passenger/contact details.
- Use "get_user_profile" to prefill known traveler details when the user is signed in.
- Use "get_user_bookings" or "get_booking_by_id" to review or modify existing reservations.
- Use "cancel_booking" only after explicit confirmation from the user.

## Conversation Flow
You should naturally guide conversations through these stages:

1. **Greeting and Intent Discovery**: Warmly welcome the user and understand what kind of travel assistance they need
2. **Travel Details Gathering**: Collect origin, destination, dates, number of passengers, class preferences, and any special requirements  
3. **Flight Search and Presentation**: Find suitable options and present them clearly with pros/cons
4. **Selection and Booking Assistance**: Help them choose the best option and guide through passenger details
5. **Payment and Confirmation**: Assist with payment processing and provide clear confirmation details

## Conversation States
[
  {
    "id": "greeting",
    "description": "Welcome user warmly and understand their travel intent",
    "instructions": [
      "Greet the user with enthusiasm and introduce yourself as Maya",
      "Ask how you can help with their travel plans today",
      "Listen for whether they want to book new flights, modify existing bookings, or need travel advice"
    ],
    "examples": [
      "Hi there! I'm Maya, your travel assistant here at SkyBooker. I'm excited to help you with your travel plans today!",
      "Good morning! Maya here, ready to help you find the perfect flight. What adventure are we planning today?"
    ],
    "transitions": [
      {"next_step": "flight_search", "condition": "User wants to book new flights"},
      {"next_step": "existing_booking", "condition": "User has existing booking questions"},
      {"next_step": "travel_advice", "condition": "User needs general travel help"}
    ]
  },
  {
    "id": "flight_search",
    "description": "Gather travel details and search for flights",
    "instructions": [
      "Ask for departure city/airport in a conversational way",
      "Get destination city/airport", 
      "Confirm travel dates (departure and return if applicable)",
      "Ask about number of passengers and any class preferences",
      "Check for any special requirements (direct flights, specific airlines, etc.)"
    ],
    "examples": [
      "Perfect! Let's find you some great flight options. Where will you be departing from?",
      "And where would you like to go? I can help with both domestic and international destinations.",
      "What dates work best for your departure? And will this be a round trip?"
    ],
    "transitions": [
      {"next_step": "flight_selection", "condition": "All details collected, present options"},
      {"next_step": "modify_search", "condition": "User wants to change search criteria"}
    ]
  },
  {
    "id": "flight_selection", 
    "description": "Present flight options and help user choose",
    "instructions": [
      "Present 2-3 best flight options with clear details",
      "Explain the benefits and trade-offs of each option",
      "Help them understand pricing, timing, and airline differences",
      "Answer questions about baggage, seats, meals, etc."
    ],
    "examples": [
      "I found some excellent options for you! Let me walk you through the top three choices...",
      "The first option is a direct flight with Delta departing at 8:30 AM for $345. The benefit is no layovers, but it's an early departure.",
      "Would you like me to explain the differences between these airlines or check for any additional options?"
    ],
    "transitions": [
      {"next_step": "passenger_details", "condition": "User selects a flight"},
      {"next_step": "flight_search", "condition": "User wants different options"}
    ]
  },
  {
    "id": "passenger_details",
    "description": "Collect passenger information for booking",
    "instructions": [
      "Gather full names exactly as they appear on passports/IDs",
      "Spell back names letter by letter for confirmation", 
      "Collect dates of birth, contact information",
      "Ask about seat preferences, meal requests, accessibility needs",
      "Confirm all details before proceeding to payment"
    ],
    "examples": [
      "Excellent choice! Now I'll need some passenger details to complete your booking.",
      "Let me get the traveler's full name exactly as it appears on their ID. Can you spell the first name for me?",
      "Let me confirm that spelling: J-O-H-N, is that correct?"
    ],
    "transitions": [
      {"next_step": "payment", "condition": "All passenger details confirmed"},
      {"next_step": "modify_details", "condition": "User needs to correct information"}
    ]
  },
  {
    "id": "payment",
    "description": "Guide through payment and booking completion",
    "instructions": [
      "Explain the total cost breakdown clearly",
      "Guide through secure payment process",
      "Provide booking confirmation details",
      "Explain next steps like check-in, baggage, etc."
    ],
    "examples": [
      "Perfect! The total for your flight comes to $345 including taxes and fees.",
      "I'll guide you through our secure payment process now.",
      "Congratulations! Your booking is confirmed. Let me give you all the important details..."
    ],
    "transitions": [
      {"next_step": "confirmation", "condition": "Payment successful"},
      {"next_step": "passenger_details", "condition": "Payment issues, need to verify details"}
    ]
  },
  {
    "id": "confirmation",
    "description": "Provide confirmation and additional assistance",
    "instructions": [
      "Give clear confirmation number and booking details",
      "Explain important dates (check-in time, departure, etc.)",
      "Offer additional services (hotels, car rentals, travel insurance)",
      "Ask if they need any other travel assistance"
    ],
    "examples": [
      "Your confirmation number is A-B-C-1-2-3. I'll spell that: A as in Apple, B as in Bravo, C as in Charlie, 1-2-3.",
      "Is there anything else I can help you with today? Perhaps hotel recommendations or car rental at your destination?"
    ],
    "transitions": [
      {"next_step": "additional_help", "condition": "User needs more assistance"},
      {"next_step": "end_session", "condition": "User is satisfied and ready to end"}
    ]
  }
]

${customInstructions ? `\n# Additional Instructions\n${customInstructions}` : ''}

Remember: You are Maya, and your goal is to make flight booking feel personal, easy, and confidence-inspiring. Every interaction should feel like talking to a knowledgeable friend who happens to be a travel expert.
`

    return mayaPersona.trim()
  }

  /**
   * Set up event listeners for the RealtimeSession
   */
  private setupSessionEventHandlers(): void {
    if (!this.session) return

    // Rely on history events for both user and assistant messages to avoid duplicates.
    // Additional transport-level events are not used for appending transcript lines.

    // Fallback and comprehensive transcript capture via session history
    const handleHistoryItem = (item: any) => {
      try {
        if (!item) return
        const itemId = item.itemId || item.id

        // Handle tool calls: emit activity for in_progress and completed
        if (item.type === 'function_call') {
          if (!itemId) return
          const status: 'in_progress' | 'completed' = item.status
          const seenStatuses = this.toolStatusSeen.get(itemId) || new Set()
          if (seenStatuses.has(status)) return
          seenStatuses.add(status)
          this.toolStatusSeen.set(itemId, seenStatuses)

          let parsedArgs: any = undefined
          try { parsedArgs = item.arguments ? JSON.parse(item.arguments) : undefined } catch {}
          let parsedOutput: any = undefined
          try { parsedOutput = item.output ? JSON.parse(item.output) : undefined } catch {}

          this.emit({
            type: 'TOOL_CALL',
            itemId,
            status,
            name: item.name,
            arguments: parsedArgs ?? item.arguments,
            output: parsedOutput ?? item.output,
          } as any)
          return
        }

        if (item.type !== 'message') return
        if (!itemId || this.appendedItemIds.has(itemId)) return
        const role = item.role === 'user' ? 'user' : item.role === 'assistant' ? 'assistant' : null
        if (!role) return

        let text: string | undefined
        if (Array.isArray(item.content)) {
          if (role === 'user') {
            // Prefer input_text, otherwise input_audio.transcript
            const textEntry = item.content.find((c: any) => c?.type === 'input_text' && typeof c?.text === 'string')
            if (textEntry?.text) {
              text = textEntry.text
            } else {
              const audioEntry = item.content.find((c: any) => c?.type === 'input_audio' && typeof c?.transcript === 'string')
              if (audioEntry?.transcript) text = audioEntry.transcript
            }
          } else {
            // assistant: prefer final text, otherwise audio transcript
            // scan from end for most recent text
            for (let i = item.content.length - 1; i >= 0; i--) {
              const c = item.content[i]
              if (c?.type === 'text' && typeof c?.text === 'string' && c.text.trim()) { text = c.text; break }
              if (c?.type === 'audio' && typeof c?.transcript === 'string' && c.transcript.trim()) { text = c.transcript; break }
            }
          }
        }

        if (text && text.trim()) {
          const conversationMessage: ConversationMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(2)}`,
            timestamp: new Date(),
            type: role,
            content: text.trim(),
            agentName: role === 'user' ? 'You' : 'Maya',
          }
          this.conversationHistory.push(conversationMessage)
          this.appendedItemIds.add(itemId)
          this.updateActivity()
          this.emit({ type: 'MESSAGE_RECEIVED', message: conversationMessage })
        }
      } catch (e) {
        // Do not crash the session due to parsing issues
      }
    }

    this.session.on('history_added', (addedItem: any) => handleHistoryItem(addedItem))
    this.session.on('item_update', (updatedItem: any) => handleHistoryItem(updatedItem))
    this.session.on('history_updated', (history: any[]) => {
      // Defensive: scan full history and append any unseen message items
      try {
        if (!Array.isArray(history)) return
        history.forEach((it: any) => handleHistoryItem(it))
      } catch {}
    })

    // Handle speech detection events
    this.session.on('speech_started', () => {
      this.isListening = true
      this.emit({ type: 'START_LISTENING' })
    })

    this.session.on('speech_stopped', () => {
      this.isListening = false  
      this.emit({ type: 'STOP_LISTENING' })
    })

    // Handle AI speaking events
    this.session.on('response_started', () => {
      this.isSpeaking = true
      this.emit({ type: 'START_SPEAKING' })
    })

    this.session.on('response_finished', () => {
      this.isSpeaking = false
      this.emit({ type: 'STOP_SPEAKING' })
    })

    // Handle connection events
    this.session.on('connected', () => {
      console.log('[RealtimeClient] Session connected successfully')
      this.connectionState = 'connected'
    })

    this.session.on('disconnected', () => {
      console.log('[RealtimeClient] Session disconnected')
      this.connectionState = 'disconnected'
      this.sessionId = null
      this.isListening = false
      this.isSpeaking = false
      this.emit({ type: 'DISCONNECT' })
    })

    // Handle errors
    this.session.on('error', (error: any) => {
      const voiceError: VoiceError = {
        code: 'SESSION_ERROR',
        message: error.message || 'Unknown session error',
        details: error,
        timestamp: new Date(),
        recoverable: true
      }

      console.error('[RealtimeClient] Session error:', error)
      this.emit({ type: 'ERROR', error: voiceError })
    })

    console.log('[RealtimeClient] Event handlers configured')
  }

  /**
   * Send a user text message into the realtime session
   */
  sendText(text: string): void {
    if (!this.session) {
      console.warn('[RealtimeClient] Cannot sendText - session not available')
      return
    }
    try {
      // The SDK accepts a plain string or a structured message
      this.session.sendMessage(text)
    } catch (e) {
      console.error('[RealtimeClient] sendText error', e)
    }
  }

  /**
   * Set connection timeout with automatic cleanup
   */
  private setConnectionTimeout(): void {
    this.clearConnectionTimeout()
    this.connectionTimeout = setTimeout(() => {
      if (this.connectionState === 'connecting' || this.connectionState === 'requesting_permissions') {
        const timeoutError: VoiceError = {
          code: 'CONNECTION_TIMEOUT',
          message: 'Connection attempt timed out after 10 seconds',
          details: { timeout: 10000 },
          timestamp: new Date(),
          recoverable: true
        }
        this.handleConnectionError(timeoutError)
      }
    }, 10000) // 10 second timeout
  }

  /**
   * Clear connection timeout
   */
  private clearConnectionTimeout(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout)
      this.connectionTimeout = null
    }
  }

  /**
   * Handle connection errors with comprehensive error handling
   */
  private handleConnectionError(error: any): void {
    const voiceError: VoiceError = {
      code: error.code || 'CONNECTION_FAILED',
      message: error.message || 'Failed to connect to OpenAI Realtime API',
      details: error,
      timestamp: new Date(),
      recoverable: this.connectionDetails.attempts < this.connectionDetails.maxReconnectAttempts
    }

    // Process error through comprehensive error handler
    this.currentError = VoiceErrorHandler.handleError(voiceError, this.connectionState)
    VoiceErrorHandler.logError(this.currentError, voiceError)

    this.connectionDetails.lastError = voiceError
    this.connectionState = 'error'
    
    console.error(`[RealtimeClient] Connection failed (attempt ${this.connectionDetails.attempts}):`, error)
    
    // Emit error with enhanced handling result
    this.emit({ type: 'CONNECT_ERROR', error: voiceError, errorHandling: this.currentError })

    // Handle automatic retry or escalation
    this.handleErrorRecovery(this.currentError)
  }

  /**
   * Schedule automatic reconnection with exponential backoff
   */
  private scheduleReconnection(): void {
    if (this.connectionDetails.isReconnecting) return

    this.connectionDetails.isReconnecting = true
    this.connectionState = 'reconnecting'
    
    console.log(`[RealtimeClient] Scheduling reconnection in ${this.connectionDetails.reconnectDelay}ms`)
    this.emit({ type: 'RECONNECTING', attempt: this.connectionDetails.attempts + 1 })

    this.reconnectTimer = setTimeout(async () => {
      try {
        this.connectionDetails.isReconnecting = false
        await this.connect(this.config!)
        
        // Reset reconnect delay on successful connection
        this.connectionDetails.reconnectDelay = 1000
        this.emit({ type: 'RECONNECT_SUCCESS' })
        
      } catch (error) {
        this.connectionDetails.isReconnecting = false
        // Exponential backoff: double the delay, max 30 seconds
        this.connectionDetails.reconnectDelay = Math.min(this.connectionDetails.reconnectDelay * 2, 30000)
        
        const reconnectError: VoiceError = {
          code: 'RECONNECT_FAILED',
          message: 'Automatic reconnection failed',
          details: error,
          timestamp: new Date(),
          recoverable: this.connectionDetails.attempts < this.connectionDetails.maxReconnectAttempts
        }
        
        this.emit({ type: 'RECONNECT_FAILED', error: reconnectError })
      }
    }, this.connectionDetails.reconnectDelay)
  }

  /**
   * Start activity monitoring for session timeout
   */
  private startActivityMonitoring(): void {
    this.resetActivityTimer()
    this.startAudioLevelMonitoring()
  }

  /**
   * Start real-time audio level monitoring
   */
  private startAudioLevelMonitoring(): void {
    this.stopAudioLevelMonitoring() // Clear any existing timer
    
    this.audioLevelTimer = setInterval(() => {
      if (this.connectionState === 'ready' || this.connectionState === 'connected') {
        this.updateAudioLevels()
      }
    }, this.audioLevelUpdateInterval)
    
    console.log('[RealtimeClient] Started audio level monitoring')
  }

  /**
   * Stop audio level monitoring
   */
  private stopAudioLevelMonitoring(): void {
    if (this.audioLevelTimer) {
      clearInterval(this.audioLevelTimer)
      this.audioLevelTimer = null
    }
  }

  /**
   * Update audio levels and quality metrics
   */
  private updateAudioLevels(): void {
    // Since the SDK handles actual audio, we'll simulate realistic audio levels
    // In a real implementation, this would read from the actual audio stream
    
    let inputLevel = 0
    let outputLevel = 0
    
    if (this.isListening) {
      // Simulate microphone input with some variation
      inputLevel = Math.random() * 20 + 15 + (Math.sin(Date.now() / 1000) * 10)
      inputLevel = Math.max(0, Math.min(100, inputLevel))
      
      // Add some noise simulation
      if (Math.random() < 0.1) { // 10% chance of noise spike
        inputLevel += Math.random() * 30
      }
    }
    
    if (this.isSpeaking) {
      // Simulate Maya speaking with animated levels
      outputLevel = Math.random() * 30 + 40 + (Math.sin(Date.now() / 800) * 15)
      outputLevel = Math.max(0, Math.min(100, outputLevel))
    }
    
    // Update audio quality metrics
    this.audioQuality.inputLevel = inputLevel
    this.audioQuality.outputLevel = outputLevel
    
    // Simulate signal-to-noise ratio (higher is better)
    this.audioQuality.signalToNoise = this.isListening ? 
      Math.max(10, 25 - (this.audioQuality.noiseLevel / 4)) : 0
    
    // Simulate jitter and packet loss based on connection quality
    this.audioQuality.jitter = Math.random() * 5 + (this.audioQuality.latency / 100)
    this.audioQuality.packetsLost = Math.random() < 0.95 ? 0 : Math.random() * 2
    
    // Update connection stability (decreases with latency and packet loss)
    this.audioQuality.connectionStability = Math.max(50, 
      100 - (this.audioQuality.latency / 10) - (this.audioQuality.packetsLost * 10)
    )
    
    // Emit audio level update
    this.emit({ type: 'AUDIO_LEVEL_UPDATE', level: Math.max(inputLevel, outputLevel) })
    this.emit({ type: 'AUDIO_QUALITY_UPDATE', metrics: { ...this.audioQuality } })
  }

  /**
   * Reset activity timer
   */
  private resetActivityTimer(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer)
    }

    // Set 10 minute inactivity timeout
    this.activityTimer = setTimeout(() => {
      const inactiveTime = Date.now() - (this.lastActivity?.getTime() || 0)
      console.log(`[RealtimeClient] Session timeout after ${inactiveTime}ms of inactivity`)
      this.emit({ type: 'SESSION_TIMEOUT', inactiveTime })
    }, 10 * 60 * 1000) // 10 minutes
  }

  /**
   * Update activity timestamp
   */
  private updateActivity(): void {
    this.lastActivity = new Date()
    this.resetActivityTimer()
  }

  /**
   * Start automatic session saving
   */
  private startAutoSave(): void {
    this.stopAutoSave() // Clear any existing timer
    
    this.autoSaveInterval = setInterval(() => {
      this.saveCurrentSession()
    }, this.autoSaveDelay)
    
    console.log('[RealtimeClient] Started auto-save every 5 seconds')
  }

  /**
   * Stop automatic session saving
   */
  private stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval)
      this.autoSaveInterval = null
    }
  }

  /**
   * Save current session state to storage
   */
  private saveCurrentSession(): void {
    if (!this.sessionId || this.conversationHistory.length === 0) {
      return // Nothing meaningful to save
    }

    try {
      this.sessionStorage.saveSession(
        this.sessionId,
        this.userId,
        this.conversationHistory,
        this.conversationContext
      )
    } catch (error) {
      console.error('[RealtimeClient] Failed to save session:', error)
    }
  }

  /**
   * Attempt to recover from the most recent session
   */
  async recoverLatestSession(): Promise<boolean> {
    try {
      const latestSession = this.sessionStorage.getLatestSession(this.userId)
      
      if (!latestSession) {
        console.log('[RealtimeClient] No recoverable session found')
        return false
      }

      // Check if session is recent enough (within 1 hour)
      const sessionAge = Date.now() - new Date(latestSession.lastActivity).getTime()
      const oneHour = 60 * 60 * 1000
      
      if (sessionAge > oneHour) {
        console.log('[RealtimeClient] Latest session too old for automatic recovery')
        return false
      }

      return this.recoverSession(latestSession.sessionId)
    } catch (error) {
      console.error('[RealtimeClient] Failed to recover latest session:', error)
      return false
    }
  }

  /**
   * Recover a specific session by ID
   */
  async recoverSession(sessionId: string): Promise<boolean> {
    try {
      const session = this.sessionStorage.loadSession(sessionId)
      
      if (!session) {
        console.log(`[RealtimeClient] Session ${sessionId} not found`)
        return false
      }

      // Restore conversation history and context
      this.conversationHistory = session.conversationHistory
      this.conversationContext = session.conversationContext
      this.lastActivity = new Date(session.lastActivity)

      console.log(`[RealtimeClient] Recovered session ${sessionId} with ${session.conversationHistory.length} messages`)
      
      // Emit recovery event
      this.emit({ 
        type: 'SESSION_RECOVERED', 
        recoveredData: {
          sessionId: session.sessionId,
          messageCount: session.conversationHistory.length,
          lastActivity: session.lastActivity,
          context: session.conversationContext
        }
      })

      return true
    } catch (error) {
      console.error('[RealtimeClient] Failed to recover session:', error)
      return false
    }
  }

  /**
   * Get recovery suggestions for the user
   */
  getRecoverySuggestions(): Array<{
    sessionId: string
    lastActivity: Date
    messageCount: number
    contextSummary: string
  }> {
    return this.sessionStorage.getRecoverySuggestions(this.userId)
  }

  /**
   * Update conversation context (for travel booking state)
   */
  updateConversationContext(updates: Partial<ConversationContext>): void {
    this.conversationContext = {
      ...this.conversationContext,
      ...updates
    }
    
    // Trigger an immediate save when context changes
    this.saveCurrentSession()
    
    console.log('[RealtimeClient] Updated conversation context:', updates)
  }

  /**
   * Disconnect from the realtime API
   */
  async disconnect(): Promise<void> {
    console.log('[RealtimeClient] Disconnecting from OpenAI Realtime API...')
    
    // Save final session state before disconnecting
    this.saveCurrentSession()
    
    // Clear all timers
    this.clearConnectionTimeout()
    this.stopAudioLevelMonitoring()
    this.stopAutoSave()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.activityTimer) {
      clearTimeout(this.activityTimer)
      this.activityTimer = null
    }
    
    if (this.session) {
      try {
        // RealtimeSession officially exposes `close()`; prefer it over any others
        const s: any = this.session as any
        if (typeof s.close === 'function') {
          s.close()
        } else if (typeof s.disconnect === 'function') {
          // Back-compat with potential older transports
          await s.disconnect()
        } else if (typeof s.end === 'function') {
          await s.end()
        } else if (s?.transport && typeof s.transport.close === 'function') {
          s.transport.close()
        } else {
          console.warn('[RealtimeClient] Session has no close/disconnect/end; skipping explicit teardown')
        }
      } catch (error) {
        console.error('[RealtimeClient] Error during disconnect:', error)
      }
      this.session = null
    }
    
    this.agent = null
    
    // Reset connection state
    this.connectionState = 'disconnected'
    this.sessionId = null
    this.isListening = false
    this.isSpeaking = false
    this.lastActivity = null
    
    // Reset connection details
    this.connectionDetails.attempts = 0
    this.connectionDetails.lastError = null
    this.connectionDetails.connectedAt = null
    this.connectionDetails.isReconnecting = false
    this.connectionDetails.reconnectDelay = 1000
    
    // Keep conversation history for potential recovery
    // this.conversationHistory = []
    
    this.emit({ type: 'DISCONNECT' })
    console.log('[RealtimeClient] Disconnected successfully with cleanup')
  }

  /**
   * Start listening for user input (SDK handles this automatically)
   */
  startListening(): void {
    if (this.connectionState !== 'connected' || !this.session) {
      console.warn('[RealtimeClient] Cannot start listening - not connected')
      return
    }

    console.log('[RealtimeClient] Listening is handled automatically by the SDK')
    // The RealtimeSession SDK automatically handles audio capture and listening
    // We just track the state for UI purposes
    this.isListening = true
    this.emit({ type: 'START_LISTENING' })
  }

  /**
   * Stop listening for user input
   */
  stopListening(): void {
    console.log('[RealtimeClient] Stopping listening...')
    this.isListening = false
    this.emit({ type: 'STOP_LISTENING' })
  }

  /**
   * Send audio data (not needed with SDK, kept for compatibility)
   */
  sendAudio(audioData: ArrayBuffer): void {
    console.log('[RealtimeClient] Audio streaming is handled automatically by the SDK')
    // The RealtimeAgent SDK handles all audio streaming automatically
  }

  /**
   * Get current session state
   */
  getSessionState(): VoiceSessionState {
    return {
      sessionId: this.sessionId,
      connectionState: this.connectionState,
      connectionDetails: { ...this.connectionDetails },
      isListening: this.isListening,
      isSpeaking: this.isSpeaking,
      currentAgent: { name: 'Maya', id: 'maya-realtime' },
      conversationHistory: this.conversationHistory,
      audioLevel: this.audioQuality.inputLevel,
      audioQuality: { ...this.audioQuality },
      lastActivity: this.lastActivity
    }
  }

  /**
   * Get current state (alias for compatibility)
   */
  getState(): VoiceSessionState {
    return this.getSessionState()
  }

  /**
   * Add event listener
   */
  on(eventType: string, handler: (event: VoiceSessionEvent) => void): void {
    this.eventHandlers.set(eventType, handler)
  }

  /**
   * Remove event listener
   */
  off(eventType: string): void {
    this.eventHandlers.delete(eventType)
  }

  /**
   * Handle error recovery strategies
   */
  private handleErrorRecovery(errorResult: ErrorHandlingResult): void {
    // Execute automated solutions
    const automatedSolutions = errorResult.solutions.filter(s => s.automated)
    
    for (const solution of automatedSolutions) {
      this.executeAutomatedSolution(solution)
    }

    // Trigger user-facing error recovery if needed
    if (errorResult.severity.requiresUserAction && this.errorRecoveryCallback) {
      this.errorRecoveryCallback(errorResult)
    }

    // Handle automatic retry logic
    if (errorResult.canRetry && this.retryCount < this.maxRetries) {
      setTimeout(() => {
        this.retryConnection()
      }, errorResult.retryDelay)
    }
  }

  /**
   * Execute automated error recovery solutions
   */
  private executeAutomatedSolution(solution: any): void {
    switch (solution.action) {
      case 'retry':
        this.scheduleReconnection()
        break
      case 'lowBandwidthMode':
        this.enableLowBandwidthMode()
        break
      case 'restartAudio':
        this.restartAudioSystem()
        break
      case 'showTranscript':
        this.emit({ type: 'ENABLE_TRANSCRIPT' })
        break
      case 'optimizeConnection':
        this.optimizeConnectionSettings()
        break
      default:
        console.log(`[RealtimeClient] Unhandled automated solution: ${solution.action}`)
    }
  }

  /**
   * Enable low bandwidth mode for poor connections
   */
  private enableLowBandwidthMode(): void {
    console.log('[RealtimeClient] Enabling low bandwidth mode')
    // Reduce audio quality for better connection stability
    this.emit({ type: 'LOW_BANDWIDTH_MODE_ENABLED' })
  }

  /**
   * Restart audio system
   */
  private restartAudioSystem(): void {
    console.log('[RealtimeClient] Restarting audio system')
    this.stopAudioLevelMonitoring()
    setTimeout(() => {
      this.startAudioLevelMonitoring()
      this.emit({ type: 'AUDIO_SYSTEM_RESTARTED' })
    }, 1000)
  }

  /**
   * Optimize connection settings
   */
  private optimizeConnectionSettings(): void {
    console.log('[RealtimeClient] Optimizing connection settings')
    // Implement connection optimization logic
    this.emit({ type: 'CONNECTION_OPTIMIZED' })
  }

  /**
   * Retry connection with enhanced error handling
   */
  private async retryConnection(): Promise<void> {
    if (!this.config) {
      console.warn('[RealtimeClient] No config available for retry')
      return
    }

    this.retryCount++
    console.log(`[RealtimeClient] Retrying connection (attempt ${this.retryCount}/${this.maxRetries})`)
    
    try {
      await this.connect(this.config)
      this.retryCount = 0 // Reset on successful connection
      this.currentError = null
    } catch (error) {
      if (this.retryCount >= this.maxRetries) {
        const finalError = VoiceErrorHandler.createVoiceError(
          'Max retry attempts exceeded',
          'MAX_RETRIES_EXCEEDED',
          false
        )
        const errorResult = VoiceErrorHandler.handleError(finalError, this.connectionState)
        this.emit({ type: 'ERROR', error: finalError, errorHandling: errorResult })
      }
    }
  }

  /**
   * Set error recovery callback for UI integration
   */
  setErrorRecoveryCallback(callback: (error: ErrorHandlingResult) => void): void {
    this.errorRecoveryCallback = callback
  }

  /**
   * Get current error state
   */
  getCurrentError(): ErrorHandlingResult | null {
    return this.currentError
  }

  /**
   * Clear current error state
   */
  clearError(): void {
    this.currentError = null
    this.retryCount = 0
  }

  /**
   * Manual retry with error handling
   */
  async retryWithErrorHandling(): Promise<boolean> {
    if (!this.config) return false

    try {
      await this.connect(this.config)
      this.clearError()
      return true
    } catch (error) {
      const voiceError = VoiceErrorHandler.createVoiceError(error as Error)
      this.currentError = VoiceErrorHandler.handleError(voiceError, this.connectionState)
      this.handleErrorRecovery(this.currentError)
      return false
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: VoiceSessionEvent): void {
    // Send to specific event handler
    const handler = this.eventHandlers.get(event.type)
    if (handler) {
      handler(event)
    }

    // Send to 'all' handler
    const allHandler = this.eventHandlers.get('all')
    if (allHandler) {
      allHandler(event)
    }
  }
}
