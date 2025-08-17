/**
 * Unified Assistant Types
 * Shared types for both text and voice assistant modes
 */

export type AssistantMode = 'text' | 'voice'

export interface UnifiedMessage {
  id: string
  content: string
  sender: 'user' | 'assistant'
  timestamp: number
  mode: AssistantMode
  audioUrl?: string
  agentName?: string
  tools?: ToolExecution[]
  isStreaming?: boolean
}

export interface ToolExecution {
  id: string
  name: string
  parameters: Record<string, any>
  result?: any
  timestamp: number
  status: 'pending' | 'completed' | 'error'
}

export interface AssistantState {
  mode: AssistantMode
  isOpen: boolean
  isMinimized: boolean
  messages: UnifiedMessage[]
  isProcessing: boolean
  error: string | null
  
  // Text mode specific
  isMuted: boolean
  selectedVoice: string
  
  // Voice mode specific
  voiceSessionId: string | null
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'error'
  isListening: boolean
  isSpeaking: boolean
  audioLevel: number
}

export interface AssistantSettings {
  // Text mode settings
  enableTTS: boolean
  selectedTTSVoice: string
  
  // Voice mode settings
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

export interface ModeTransition {
  fromMode: AssistantMode
  toMode: AssistantMode
  preserveHistory: boolean
  reason?: 'user_request' | 'error_fallback' | 'api_unavailable'
}