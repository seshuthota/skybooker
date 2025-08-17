/**
 * Voice-related TypeScript types for SkyBooker Realtime Voice Agent
 */

export interface VoiceSessionState {
  sessionId: string | null
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'error'
  isListening: boolean
  isSpeaking: boolean
  currentAgent: string | null
  conversationHistory: ConversationMessage[]
  audioLevel: number
}

export interface ConversationMessage {
  id: string
  timestamp: Date
  type: 'user' | 'assistant' | 'system'
  content: string
  audioUrl?: string
  agentName?: string
  tools?: ToolCall[]
}

export interface ToolCall {
  id: string
  name: string
  parameters: Record<string, any>
  result?: any
  timestamp: Date
}

export interface VoiceSettings {
  microphoneId?: string
  speakerId?: string
  microphoneVolume: number
  speakerVolume: number
  voiceActivation: boolean
  pushToTalk: boolean
  noiseSupression: boolean
  echoCancellation: boolean
  showTranscript: boolean
  autoStartListening: boolean
}

export interface AudioState {
  isCapturing: boolean
  isPlaying: boolean
  microphoneStream: MediaStream | null
  audioContext: AudioContext | null
  audioLevel: number
  devices: MediaDeviceInfo[]
}

export interface AgentConfig {
  name: string
  instructions: string
  voice?: {
    model: string
    voice: string
  }
  tools?: ToolDefinition[]
  handoffTargets?: string[]
  conversationStarters?: string[]
}

export interface ToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, {
        type: string
        description: string
        enum?: string[]
        default?: any
      }>
      required: string[]
    }
  }
}

export interface SessionConfig {
  model: string
  voice: string
  instructions: string
  tools: ToolDefinition[]
  temperature?: number
  max_response_output_tokens?: number
  turn_detection?: {
    type: 'server_vad' | 'none'
    threshold?: number
    prefix_padding_ms?: number
    silence_duration_ms?: number
  }
}

export interface RealtimeEvent {
  event_id: string
  type: string
  [key: string]: any
}

export interface ConversationContext {
  userId: string
  sessionId: string
  currentIntent?: 'greeting' | 'flight_search' | 'booking' | 'support' | 'payment'
  searchCriteria?: {
    origin?: string
    destination?: string
    departureDate?: string
    returnDate?: string
    passengers?: number
    class?: 'economy' | 'business' | 'first'
  }
  selectedFlight?: any
  passengerDetails?: any
  paymentInfo?: any
  bookingId?: string
}

export interface VoiceError {
  code: string
  message: string
  details?: any
  timestamp: Date
  recoverable: boolean
}

export interface VoiceAnalytics {
  sessionId: string
  userId: string
  startTime: Date
  endTime?: Date
  totalDuration?: number
  messageCount: number
  toolCallCount: number
  successfulBooking: boolean
  errors: VoiceError[]
  audioQualityMetrics?: {
    averageLatency: number
    audioDropouts: number
    connectionQuality: 'poor' | 'fair' | 'good' | 'excellent'
  }
}

// Event types for voice session
export type VoiceSessionEvent = 
  | { type: 'CONNECT_START' }
  | { type: 'CONNECT_SUCCESS'; sessionId: string }
  | { type: 'CONNECT_ERROR'; error: VoiceError }
  | { type: 'DISCONNECT' }
  | { type: 'START_LISTENING' }
  | { type: 'STOP_LISTENING' }
  | { type: 'START_SPEAKING' }
  | { type: 'STOP_SPEAKING' }
  | { type: 'MESSAGE_RECEIVED'; message: ConversationMessage }
  | { type: 'TOOL_CALL'; toolCall: ToolCall }
  | { type: 'AGENT_HANDOFF'; fromAgent: string; toAgent: string }
  | { type: 'ERROR'; error: VoiceError }
  | { type: 'AUDIO_LEVEL_UPDATE'; level: number }

// Agent specialization types
export type AgentRole = 'triage' | 'flight_search' | 'booking' | 'support'

export interface AgentHandoffContext {
  reason: string
  conversationSummary: string
  preservedData: Record<string, any>
  userIntent: string
  nextSteps: string[]
}