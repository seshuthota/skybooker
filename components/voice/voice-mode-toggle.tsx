"use client"

/**
 * Voice Mode Toggle
 * Simple toggle button to switch between text chat and voice mode
 */

import React from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface VoiceModeToggleProps {
  isVoiceMode: boolean
  onToggle: (isVoiceMode: boolean) => void
  disabled?: boolean
  className?: string
}

export function VoiceModeToggle({ 
  isVoiceMode, 
  onToggle, 
  disabled = false,
  className = ''
}: VoiceModeToggleProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant={!isVoiceMode ? "default" : "outline"}
        size="sm"
        onClick={() => onToggle(false)}
        disabled={disabled}
        className="flex items-center gap-1"
      >
        <MessageCircle className="h-4 w-4" />
        <span className="hidden sm:inline">Text</span>
      </Button>
      
      <Button
        variant={isVoiceMode ? "default" : "outline"}
        size="sm"
        onClick={() => onToggle(true)}
        disabled={disabled}
        className="flex items-center gap-1"
      >
        <Mic className="h-4 w-4" />
        <span className="hidden sm:inline">Voice</span>
        {process.env.NODE_ENV === 'development' && (
          <Badge variant="secondary" className="ml-1 text-xs">
            Beta
          </Badge>
        )}
      </Button>
    </div>
  )
}