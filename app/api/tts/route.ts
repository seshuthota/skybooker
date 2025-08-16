import { NextRequest, NextResponse } from 'next/server'

interface TTSRequest {
  text: string
  voice?: string
  speed?: number
  format?: string
}

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'af_heart', speed = 1.0, format = 'mp3' }: TTSRequest = await request.json()

    if (!text?.trim()) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    const kokoriUrl = process.env.KOKORI_API_URL || 'http://localhost:8000'
    const kokoriKey = process.env.KOKORI_API_KEY

    const ttsRequest = {
      model: 'kokoro',
      input: text,
      voice,
      response_format: format,
      speed,
      stream: false
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (kokoriKey) {
      headers['Authorization'] = `Bearer ${kokoriKey}`
    }

    const response = await fetch(`${kokoriUrl}/v1/audio/speech`, {
      method: 'POST',
      headers,
      body: JSON.stringify(ttsRequest)
    })

    if (!response.ok) {
      if (response.status === 404 || response.status === 500) {
        // Kokori service not available, return success without audio
        return NextResponse.json({
          success: true,
          message: 'TTS service not available, text-only mode',
          audio: null
        })
      }
      throw new Error(`TTS API error: ${response.status} ${response.statusText}`)
    }

    // Check if response is actually audio
    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('audio') && !contentType?.includes('application/octet-stream')) {
      // Not audio data, probably an error response
      return NextResponse.json({
        success: true,
        message: 'TTS service returned non-audio response, text-only mode',
        audio: null
      })
    }

    const audioBuffer = await response.arrayBuffer()
    
    return new Response(audioBuffer, {
      headers: {
        'Content-Type': `audio/${format}`,
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache',
      },
    })

  } catch (error) {
    console.error('TTS API error:', error)
    // Return success without audio instead of failing
    return NextResponse.json({
      success: true,
      message: 'TTS service unavailable, continuing with text-only mode',
      audio: null
    })
  }
}