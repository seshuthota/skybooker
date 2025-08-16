export interface LLMProvider {
  id: string
  name: string
  baseUrl: string
  models: ModelOption[]
  defaultModel: string
  apiKeyEnvVar: string
  maxTokensParam: 'max_tokens' | 'max_completion_tokens'
  supportsStreaming: boolean
  defaultParams: {
    temperature: number
    maxTokens: number
    topP?: number
    stop?: string | null
  }
}

export interface ModelOption {
  value: string
  label: string
  maxTokens?: number
  description?: string
}

export const PROVIDERS: Record<string, LLMProvider> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      { value: 'gpt-4o', label: 'GPT-4o', maxTokens: 4096, description: 'Latest multimodal model' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', maxTokens: 4096, description: 'High-performance model' },
      { value: 'gpt-4', label: 'GPT-4', maxTokens: 8192, description: 'Advanced reasoning' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', maxTokens: 4096, description: 'Fast and efficient' },
    ],
    defaultModel: 'gpt-3.5-turbo',
    apiKeyEnvVar: 'OPENAI_API_KEY',
    maxTokensParam: 'max_tokens',
    supportsStreaming: true,
    defaultParams: {
      temperature: 0.7,
      maxTokens: 1000
    }
  },

  groq: {
    id: 'groq',
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: [
      { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B', maxTokens: 1024, description: 'Fast inference' },
      { value: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B', maxTokens: 1024, description: 'High performance' },
      { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B', maxTokens: 32768, description: 'Large context' },
      { value: 'gemma2-9b-it', label: 'Gemma2 9B', maxTokens: 1024, description: 'Google model' },
    ],
    defaultModel: 'llama-3.1-8b-instant',
    apiKeyEnvVar: 'GROQ_API_KEY',
    maxTokensParam: 'max_completion_tokens',
    supportsStreaming: true,
    defaultParams: {
      temperature: 1,
      maxTokens: 1024,
      topP: 1,
      stop: null
    }
  },

  anthropic: {
    id: 'anthropic',
    name: 'Anthropic (via OpenAI-compatible)',
    baseUrl: 'https://api.anthropic.com/v1',
    models: [
      { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', maxTokens: 4096, description: 'Latest model' },
      { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus', maxTokens: 4096, description: 'Most capable' },
      { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet', maxTokens: 4096, description: 'Balanced' },
      { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku', maxTokens: 4096, description: 'Fast' },
    ],
    defaultModel: 'claude-3-5-sonnet-20241022',
    apiKeyEnvVar: 'ANTHROPIC_API_KEY',
    maxTokensParam: 'max_tokens',
    supportsStreaming: true,
    defaultParams: {
      temperature: 0.7,
      maxTokens: 1000
    }
  },

  custom: {
    id: 'custom',
    name: 'Custom Provider',
    baseUrl: process.env.LLM_BASE_URL || 'http://localhost:1234/v1',
    models: [
      { value: 'custom-model', label: 'Custom Model', description: 'User-defined model' }
    ],
    defaultModel: 'custom-model',
    apiKeyEnvVar: 'LLM_API_KEY',
    maxTokensParam: 'max_tokens',
    supportsStreaming: true,
    defaultParams: {
      temperature: 0.7,
      maxTokens: 1000
    }
  }
}

export function getProviderById(providerId: string): LLMProvider | undefined {
  return PROVIDERS[providerId]
}

export function detectProviderFromUrl(baseUrl: string): LLMProvider | undefined {
  for (const provider of Object.values(PROVIDERS)) {
    if (baseUrl.includes(provider.baseUrl) || baseUrl.includes(provider.id)) {
      return provider
    }
  }
  return undefined
}

export function getAvailableProviders(): LLMProvider[] {
  return Object.values(PROVIDERS)
}

export function getModelsForProvider(providerId: string): ModelOption[] {
  const provider = getProviderById(providerId)
  return provider?.models || []
}

// Helper function to validate if a model is supported by a provider
export function isModelSupportedByProvider(model: string, providerId: string): boolean {
  const provider = getProviderById(providerId)
  if (!provider) return false
  
  return provider.models.some(m => m.value === model)
}

// Helper to get default model for provider
export function getDefaultModelForProvider(providerId: string): string {
  const provider = getProviderById(providerId)
  return provider?.defaultModel || 'gpt-3.5-turbo'
}