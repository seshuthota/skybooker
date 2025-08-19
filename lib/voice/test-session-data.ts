/**
 * Test Session Data for Development
 * Demonstrates session persistence and recovery functionality
 */

import { VoiceSessionStorage } from './session-storage'
import { ConversationMessage, ConversationContext } from '@/types/voice'

export function createTestSessionData(userId: string = 'test_user_123'): void {
  console.log('[TestSessionData] Creating sample session data for development testing...')
  
  const sessionStorage = new VoiceSessionStorage({
    maxSessions: 10,
    maxHistoryLength: 200,
    sessionTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
    autoCleanup: true
  })

  // Sample conversation history
  const sampleConversation: ConversationMessage[] = [
    {
      id: 'msg_1',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      type: 'assistant',
      content: 'Hi there! I\'m Maya, your travel assistant here at SkyBooker. I\'m excited to help you with your travel plans today!',
      agentName: 'Maya'
    },
    {
      id: 'msg_2',
      timestamp: new Date(Date.now() - 4 * 60 * 1000), // 4 minutes ago
      type: 'user',
      content: 'I need to book a flight from New York to London',
      agentName: 'You'
    },
    {
      id: 'msg_3',
      timestamp: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
      type: 'assistant',
      content: 'Perfect! Let me help you find great flight options from New York to London. What dates work best for your departure?',
      agentName: 'Maya'
    },
    {
      id: 'msg_4',
      timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      type: 'user',
      content: 'I want to leave next Monday and return the following Friday',
      agentName: 'You'
    }
  ]

  // Sample conversation context
  const sampleContext: ConversationContext = {
    userId,
    sessionId: 'test_session_' + Date.now(),
    currentIntent: 'flight_search',
    searchCriteria: {
      origin: 'JFK',
      destination: 'LHR',
      departureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
      returnDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Week after
      passengers: 1,
      class: 'economy'
    }
  }

  // Save test session
  sessionStorage.saveSession(
    sampleContext.sessionId,
    userId,
    sampleConversation,
    sampleContext
  )

  // Create another sample session (older)
  const olderConversation: ConversationMessage[] = [
    {
      id: 'msg_old_1',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      type: 'assistant',
      content: 'Welcome back to SkyBooker! How can I help you today?',
      agentName: 'Maya'
    },
    {
      id: 'msg_old_2',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 60 * 1000),
      type: 'user',
      content: 'I want to check flight prices for next month',
      agentName: 'You'
    }
  ]

  const olderContext: ConversationContext = {
    userId,
    sessionId: 'test_session_older_' + (Date.now() - 2 * 24 * 60 * 60 * 1000),
    currentIntent: 'price_check'
  }

  sessionStorage.saveSession(
    olderContext.sessionId,
    userId,
    olderConversation,
    olderContext
  )

  console.log('[TestSessionData] Created test sessions with recovery suggestions')
}

// Utility to clear test data
export function clearTestSessionData(): void {
  const sessionStorage = new VoiceSessionStorage()
  sessionStorage.clearAllSessions()
  console.log('[TestSessionData] Cleared all test session data')
}