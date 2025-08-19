import { NextRequest, NextResponse } from 'next/server'

// Issues ephemeral Realtime tokens for client-side WebRTC sessions.
// Requires server env var `OPENAI_API_KEY`.
// The client uses this short‑lived token to connect without exposing secrets.

export async function GET(_req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Server OPENAI_API_KEY is not configured' },
        { status: 500 }
      )
    }

    // Create an ephemeral session with desired defaults.
    // Model string reflects current Realtime preview naming; adjust as needed.
    const body = {
      model: 'gpt-4o-realtime-preview-2025-06-03',
      voice: 'alloy',
      modalities: ['audio', 'text'],
      // WebRTC prefers linear PCM; use a supported format per API docs
      input_audio_format: 'pcm16',
      output_audio_format: 'pcm16',
      // Keep persona concise; detailed instructions live client-side as needed
      instructions:
        "You are Maya, SkyBooker’s friendly travel assistant. Help users search and book flights. Confirm important details clearly and keep responses concise.",
    }

    const resp = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!resp.ok) {
      const text = await resp.text()
      console.error('Failed to create ephemeral session:', resp.status, text)
      return NextResponse.json(
        { error: 'Failed to create ephemeral session' },
        { status: 500 }
      )
    }

    const data = await resp.json()
    // The Agents API returns a `client_secret` for client use.
    // Return only what the client needs.
    return NextResponse.json({
      client_secret: data.client_secret,
      id: data.id,
      model: data.model,
      expires_at: data.expires_at,
    })
  } catch (err) {
    console.error('Ephemeral session error:', err)
    return NextResponse.json(
      { error: 'Internal error creating session' },
      { status: 500 }
    )
  }
}
