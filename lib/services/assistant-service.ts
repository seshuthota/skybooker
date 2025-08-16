import { LLMService } from './llm-service'
import { TTSService } from './tts-service'

interface AssistantConfig {
  llm: {
    apiKey: string
    baseUrl?: string
    model: string
    maxTokens: number
    temperature: number
    systemPrompt: string
  }
  tts: {
    apiUrl: string
    apiKey?: string
    voice: string
    speed: number
    responseFormat: 'mp3' | 'wav' | 'opus' | 'flac' | 'pcm'
    stream: boolean
  }
}

interface ConversationState {
  isProcessing: boolean
  isSpeaking: boolean
  isListening: boolean
  currentMessage: string
  error: string | null
}

type AssistantEventType = 'stateChange' | 'messageReceived' | 'speechStart' | 'speechEnd' | 'error'

interface AssistantEvent {
  type: AssistantEventType
  data?: any
}

export class AssistantService {
  private llmService: LLMService
  private ttsService: TTSService
  private state: ConversationState
  private eventListeners: Map<AssistantEventType, ((event: AssistantEvent) => void)[]>

  constructor(config: AssistantConfig) {
    this.llmService = new LLMService(config.llm)
    this.ttsService = new TTSService(config.tts)
    this.eventListeners = new Map()
    
    this.state = {
      isProcessing: false,
      isSpeaking: false,
      isListening: false,
      currentMessage: '',
      error: null
    }
  }

  async processUserMessage(message: string): Promise<void> {
    try {
      this.updateState({
        isProcessing: true,
        currentMessage: message,
        error: null
      })

      this.emit('messageReceived', { message, sender: 'user' })

      // Generate LLM response
      const response = await this.llmService.generateResponse(message)
      
      this.emit('messageReceived', { message: response, sender: 'assistant' })

      // Convert response to speech
      await this.speakResponse(response)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      this.updateState({ 
        error: errorMessage,
        isProcessing: false 
      })
      this.emit('error', { error: errorMessage })
    }
  }

  async *processUserMessageStream(message: string): AsyncGenerator<{ type: 'text' | 'audio', content: string }, void, unknown> {
    try {
      this.updateState({
        isProcessing: true,
        currentMessage: message,
        error: null
      })

      this.emit('messageReceived', { message, sender: 'user' })

      let fullResponse = ''
      let sentenceBuffer = ''
      
      // Stream LLM response
      for await (const chunk of this.llmService.generateResponseStream(message)) {
        fullResponse += chunk
        sentenceBuffer += chunk
        
        yield { type: 'text', content: chunk }

        // Check for sentence completion
        if (this.isSentenceComplete(sentenceBuffer)) {
          // Generate TTS for completed sentence
          await this.speakResponse(sentenceBuffer.trim())
          yield { type: 'audio', content: sentenceBuffer.trim() }
          sentenceBuffer = ''
        }
      }

      // Handle any remaining text
      if (sentenceBuffer.trim()) {
        await this.speakResponse(sentenceBuffer.trim())
        yield { type: 'audio', content: sentenceBuffer.trim() }
      }

      this.emit('messageReceived', { message: fullResponse, sender: 'assistant' })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      this.updateState({ 
        error: errorMessage,
        isProcessing: false 
      })
      this.emit('error', { error: errorMessage })
    }
  }

  private async speakResponse(text: string): Promise<void> {
    try {
      this.updateState({ isSpeaking: true })
      this.emit('speechStart', { text })
      
      await this.ttsService.synthesizeSpeech(text)
      
      this.updateState({ 
        isSpeaking: false,
        isProcessing: false 
      })
      this.emit('speechEnd', { text })
      
    } catch (error) {
      this.updateState({ 
        isSpeaking: false,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'TTS error occurred'
      })
      this.emit('error', { error })
    }
  }

  private isSentenceComplete(text: string): boolean {
    // Simple sentence boundary detection
    const trimmed = text.trim()
    return /[.!?]$/.test(trimmed) && trimmed.length > 10
  }

  stopSpeaking(): void {
    this.ttsService.stopPlayback()
    this.updateState({ 
      isSpeaking: false,
      isProcessing: false 
    })
    this.emit('speechEnd', {})
  }

  pauseSpeaking(): void {
    this.ttsService.stopPlayback()
    this.updateState({ isSpeaking: false })
  }

  resumeSpeaking(): void {
    this.ttsService.resumePlayback()
    this.updateState({ isSpeaking: true })
  }

  startListening(): void {
    this.updateState({ isListening: true })
  }

  stopListening(): void {
    this.updateState({ isListening: false })
  }

  getConversationHistory() {
    return this.llmService.getConversationHistory()
  }

  clearConversation(): void {
    this.llmService.clearConversation()
    this.updateState({
      isProcessing: false,
      isSpeaking: false,
      isListening: false,
      currentMessage: '',
      error: null
    })
  }

  getState(): ConversationState {
    return { ...this.state }
  }

  private updateState(updates: Partial<ConversationState>): void {
    this.state = { ...this.state, ...updates }
    this.emit('stateChange', this.state)
  }

  addEventListener(type: AssistantEventType, listener: (event: AssistantEvent) => void): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, [])
    }
    this.eventListeners.get(type)!.push(listener)
  }

  removeEventListener(type: AssistantEventType, listener: (event: AssistantEvent) => void): void {
    const listeners = this.eventListeners.get(type)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(type: AssistantEventType, data?: any): void {
    const listeners = this.eventListeners.get(type)
    if (listeners) {
      const event: AssistantEvent = { type, data }
      listeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error('Event listener error:', error)
        }
      })
    }
  }

  async updateLLMConfig(config: Partial<AssistantConfig['llm']>): Promise<void> {
    this.llmService.updateConfig(config)
  }

  async updateTTSConfig(config: Partial<AssistantConfig['tts']>): Promise<void> {
    this.ttsService.updateConfig(config)
  }

  async getAvailableVoices(): Promise<string[]> {
    return await this.ttsService.getAvailableVoices()
  }
}