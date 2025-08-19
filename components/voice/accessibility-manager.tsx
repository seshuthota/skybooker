/**
 * Accessibility Manager for Voice Interface
 * Provides comprehensive accessibility features including screen reader support,
 * keyboard navigation, high contrast mode, and reduced motion preferences
 */

"use client"

import React, { useState, useEffect, useRef, createContext, useContext } from 'react'
import { VoiceSessionState, ConnectionState } from '@/types/voice'

interface AccessibilitySettings {
  screenReaderEnabled: boolean
  highContrastMode: boolean
  reducedMotion: boolean
  keyboardNavigation: boolean
  voiceAnnouncements: boolean
  textSize: 'small' | 'medium' | 'large' | 'extra-large'
  audioDescriptions: boolean
}

interface AccessibilityContextType {
  settings: AccessibilitySettings
  updateSettings: (updates: Partial<AccessibilitySettings>) => void
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void
  focusElement: (elementId: string) => void
  generateAriaLabel: (context: string, state?: any) => string
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null)

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    screenReaderEnabled: false,
    highContrastMode: false,
    reducedMotion: false,
    keyboardNavigation: true,
    voiceAnnouncements: true,
    textSize: 'medium',
    audioDescriptions: false
  })

  const announcementRef = useRef<HTMLDivElement>(null)

  // Detect user preferences on mount
  useEffect(() => {
    const detectPreferences = () => {
      const updates: Partial<AccessibilitySettings> = {}

      // Detect screen reader
      if (navigator.userAgent.includes('NVDA') || 
          navigator.userAgent.includes('JAWS') || 
          navigator.userAgent.includes('VoiceOver')) {
        updates.screenReaderEnabled = true
      }

      // Detect high contrast preference
      if (window.matchMedia('(prefers-contrast: high)').matches) {
        updates.highContrastMode = true
      }

      // Detect reduced motion preference
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        updates.reducedMotion = true
      }

      // Check for saved preferences
      const savedSettings = localStorage.getItem('skybooker_accessibility')
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings)
          Object.assign(updates, parsed)
        } catch (error) {
          console.error('[AccessibilityManager] Failed to parse saved settings:', error)
        }
      }

      if (Object.keys(updates).length > 0) {
        setSettings(prev => ({ ...prev, ...updates }))
      }
    }

    detectPreferences()
  }, [])

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('skybooker_accessibility', JSON.stringify(settings))
    
    // Apply CSS classes for accessibility features
    const body = document.body
    body.classList.toggle('high-contrast', settings.highContrastMode)
    body.classList.toggle('reduced-motion', settings.reducedMotion)
    body.classList.toggle('large-text', settings.textSize === 'large' || settings.textSize === 'extra-large')
    
    // Apply text size
    body.style.setProperty('--accessibility-text-scale', getTextScale(settings.textSize))
  }, [settings])

  const getTextScale = (size: AccessibilitySettings['textSize']): string => {
    switch (size) {
      case 'small': return '0.875'
      case 'medium': return '1'
      case 'large': return '1.125'
      case 'extra-large': return '1.25'
      default: return '1'
    }
  }

  const updateSettings = (updates: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...updates }))
  }

  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!settings.screenReaderEnabled && !settings.voiceAnnouncements) return

    if (announcementRef.current) {
      announcementRef.current.setAttribute('aria-live', priority)
      announcementRef.current.textContent = message
      
      // Clear after a delay to allow for re-announcements
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = ''
        }
      }, 1000)
    }
  }

  const focusElement = (elementId: string) => {
    const element = document.getElementById(elementId)
    if (element) {
      element.focus()
      if (settings.screenReaderEnabled) {
        announceToScreenReader(`Focused on ${element.getAttribute('aria-label') || element.textContent || elementId}`)
      }
    }
  }

  const generateAriaLabel = (context: string, state?: any): string => {
    switch (context) {
      case 'voice_session_button':
        return state?.connectionState === 'disconnected' 
          ? 'Start voice conversation with Maya, your travel assistant'
          : 'End current voice conversation'
      
      case 'microphone_button':
        return state?.isListening 
          ? 'Microphone is active, click to mute'
          : 'Microphone is muted, click to start speaking'
      
      case 'connection_status':
        return `Voice connection status: ${state?.connectionState || 'unknown'}. ${
          state?.connectionState === 'ready' 
            ? 'Ready for conversation'
            : state?.connectionState === 'connecting'
            ? 'Establishing connection'
            : state?.connectionState === 'error'
            ? 'Connection failed'
            : 'Not connected'
        }`
      
      case 'audio_level':
        const level = state?.audioLevel || 0
        return `Audio level: ${level}%. ${
          level > 50 ? 'Speaking detected' : 
          level > 10 ? 'Low audio input' : 
          'No audio detected'
        }`
      
      case 'conversation_message':
        return `Message from ${state?.agentName || 'assistant'}: ${state?.content}`
      
      case 'error_recovery':
        return `Error occurred: ${state?.userMessage}. ${
          state?.canRetry ? 'Retry options available' : 'Manual intervention required'
        }`
      
      default:
        return context
    }
  }

  const contextValue: AccessibilityContextType = {
    settings,
    updateSettings,
    announceToScreenReader,
    focusElement,
    generateAriaLabel
  }

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
      {/* Screen reader announcement region */}
      <div
        ref={announcementRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      />
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider')
  }
  return context
}

/**
 * Voice State Announcer
 * Automatically announces voice session state changes to screen readers
 */
export function VoiceStateAnnouncer({ sessionState }: { sessionState: VoiceSessionState }) {
  const { announceToScreenReader, settings } = useAccessibility()
  const previousState = useRef<ConnectionState>('disconnected')

  useEffect(() => {
    if (!settings.voiceAnnouncements) return

    const currentState = sessionState.connectionState
    
    if (previousState.current !== currentState) {
      let announcement = ''
      
      switch (currentState) {
        case 'connecting':
          announcement = 'Connecting to voice assistant. Please wait.'
          break
        case 'connected':
          announcement = 'Connected to voice assistant. You can now speak.'
          break
        case 'ready':
          announcement = 'Voice assistant is ready. Say hello to Maya.'
          break
        case 'error':
          announcement = 'Voice connection failed. Please check your settings or try text chat.'
          break
        case 'disconnected':
          announcement = 'Voice assistant disconnected.'
          break
        case 'reconnecting':
          announcement = 'Connection lost. Attempting to reconnect.'
          break
      }
      
      if (announcement) {
        announceToScreenReader(announcement, currentState === 'error' ? 'assertive' : 'polite')
      }
      
      previousState.current = currentState
    }
  }, [sessionState.connectionState, announceToScreenReader, settings.voiceAnnouncements])

  // Announce when Maya starts/stops speaking
  useEffect(() => {
    if (!settings.voiceAnnouncements) return

    if (sessionState.isSpeaking) {
      announceToScreenReader('Maya is speaking', 'polite')
    }
  }, [sessionState.isSpeaking, announceToScreenReader, settings.voiceAnnouncements])

  // Announce new messages
  useEffect(() => {
    if (!settings.voiceAnnouncements || sessionState.conversationHistory.length === 0) return

    const lastMessage = sessionState.conversationHistory[sessionState.conversationHistory.length - 1]
    if (lastMessage && lastMessage.type === 'assistant') {
      announceToScreenReader(`Maya says: ${lastMessage.content}`, 'polite')
    }
  }, [sessionState.conversationHistory, announceToScreenReader, settings.voiceAnnouncements])

  return null
}

/**
 * Keyboard Navigation Handler
 * Provides keyboard shortcuts for voice interface
 */
export function KeyboardNavigationHandler() {
  const { settings, focusElement } = useAccessibility()

  useEffect(() => {
    if (!settings.keyboardNavigation) return

    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in inputs
      if (event.target && 
          (event.target as HTMLElement).tagName.toLowerCase() === 'input' ||
          (event.target as HTMLElement).tagName.toLowerCase() === 'textarea') {
        return
      }

      // Ctrl/Cmd + shortcuts
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'm':
            event.preventDefault()
            focusElement('voice-microphone-button')
            break
          case 'v':
            event.preventDefault()
            focusElement('voice-session-button')
            break
          case 't':
            event.preventDefault()
            focusElement('voice-transcript-toggle')
            break
        }
      }

      // Alt + shortcuts
      if (event.altKey) {
        switch (event.key.toLowerCase()) {
          case 'h':
            event.preventDefault()
            focusElement('voice-help-button')
            break
          case 's':
            event.preventDefault()
            focusElement('voice-settings-button')
            break
        }
      }

      // Escape key
      if (event.key === 'Escape') {
        const activeElement = document.activeElement as HTMLElement
        if (activeElement && activeElement.closest('[role="dialog"]')) {
          activeElement.blur()
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [settings.keyboardNavigation, focusElement])

  return null
}