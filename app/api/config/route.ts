import { NextRequest, NextResponse } from 'next/server'
import { getAssistantConfig } from '@/lib/config/assistant-config'

export async function GET(request: NextRequest) {
  try {
    const config = getAssistantConfig()
    
    // Return safe configuration info (without API keys)
    return NextResponse.json({
      provider: {
        id: config.llm.provider.id,
        name: config.llm.provider.name,
        baseUrl: config.llm.baseUrl,
        maxTokensParam: config.llm.provider.maxTokensParam,
        supportsStreaming: config.llm.provider.supportsStreaming
      },
      model: config.llm.model,
      maxTokens: config.llm.maxTokens,
      temperature: config.llm.temperature,
      topP: config.llm.topP,
      stop: config.llm.stop,
      hasApiKey: config.llm.apiKey !== 'demo_key_for_development',
      availableModels: config.llm.provider.models.map(m => ({
        value: m.value,
        label: m.label,
        description: m.description
      })),
      tts: {
        apiUrl: config.tts.apiUrl,
        voice: config.tts.voice,
        hasApiKey: !!config.tts.apiKey && config.tts.apiKey !== 'demo_key_for_development'
      }
    })
  } catch (error) {
    console.error('Config API error:', error)
    return NextResponse.json(
      { error: 'Failed to get configuration' },
      { status: 500 }
    )
  }
}