/**
 * Voice Session Storage Manager
 * Handles conversation state persistence and recovery
 */

import { ConversationMessage, ConversationContext } from '@/types/voice'

interface PersistedSession {
  sessionId: string
  userId: string
  timestamp: Date
  conversationHistory: ConversationMessage[]
  conversationContext: ConversationContext
  lastActivity: Date
  version: string
}

interface SessionStorageConfig {
  maxSessions: number
  maxHistoryLength: number
  sessionTTL: number // Time to live in milliseconds
  autoCleanup: boolean
}

export class VoiceSessionStorage {
  private config: SessionStorageConfig
  private storageKey = 'skybooker_voice_sessions'
  private version = '1.0.0'

  constructor(config?: Partial<SessionStorageConfig>) {
    this.config = {
      maxSessions: 5, // Keep max 5 sessions
      maxHistoryLength: 100, // Max 100 messages per session
      sessionTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
      autoCleanup: true,
      ...config
    }

    if (this.config.autoCleanup) {
      this.cleanupExpiredSessions()
    }
  }

  /**
   * Save conversation state to localStorage
   */
  saveSession(
    sessionId: string,
    userId: string,
    conversationHistory: ConversationMessage[],
    conversationContext: ConversationContext
  ): void {
    try {
      const sessions = this.getAllSessions()
      
      // Trim conversation history if too long
      const trimmedHistory = this.trimConversationHistory(conversationHistory)
      
      const sessionData: PersistedSession = {
        sessionId,
        userId,
        timestamp: new Date(),
        conversationHistory: trimmedHistory,
        conversationContext,
        lastActivity: new Date(),
        version: this.version
      }

      // Update existing session or add new one
      const existingIndex = sessions.findIndex(s => s.sessionId === sessionId)
      if (existingIndex >= 0) {
        sessions[existingIndex] = sessionData
      } else {
        sessions.push(sessionData)
      }

      // Keep only the most recent sessions
      const sortedSessions = sessions
        .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
        .slice(0, this.config.maxSessions)

      localStorage.setItem(this.storageKey, JSON.stringify(sortedSessions))
      console.log(`[SessionStorage] Saved session ${sessionId} with ${trimmedHistory.length} messages`)
      
    } catch (error) {
      console.error('[SessionStorage] Failed to save session:', error)
    }
  }

  /**
   * Load conversation state from localStorage
   */
  loadSession(sessionId: string): PersistedSession | null {
    try {
      const sessions = this.getAllSessions()
      const session = sessions.find(s => s.sessionId === sessionId)
      
      if (session) {
        // Convert string dates back to Date objects
        session.timestamp = new Date(session.timestamp)
        session.lastActivity = new Date(session.lastActivity)
        session.conversationHistory = session.conversationHistory.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))

        console.log(`[SessionStorage] Loaded session ${sessionId} with ${session.conversationHistory.length} messages`)
        return session
      }
      
      return null
    } catch (error) {
      console.error('[SessionStorage] Failed to load session:', error)
      return null
    }
  }

  /**
   * Get the most recent session for a user
   */
  getLatestSession(userId: string): PersistedSession | null {
    try {
      const sessions = this.getAllSessions()
      const userSessions = sessions
        .filter(s => s.userId === userId)
        .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
      
      return userSessions.length > 0 ? userSessions[0] : null
    } catch (error) {
      console.error('[SessionStorage] Failed to get latest session:', error)
      return null
    }
  }

  /**
   * Delete a specific session
   */
  deleteSession(sessionId: string): void {
    try {
      const sessions = this.getAllSessions()
      const filteredSessions = sessions.filter(s => s.sessionId !== sessionId)
      localStorage.setItem(this.storageKey, JSON.stringify(filteredSessions))
      console.log(`[SessionStorage] Deleted session ${sessionId}`)
    } catch (error) {
      console.error('[SessionStorage] Failed to delete session:', error)
    }
  }

  /**
   * Clear all stored sessions
   */
  clearAllSessions(): void {
    try {
      localStorage.removeItem(this.storageKey)
      console.log('[SessionStorage] Cleared all sessions')
    } catch (error) {
      console.error('[SessionStorage] Failed to clear sessions:', error)
    }
  }

  /**
   * Get session recovery suggestions for user
   */
  getRecoverySuggestions(userId: string): Array<{
    sessionId: string
    lastActivity: Date
    messageCount: number
    contextSummary: string
  }> {
    try {
      const sessions = this.getAllSessions()
      const userSessions = sessions
        .filter(s => s.userId === userId)
        .filter(s => this.isSessionRecoverable(s))
        .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
        .slice(0, 3) // Top 3 most recent recoverable sessions

      return userSessions.map(session => ({
        sessionId: session.sessionId,
        lastActivity: new Date(session.lastActivity),
        messageCount: session.conversationHistory.length,
        contextSummary: this.generateContextSummary(session)
      }))
    } catch (error) {
      console.error('[SessionStorage] Failed to get recovery suggestions:', error)
      return []
    }
  }

  /**
   * Check if session is recoverable (not too old, has meaningful content)
   */
  private isSessionRecoverable(session: PersistedSession): boolean {
    const age = Date.now() - new Date(session.lastActivity).getTime()
    const hasConversation = session.conversationHistory.length > 1
    const isNotExpired = age < this.config.sessionTTL
    
    return hasConversation && isNotExpired
  }

  /**
   * Generate a context summary for session recovery
   */
  private generateContextSummary(session: PersistedSession): string {
    const context = session.conversationContext
    const messages = session.conversationHistory
    
    // Build context summary
    const parts: string[] = []
    
    if (context.currentIntent) {
      parts.push(`Intent: ${context.currentIntent}`)
    }
    
    if (context.searchCriteria?.origin && context.searchCriteria?.destination) {
      parts.push(`Flight: ${context.searchCriteria.origin} → ${context.searchCriteria.destination}`)
    }
    
    if (context.selectedFlight) {
      parts.push('Flight selected')
    }
    
    if (context.bookingId) {
      parts.push(`Booking: ${context.bookingId}`)
    }
    
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.type === 'assistant') {
        const truncated = lastMessage.content.length > 50 
          ? lastMessage.content.substring(0, 50) + '...'
          : lastMessage.content
        parts.push(`Last: "${truncated}"`)
      }
    }
    
    return parts.length > 0 ? parts.join(' • ') : 'Active conversation'
  }

  /**
   * Trim conversation history to stay within limits
   */
  private trimConversationHistory(history: ConversationMessage[]): ConversationMessage[] {
    if (history.length <= this.config.maxHistoryLength) {
      return history
    }

    // Keep the first few messages (context) and most recent messages
    const keepStart = Math.min(5, Math.floor(this.config.maxHistoryLength * 0.2))
    const keepEnd = this.config.maxHistoryLength - keepStart

    const startMessages = history.slice(0, keepStart)
    const endMessages = history.slice(-keepEnd)

    // Add a separator message to indicate trimming
    const separatorMessage: ConversationMessage = {
      id: `separator_${Date.now()}`,
      timestamp: new Date(),
      type: 'system',
      content: `[... ${history.length - keepStart - keepEnd} messages omitted ...]`,
      agentName: 'System'
    }

    return [...startMessages, separatorMessage, ...endMessages]
  }

  /**
   * Get all sessions from localStorage
   */
  private getAllSessions(): PersistedSession[] {
    try {
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('[SessionStorage] Failed to parse stored sessions:', error)
      return []
    }
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    try {
      const sessions = this.getAllSessions()
      const now = Date.now()
      
      const validSessions = sessions.filter(session => {
        const age = now - new Date(session.lastActivity).getTime()
        return age < this.config.sessionTTL
      })

      if (validSessions.length !== sessions.length) {
        localStorage.setItem(this.storageKey, JSON.stringify(validSessions))
        console.log(`[SessionStorage] Cleaned up ${sessions.length - validSessions.length} expired sessions`)
      }
    } catch (error) {
      console.error('[SessionStorage] Failed to cleanup expired sessions:', error)
    }
  }

  /**
   * Get storage statistics
   */
  getStorageStats(): {
    totalSessions: number
    totalMessages: number
    oldestSession: Date | null
    newestSession: Date | null
    storageSize: number
  } {
    try {
      const sessions = this.getAllSessions()
      const totalMessages = sessions.reduce((sum, s) => sum + s.conversationHistory.length, 0)
      
      let oldestSession: Date | null = null
      let newestSession: Date | null = null
      
      if (sessions.length > 0) {
        const dates = sessions.map(s => new Date(s.lastActivity).getTime())
        oldestSession = new Date(Math.min(...dates))
        newestSession = new Date(Math.max(...dates))
      }
      
      const storageSize = new Blob([localStorage.getItem(this.storageKey) || '']).size
      
      return {
        totalSessions: sessions.length,
        totalMessages,
        oldestSession,
        newestSession,
        storageSize
      }
    } catch (error) {
      console.error('[SessionStorage] Failed to get storage stats:', error)
      return {
        totalSessions: 0,
        totalMessages: 0,
        oldestSession: null,
        newestSession: null,
        storageSize: 0
      }
    }
  }
}