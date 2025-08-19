"use client"

import { useMemo, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX } from 'lucide-react'
import { useRealtimeSession } from '@/app/hooks/useRealtimeSession'

interface VoiceWidgetProps {
  className?: string
  onNewTurn?: (item: { role: 'user' | 'assistant'; content: string; timestamp: number }) => void
}

export function VoiceWidget({ className = '', onNewTurn }: VoiceWidgetProps) {
  const {
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
  } = useRealtimeSession()

  // Bridge new transcript items to parent consumers (e.g., chat widget)
  const lastCountRef = useRef(0)
  useEffect(() => {
    if (!onNewTurn) return
    if (transcript.length > lastCountRef.current) {
      const newItems = transcript.slice(lastCountRef.current)
      lastCountRef.current = transcript.length
      newItems.forEach(onNewTurn)
    }
  }, [transcript, onNewTurn])

  const statusBadge = useMemo(() => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-green-600">Ready</Badge>
      case 'connected':
        return <Badge className="bg-blue-600">Connected</Badge>
      case 'connecting':
        return <Badge className="bg-yellow-600">Connecting…</Badge>
      case 'reconnecting':
        return <Badge className="bg-orange-600">Reconnecting…</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      case 'disconnected':
        return <Badge variant="secondary">Disconnected</Badge>
      default:
        return <Badge variant="secondary">Idle</Badge>
    }
  }, [status])

  const isConnected = status === 'connected' || status === 'ready'

  return (
    <Card className={`p-3 flex flex-col gap-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="font-semibold text-sm">Voice Session</div>
        <div className="flex items-center gap-2">{statusBadge}</div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        {!isConnected ? (
          <Button size="sm" onClick={connect}>
            <Phone className="w-4 h-4 mr-2" /> Connect
          </Button>
        ) : (
          <Button size="sm" variant="destructive" onClick={disconnect}>
            <PhoneOff className="w-4 h-4 mr-2" /> Disconnect
          </Button>
        )}

        <Button
          size="sm"
          variant={muted ? 'destructive' : 'outline'}
          onClick={toggleMute}
          disabled={!isConnected}
        >
          {muted ? <VolumeX className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />} 
          {muted ? 'Muted' : 'Mute'}
        </Button>

        <Button
          size="sm"
          onClick={toggleListening}
          disabled={!isConnected}
        >
          {listening ? (
            <>
              <MicOff className="w-4 h-4 mr-2" /> Stop Listening
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-2" /> Start Listening
            </>
          )}
        </Button>
      </div>

      {/* Mic level indicator */}
      {isConnected && (
        <div className="flex items-end gap-0.5 h-6">
          {Array.from({ length: 10 }).map((_, i) => {
            const active = i < Math.round(audioLevel * 10)
            const height = 3 + i * 1.8
            return (
              <div
                key={i}
                className="w-1.5 rounded-sm transition-all duration-100"
                style={{
                  height: `${height}px`,
                  backgroundColor: active && listening ? '#2563eb' : '#e5e7eb',
                  opacity: active ? 1 : 0.5,
                }}
              />
            )
          })}
          <div className="ml-2 text-xs text-muted-foreground">
            {listening ? 'Listening (VAD)…' : 'Not listening'}
          </div>
        </div>
      )}

      <div className="border rounded h-48 p-2 overflow-auto bg-muted/30">
        {transcript.length === 0 ? (
          <div className="text-xs text-muted-foreground">Transcript will appear here…</div>
        ) : (
          <div className="space-y-1">
            {transcript.map((t, i) => (
              <div key={`${t.timestamp}-${i}`} className="text-xs">
                <span className="font-medium">{t.role === 'user' ? 'You' : 'Maya'}:</span>{' '}
                <span>{t.content}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
