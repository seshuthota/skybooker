import { NextRequest, NextResponse } from 'next/server'
import { getAssistantConfig } from '@/lib/config/assistant-config'

interface ChatRequest {
  message: string
  stream?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const { message, stream = false }: ChatRequest = await request.json()

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get provider-aware configuration
    const config = getAssistantConfig()
    const { provider, apiKey, baseUrl, model, maxTokens, temperature, topP, stop } = config.llm

    if (!apiKey || apiKey === 'demo_key_for_development') {
      // Return mock response for development
      const mockResponse = `Hello! I'm Maya, your AI travel assistant for SkyBooker. 

I'd love to help you with your travel needs, but I'm currently running in demo mode since the ${provider.name} API key isn't configured.

Current provider: ${provider.name}
Model: ${model}

I can assist you with:
- Flight search and booking questions
- Travel recommendations and tips  
- Account management help
- General customer support

To enable full AI functionality, please configure your ${provider.name} API key in the environment variables.

How can I help you plan your next adventure with SkyBooker?`

      return NextResponse.json({
        message: mockResponse,
        usage: { total_tokens: 100 },
        provider: provider.name,
        model
      })
    }

    // Build request payload with provider-specific parameters
    const chatRequest: any = {
      model,
      messages: [
        { role: 'system', content: config.llm.systemPrompt },
        { role: 'user', content: message }
      ],
      temperature,
      stream
    }

    // Add provider-specific parameters
    if (provider.maxTokensParam === 'max_completion_tokens') {
      chatRequest.max_completion_tokens = maxTokens
    } else {
      chatRequest.max_tokens = maxTokens
    }

    // Add optional parameters if they exist
    if (topP !== undefined) {
      chatRequest.top_p = topP
    }
    
    if (stop !== undefined) {
      chatRequest.stop = stop
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(chatRequest)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`${provider.name} API error:`, response.status, errorText)
      throw new Error(`${provider.name} API error: ${response.status} ${response.statusText}`)
    }

    if (stream) {
      // Return streaming response
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    } else {
      // Return regular JSON response
      const data = await response.json()
      return NextResponse.json({
        message: data.choices[0]?.message?.content || '',
        usage: data.usage,
        provider: provider.name,
        model
      })
    }

  } catch (error) {
    console.error(`Chat API error (${config.llm.provider.name}):`, error)
    return NextResponse.json(
      { 
        error: `Failed to process chat request with ${config.llm.provider.name}`,
        provider: config.llm.provider.name,
        model: config.llm.model
      },
      { status: 500 }
    )
  }
}