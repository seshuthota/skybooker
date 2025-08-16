"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react"

interface VoiceControlsProps {
  isListening: boolean
  isSpeaking: boolean
  onStartListening: () => void
  onStopListening: () => void
  onTranscriptionReceived: (text: string) => void
  onToggleMute: () => void
  isMuted: boolean
}

export function VoiceControls({
  isListening,
  isSpeaking,
  onStartListening,
  onStopListening,
  onTranscriptionReceived,
  onToggleMute,
  isMuted
}: VoiceControlsProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Initialize speech recognition if available
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'en-US'

        recognitionRef.current.onresult = (event: any) => {
          let transcript = ''
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              transcript += event.results[i][0].transcript
            }
          }
          if (transcript.trim()) {
            onTranscriptionReceived(transcript.trim())
          }
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsRecording(false)
          onStopListening()
        }

        recognitionRef.current.onend = () => {
          setIsRecording(false)
          onStopListening()
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      stopAudioAnalysis()
    }
  }, [onTranscriptionReceived, onStopListening])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioStreamRef.current = stream

      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start()
      }

      // Set up audio analysis for visual feedback
      if (typeof window !== 'undefined') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        analyserRef.current = audioContextRef.current.createAnalyser()
        const source = audioContextRef.current.createMediaStreamSource(stream)
        source.connect(analyserRef.current)
        
        analyserRef.current.fftSize = 256
        const bufferLength = analyserRef.current.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)

        const updateAudioLevel = () => {
          if (analyserRef.current && isRecording) {
            analyserRef.current.getByteFrequencyData(dataArray)
            const average = dataArray.reduce((a, b) => a + b) / bufferLength
            setAudioLevel(average / 255)
            requestAnimationFrame(updateAudioLevel)
          }
        }
        updateAudioLevel()
      }

      setIsRecording(true)
      onStartListening()
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    stopAudioAnalysis()
    setIsRecording(false)
    onStopListening()
  }

  const stopAudioAnalysis = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop())
      audioStreamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    analyserRef.current = null
    setAudioLevel(0)
  }

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Audio Level Indicator */}
      {isRecording && (
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-1 bg-blue-500 rounded-full transition-all duration-100 ${
                audioLevel > i / 5 ? 'h-4' : 'h-1'
              }`}
            />
          ))}
        </div>
      )}

      {/* Microphone Button */}
      <Button
        variant={isRecording ? "destructive" : "default"}
        size="sm"
        onClick={handleMicClick}
        disabled={isSpeaking}
        className={`transition-all duration-200 ${
          isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : ''
        }`}
      >
        {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        {isRecording ? 'Stop' : 'Talk'}
      </Button>

      {/* Mute Button */}
      <Button
        variant={isMuted ? "destructive" : "outline"}
        size="sm"
        onClick={onToggleMute}
      >
        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </Button>

      {/* Status Indicators */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {isListening && (
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Listening
          </span>
        )}
        {isSpeaking && (
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Speaking
          </span>
        )}
      </div>
    </div>
  )
}