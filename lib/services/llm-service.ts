interface LLMConfig {
  apiKey: string
  baseUrl?: string
  model: string
  maxTokens: number
  temperature: number
  systemPrompt: string
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  timestamp?: number
}

interface LLMRequest {
  model: string
  messages: ChatMessage[]
  max_tokens: number
  temperature: number
  stream: boolean
}

interface LLMResponse {
  choices: {
    message: {
      content: string
      role: string
    }
    delta?: {
      content?: string
    }
  }[]
}

export class LLMService {
  private config: LLMConfig
  private conversationHistory: ChatMessage[] = []

  constructor(config: LLMConfig) {
    this.config = config
    this.initializeConversation()
  }

  private initializeConversation(): void {
    this.conversationHistory = [
      {
        role: 'system',
        content: this.config.systemPrompt,
        timestamp: Date.now()
      }
    ]
  }

  async generateResponse(userMessage: string, stream = false): Promise<string> {
    const userMsg: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    }

    this.conversationHistory.push(userMsg)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage,
          stream
        })
      })

      if (!response.ok) {
        throw new Error(`LLM request failed: ${response.status} ${response.statusText}`)
      }

      if (stream) {
        return await this.handleStreamingResponse(response)
      } else {
        const data = await response.json()
        const content = data.message || ''

        // Add assistant response to conversation history
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content,
          timestamp: Date.now()
        }
        this.conversationHistory.push(assistantMsg)

        return content
      }
    } catch (error) {
      console.error('LLM generation failed:', error)
      throw error
    }
  }

  async *generateResponseStream(userMessage: string): AsyncGenerator<string, void, unknown> {
    const userMsg: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    }

    this.conversationHistory.push(userMsg)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage,
          stream: true
        })
      })

      if (!response.ok) {
        throw new Error(`LLM request failed: ${response.status} ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ''

      if (!reader) {
        throw new Error('No response body available')
      }

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue

              try {
                const parsed: LLMResponse = JSON.parse(data)
                const content = parsed.choices[0]?.delta?.content
                if (content) {
                  fullResponse += content
                  yield content
                }
              } catch (e) {
                // Skip invalid JSON chunks
              }
            }
          }
        }

        // Add assistant response to conversation history
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: fullResponse,
          timestamp: Date.now()
        }
        this.conversationHistory.push(assistantMsg)

      } finally {
        reader.releaseLock()
      }
    } catch (error) {
      console.error('LLM streaming failed:', error)
      throw error
    }
  }

  private async handleStreamingResponse(response: Response): Promise<string> {
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''

    if (!reader) {
      throw new Error('No response body available')
    }

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed: LLMResponse = JSON.parse(data)
              const content = parsed.choices[0]?.delta?.content
              if (content) {
                fullResponse += content
              }
            } catch (e) {
              // Skip invalid JSON chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    // Add assistant response to conversation history
    const assistantMsg: ChatMessage = {
      role: 'assistant',
      content: fullResponse,
      timestamp: Date.now()
    }
    this.conversationHistory.push(assistantMsg)

    return fullResponse
  }

  private async handleStaticResponse(response: Response): Promise<string> {
    const data: LLMResponse = await response.json()
    const content = data.choices[0]?.message?.content || ''

    // Add assistant response to conversation history
    const assistantMsg: ChatMessage = {
      role: 'assistant',
      content,
      timestamp: Date.now()
    }
    this.conversationHistory.push(assistantMsg)

    return content
  }

  getConversationHistory(): ChatMessage[] {
    return [...this.conversationHistory]
  }

  clearConversation(): void {
    this.initializeConversation()
  }

  updateConfig(newConfig: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...newConfig }
    if (newConfig.systemPrompt) {
      this.initializeConversation()
    }
  }

  removeLastUserMessage(): void {
    const lastMessage = this.conversationHistory[this.conversationHistory.length - 1]
    if (lastMessage && lastMessage.role === 'user') {
      this.conversationHistory.pop()
    }
  }
}