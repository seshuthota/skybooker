import { PROVIDERS, getProviderById, detectProviderFromUrl, getDefaultModelForProvider, isModelSupportedByProvider, type LLMProvider } from './providers'

export interface AssistantConfiguration {
  llm: {
    provider: LLMProvider
    apiKey: string
    baseUrl: string
    model: string
    maxTokens: number
    temperature: number
    topP?: number
    stop?: string | null
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

export const getAssistantConfig = (): AssistantConfiguration => {
  // Helper function to safely parse numbers with fallback
  const safeParseInt = (value: string | undefined, fallback: number): number => {
    if (!value) return fallback
    const parsed = parseInt(value)
    return isNaN(parsed) ? fallback : parsed
  }

  const safeParseFloat = (value: string | undefined, fallback: number): number => {
    if (!value) return fallback
    const parsed = parseFloat(value)
    return isNaN(parsed) ? fallback : parsed
  }

  // Detect provider from environment
  const providerId = process.env.LLM_PROVIDER || 'openai'
  const baseUrl = process.env.LLM_BASE_URL
  
  // Get provider configuration
  let provider = getProviderById(providerId)
  
  // If provider not found or custom provider, detect from base URL
  if (!provider || providerId === 'custom') {
    if (baseUrl) {
      provider = detectProviderFromUrl(baseUrl) || PROVIDERS.custom
      // Update custom provider with actual base URL
      if (provider.id === 'custom') {
        provider = { ...provider, baseUrl }
      }
    } else {
      provider = PROVIDERS.openai // fallback
    }
  }

  // Get API key for the provider
  const getApiKey = (provider: LLMProvider): string => {
    // First try the generic LLM_API_KEY
    const genericKey = process.env.LLM_API_KEY
    if (genericKey && genericKey !== 'demo_key_for_development') {
      return genericKey
    }
    
    // Then try provider-specific key
    const providerKey = process.env[provider.apiKeyEnvVar]
    if (providerKey) {
      return providerKey
    }

    // Fallback to demo key
    return 'demo_key_for_development'
  }

  // Get model and validate it's supported by the provider
  const envModel = process.env.LLM_MODEL
  let model = envModel || provider.defaultModel
  
  // Validate model is supported by provider
  if (envModel && !isModelSupportedByProvider(envModel, provider.id)) {
    console.warn(`Model ${envModel} not supported by provider ${provider.name}, using default: ${provider.defaultModel}`)
    model = provider.defaultModel
  }

  const config: AssistantConfiguration = {
    llm: {
      provider,
      apiKey: getApiKey(provider),
      baseUrl: baseUrl || provider.baseUrl,
      model,
      maxTokens: safeParseInt(process.env.LLM_MAX_TOKENS, provider.defaultParams.maxTokens),
      temperature: safeParseFloat(process.env.LLM_TEMPERATURE, provider.defaultParams.temperature),
      topP: provider.defaultParams.topP,
      stop: provider.defaultParams.stop,
      systemPrompt: getSystemPrompt()
    },
    tts: {
      apiUrl: process.env.KOKORI_API_URL || 'http://localhost:8880',
      apiKey: process.env.KOKORI_API_KEY || undefined,
      voice: process.env.TTS_VOICE || 'af_heart',
      speed: safeParseFloat(process.env.TTS_SPEED, 1.0),
      responseFormat: (process.env.TTS_FORMAT as any) || 'mp3',
      stream: process.env.TTS_STREAM !== 'false'
    }
  }

  return config
}

function getSystemPrompt(): string {
  return `You are Maya, a helpful AI assistant for SkyBooker, a flight booking platform.

INTERFACE KNOWLEDGE:
SkyBooker's homepage features:
- Flight search form with "From" and "To" city fields
- Departure and Return date selectors  
- "Search Flights" button (green button to start search)
- Round Trip/One Way radio buttons
- Passengers dropdown (1 Passenger default)
- Class selection dropdown (Economy default)
- Navigation menu: Flights, Hotels, Car Rentals, Deals
- Featured Flight Deals section with discounted destinations

ASSISTANCE GUIDELINES:
For flight searches: Direct users to "fill out the search form on the homepage and click the green 'Search Flights' button"
For travel planning: Reference the From/To fields, date selectors, and trip type options
For deals: Mention the "Featured Flight Deals" section below the search form
For packages: Suggest exploring Hotels and Car Rentals for complete travel packages

Keep responses:
- Short and actionable (1-2 sentences when possible)
- Specific to actual UI elements users can see
- Friendly and travel-focused
- Helpful for planning with SkyBooker

NEVER mention "search tabs" - only reference the search form and "Search Flights" button that actually exist on the interface.

Help users navigate SkyBooker's actual features to find great flight deals and plan their perfect trip!`
}

export const VOICE_OPTIONS = [
  { value: 'af_bella', label: 'Bella (Female)' },
  { value: 'af_sky', label: 'Sky (Female)' },
  { value: 'af_heart', label: 'Heart (Female)' },
  { value: 'am_adam', label: 'Adam (Male)' },
  { value: 'am_michael', label: 'Michael (Male)' },
  { value: 'bf_emma', label: 'Emma (British Female)' },
  { value: 'bm_george', label: 'George (British Male)' },
  // Voice combinations
  { value: 'af_bella(2)+af_sky(1)', label: 'Bella + Sky Mix' },
  { value: 'af_heart(1)+af_bella(1)', label: 'Heart + Bella Mix' },
  { value: 'am_adam(2)+am_michael(1)', label: 'Adam + Michael Mix' }
]

// Get model options for current provider
export const getModelOptions = () => {
  const config = getAssistantConfig()
  return config.llm.provider.models
}

// Get all available model options (for settings/configuration UI)
export const getAllModelOptions = () => {
  const allModels = []
  for (const provider of Object.values(PROVIDERS)) {
    allModels.push(...provider.models.map(model => ({
      ...model,
      provider: provider.name
    })))
  }
  return allModels
}

export const RESPONSE_FORMATS = [
  { value: 'mp3', label: 'MP3' },
  { value: 'wav', label: 'WAV' },
  { value: 'opus', label: 'Opus' },
  { value: 'flac', label: 'FLAC' }
] as const