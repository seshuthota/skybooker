import { NextRequest, NextResponse } from 'next/server'
import { getAssistantConfig, getSystemPromptWithUser } from '@/lib/config/assistant-config'
import { getAllFunctionDefinitions } from '@/lib/functions'
import { executeFunctionCall } from '@/lib/services/function-executor'
import { registerAllFunctionHandlers } from '@/lib/functions/handlers'

// Ensure function handlers are registered
registerAllFunctionHandlers()

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
}

interface ChatRequest {
  message: string
  messages?: ChatMessage[]
  stream?: boolean
  user?: User | null
}

export async function POST(request: NextRequest) {
  // Get provider-aware configuration
  const config = getAssistantConfig()
  
  try {
    const { message, messages = [], stream = false, user = null }: ChatRequest = await request.json()

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }
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

    // Build conversation messages
    const conversationMessages: ChatMessage[] = []
    
    // Always start with system prompt (with user context if available)
    const systemPrompt = user ? getSystemPromptWithUser(user) : config.llm.systemPrompt
    conversationMessages.push({ role: 'system', content: systemPrompt })
    
    // Add conversation history if provided (but skip system messages from history to avoid duplicates)
    const historyMessages = messages.filter(msg => msg.role !== 'system')
    conversationMessages.push(...historyMessages)
    
    // Add current user message
    conversationMessages.push({ role: 'user', content: message })

    // Get function definitions for function calling
    const functions = getAllFunctionDefinitions()
    
    // Build request payload with provider-specific parameters
    const chatRequest: any = {
      model,
      messages: conversationMessages,
      tools: functions.map(func => ({
        type: 'function',
        function: {
          name: func.name,
          description: func.description,
          parameters: func.parameters
        }
      })),
      tool_choice: 'auto',
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
      let errorText = '';
      try {
        errorText = await response.text()
      } catch (e) {
        errorText = 'Unable to read error response'
      }
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
      const choice = data.choices[0]
      const message = choice?.message
      
      // Check if the assistant wants to call a function
      let functionCall = null
      let toolCallId = null
      
      if (message?.tool_calls && message.tool_calls.length > 0) {
        // Standard OpenAI format
        const toolCall = message.tool_calls[0]
        functionCall = toolCall.function
        toolCallId = toolCall.id
      } else if (message?.content && typeof message.content === 'string') {
        // Fallback: Parse function calls from content (for providers like Groq)
        // Pattern matches: /function functionName>{"param":"value"}<function or <function=functionName>{"param":"value"}</function>
        const functionCallMatch = message.content.match(/(?:\/function\s+|<function=)(\w+)(?:>|\s*>)\s*({[^<]*})(?:<\/?\w*>?|<function)?/i)
        if (functionCallMatch) {
          const [, functionName, argsJson] = functionCallMatch
          console.log('[FUNCTION_FALLBACK] Detected function call:', functionName, argsJson)
          functionCall = {
            name: functionName,
            arguments: argsJson
          }
          toolCallId = `fallback_${Date.now()}`
        } else {
          console.log('[FUNCTION_FALLBACK] No function call detected in content:', message.content.substring(0, 200))
        }
      }
      
      if (functionCall) {
        console.log('[CHAT_API] Function call detected:', {
          name: functionCall.name,
          arguments: functionCall.arguments,
          user: user ? `${user.firstName} ${user.lastName} (${user.id})` : 'null'
        })
        
        try {
          const parsedParameters = JSON.parse(functionCall.arguments || '{}')
          console.log('[CHAT_API] Parsed parameters:', JSON.stringify(parsedParameters, null, 2))
          
          // Execute the function call with user context
          const functionResult = await executeFunctionCall(
            {
              name: functionCall.name,
              parameters: parsedParameters
            },
            request,
            { user }
          )
          
          if (functionResult.success) {
            // Add function call and result to conversation and get final response
            const assistantMessage = message?.tool_calls ? 
              { role: 'assistant', content: null, tool_calls: message.tool_calls } :
              { role: 'assistant', content: `Calling function ${functionCall.name}...` }
            
            const functionMessages = [
              ...conversationMessages,
              assistantMessage,
              { 
                role: 'tool', 
                content: JSON.stringify(functionResult.result?.data),
                tool_call_id: toolCallId
              }
            ]
            
            // Make another API call to get the final response (without tools to prevent more function calls)
            const finalRequest = {
              ...chatRequest,
              messages: functionMessages,
              tools: undefined, // Remove tools so LLM can't make more function calls
              tool_choice: undefined
            }
            
            const finalResponse = await fetch(`${baseUrl}/chat/completions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
              },
              body: JSON.stringify(finalRequest)
            })
            
            if (finalResponse.ok) {
              const finalData = await finalResponse.json()
              return NextResponse.json({
                message: finalData.choices[0]?.message?.content || '',
                usage: finalData.usage,
                provider: provider.name,
                model,
                function_call: {
                  name: functionCall.name,
                  result: functionResult.result?.data
                }
              })
            }
          } else {
            return NextResponse.json({
              message: `I apologize, but I encountered an error while processing your request: ${functionResult.error?.message}`,
              usage: data.usage,
              provider: provider.name,
              model
            })
          }
        } catch (error) {
          console.error('Function execution error:', error)
          return NextResponse.json({
            message: 'I apologize, but I encountered an error while processing your request. Please try again.',
            usage: data.usage,
            provider: provider.name,
            model
          })
        }
      }
      
      // No function call, return regular response
      return NextResponse.json({
        message: message?.content || '',
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