"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { RealtimeClient } from '@/lib/voice/realtime-client'
import { assistantTools } from '@/lib/assistant/tools'

export type ConnectionState =
  | 'idle'
  | 'initializing'
  | 'connecting'
  | 'connected'
  | 'ready'
  | 'reconnecting'
  | 'disconnected'
  | 'error'

export interface TranscriptItem {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface UseRealtimeSessionOptions {
  userId?: string
}

export function useRealtimeSession(options: UseRealtimeSessionOptions = {}) {
  const { userId = 'guest' } = options
  const [status, setStatus] = useState<ConnectionState>('idle')
  const [listening, setListening] = useState(false)
  const [muted, setMuted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<TranscriptItem[]>([])
  const [audioLevel, setAudioLevel] = useState(0)
  const clientRef = useRef<RealtimeClient | null>(null)
  const toolSeen = useRef<Set<string>>(new Set())

  const append = useCallback((item: TranscriptItem) => {
    setTranscript(prev => [...prev, item])
  }, [])

  const connect = useCallback(async () => {
    setError(null)
    setStatus('initializing')

    try {
      // In local test mode, skip token fetch
      let token: string | undefined
      const isLocalTest = typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_REALTIME_TEST === 'local' || process.env.NODE_ENV === 'test')
      if (isLocalTest) {
        token = 'local-test-token'
      } else {
        const r = await fetch('/api/session', { method: 'GET' })
        if (!r.ok) {
          throw new Error(`Failed to fetch ephemeral token: ${r.status}`)
        }
        const data = await r.json()
        token = data?.client_secret?.value || data?.client_secret
        if (!token) {
          throw new Error('No client_secret returned from /api/session')
        }
      }

      // Initialize our existing RealtimeClient wrapper with the ephemeral token
      const client = new RealtimeClient(token, userId)

      // Bridge events to local state
      client.on('all', (evt: any) => {
        switch (evt.type) {
          case 'CONNECTING':
            setStatus('connecting')
            break
          case 'CONNECT_SUCCESS':
            setStatus('connected')
            break
          case 'CONNECTION_READY':
            setStatus('ready')
            break
          case 'RECONNECTING':
            setStatus('reconnecting')
            break
          case 'DISCONNECT':
            setStatus('disconnected')
            break
          case 'ERROR':
          case 'CONNECT_ERROR':
            setStatus('error')
            setError(evt.error?.message || 'Unknown error')
            break
          case 'MESSAGE_RECEIVED':
            // Our RealtimeClient emits ConversationMessage with `type` not `role`.
            // Accept either for safety.
            if ((evt.message?.type || evt.message?.role) && evt.message?.content) {
              const r = (evt.message.type || evt.message.role) as 'user' | 'assistant' | 'system'
              if (r === 'user' || r === 'assistant') {
                append({
                  role: r,
                  content: evt.message.content,
                  timestamp: Date.now(),
                })
              }
            }
            break
          case 'START_LISTENING':
            setListening(true)
            break
          case 'STOP_LISTENING':
            setListening(false)
            break
          case 'AUDIO_LEVEL_UPDATE':
            if (typeof evt.level === 'number') {
              const clamped = Math.max(0, Math.min(1, evt.level))
              setAudioLevel(clamped)
            }
            break
          case 'TOOL_CALL': {
            // Emit tool activity as assistant messages in the same stream
            const { itemId, status, name, arguments: args, output } = evt
            const key = `${itemId}:${status}`
            if (toolSeen.current.has(key)) break
            toolSeen.current.add(key)

            if (status === 'in_progress') {
              const argStr = typeof args === 'string' ? args : JSON.stringify(args)
              append({
                role: 'assistant',
                content: `Calling tool ${name} with ${argStr}`,
                timestamp: Date.now(),
              })
            } else if (status === 'completed') {
              let summary = ''
              try {
                const o = typeof output === 'string' ? JSON.parse(output) : output
                if (o) {
                  const results = Array.isArray(o) ? o : (Array.isArray(o?.results) ? o.results : null)
                  if (results) summary = ` (${results.length} result${results.length === 1 ? '' : 's'})`
                }
              } catch {}
              append({
                role: 'assistant',
                content: `Tool ${name} completed${summary}`,
                timestamp: Date.now(),
              })
            }
            break
          }
          default:
            break
        }
      })

      clientRef.current = client

      // Minimal session config; server VAD enabled so no push‑to‑talk is required
      await client.connect({
        model: 'gpt-4o-realtime-preview',
        voice: 'alloy',
        temperature: 0.7,
        tools: assistantTools as any,
        turn_detection: {
          type: 'server_vad',
          // Tuned for typical office noise; adjust per environment
          threshold: 0.6,
          prefix_padding_ms: 200,
          silence_duration_ms: 650,
        },
      } as any)

      // Begin continuous listening; VAD will segment user turns automatically
      try {
        client.startListening()
        setListening(true)
      } catch (e) {
        console.warn('[useRealtimeSession] failed to auto-start listening', e)
      }
    } catch (e: any) {
      console.error('[useRealtimeSession] connect error', e)
      setError(e?.message || 'Failed to connect')
      setStatus('error')
    }
  }, [append, userId])

  const disconnect = useCallback(async () => {
    try {
      clientRef.current?.disconnect()
      setStatus('disconnected')
      setListening(false)
    } catch (e) {
      console.error('[useRealtimeSession] disconnect error', e)
    }
  }, [])

  const startListening = useCallback(async () => {
    try {
      clientRef.current?.startListening()
      setListening(true)
    } catch (e) {
      console.error('[useRealtimeSession] startListening error', e)
    }
  }, [])

  const stopListening = useCallback(async () => {
    try {
      clientRef.current?.stopListening()
      setListening(false)
    } catch (e) {
      console.error('[useRealtimeSession] stopListening error', e)
    }
  }, [])

  const sendText = useCallback(async (text: string) => {
    try {
      if (!clientRef.current || !(status === 'connected' || status === 'ready')) {
        await connect()
      }
      clientRef.current?.sendText(text)
    } catch (e) {
      console.error('[useRealtimeSession] sendText error', e)
    }
  }, [connect, status])

  const toggleListening = useCallback(async () => {
    if (listening) {
      await stopListening()
    } else {
      await startListening()
    }
  }, [listening, startListening, stopListening])

  const toggleMute = useCallback(() => {
    setMuted(v => !v)
    // If the underlying client adds mute, wire it here.
    // clientRef.current?.mute?.(true/false)
  }, [])

  useEffect(() => {
    return () => {
      try { clientRef.current?.disconnect() } catch {}
    }
  }, [])

  return {
    status,
    listening,
    muted,
    error,
    transcript,
    audioLevel,
    connect,
    disconnect,
    startListening,
    stopListening,
    toggleListening,
    toggleMute,
    sendText,
  }
}
