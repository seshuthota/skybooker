/**
 * Voice Error Handler
 * Comprehensive error handling with fallback strategies and user-friendly messaging
 */

import { VoiceError, ConnectionState } from '@/types/voice'

export interface ErrorSeverity {
  level: 'low' | 'medium' | 'high' | 'critical'
  recoverable: boolean
  requiresUserAction: boolean
}

export interface ErrorSolution {
  action: string
  description: string
  priority: number
  automated: boolean
}

export interface ErrorHandlingResult {
  severity: ErrorSeverity
  userMessage: string
  technicalMessage: string
  solutions: ErrorSolution[]
  fallbackOptions: string[]
  shouldShowDetails: boolean
  canRetry: boolean
  retryDelay: number
}

export class VoiceErrorHandler {
  private static errorPatterns = new Map<string, Partial<ErrorHandlingResult>>([
    // Connection Errors
    ['CONNECTION_TIMEOUT', {
      severity: { level: 'medium', recoverable: true, requiresUserAction: false },
      userMessage: 'Connection is taking longer than expected. Let me try again.',
      solutions: [
        { action: 'retry', description: 'Automatically retry connection', priority: 1, automated: true },
        { action: 'checkNetwork', description: 'Check your internet connection', priority: 2, automated: false }
      ],
      canRetry: true,
      retryDelay: 2000
    }],
    
    ['CONNECTION_FAILED', {
      severity: { level: 'high', recoverable: true, requiresUserAction: true },
      userMessage: 'Unable to connect to the voice service. Please check your connection and try again.',
      solutions: [
        { action: 'checkNetwork', description: 'Verify internet connection', priority: 1, automated: false },
        { action: 'refreshPage', description: 'Refresh the page', priority: 2, automated: false },
        { action: 'fallbackChat', description: 'Use text chat instead', priority: 3, automated: false }
      ],
      fallbackOptions: ['text_chat', 'offline_mode'],
      canRetry: true,
      retryDelay: 5000
    }],

    // Permission Errors
    ['MICROPHONE_PERMISSION_DENIED', {
      severity: { level: 'high', recoverable: true, requiresUserAction: true },
      userMessage: 'Microphone access is required for voice conversations. Please enable it in your browser settings.',
      solutions: [
        { action: 'enableMicrophone', description: 'Enable microphone in browser settings', priority: 1, automated: false },
        { action: 'tryAgain', description: 'Try starting voice session again', priority: 2, automated: false },
        { action: 'fallbackChat', description: 'Continue with text chat', priority: 3, automated: false }
      ],
      fallbackOptions: ['text_chat'],
      canRetry: true,
      retryDelay: 0
    }],

    ['MICROPHONE_NOT_FOUND', {
      severity: { level: 'medium', recoverable: true, requiresUserAction: true },
      userMessage: 'No microphone detected. Please connect a microphone or use text chat.',
      solutions: [
        { action: 'connectMicrophone', description: 'Connect a microphone device', priority: 1, automated: false },
        { action: 'fallbackChat', description: 'Use text chat instead', priority: 2, automated: false }
      ],
      fallbackOptions: ['text_chat'],
      canRetry: true,
      retryDelay: 0
    }],

    // API Errors
    ['API_KEY_INVALID', {
      severity: { level: 'critical', recoverable: false, requiresUserAction: true },
      userMessage: 'Voice service is temporarily unavailable. Please try again later.',
      technicalMessage: 'Invalid API key configuration',
      solutions: [
        { action: 'contactSupport', description: 'Contact customer support', priority: 1, automated: false },
        { action: 'fallbackChat', description: 'Use text chat for now', priority: 2, automated: false }
      ],
      fallbackOptions: ['text_chat', 'offline_mode'],
      canRetry: false,
      retryDelay: 0
    }],

    ['RATE_LIMIT_EXCEEDED', {
      severity: { level: 'medium', recoverable: true, requiresUserAction: false },
      userMessage: 'Too many requests. Please wait a moment before trying again.',
      solutions: [
        { action: 'wait', description: 'Wait before retrying', priority: 1, automated: true },
        { action: 'fallbackChat', description: 'Use text chat while waiting', priority: 2, automated: false }
      ],
      fallbackOptions: ['text_chat'],
      canRetry: true,
      retryDelay: 30000
    }],

    // Audio Errors
    ['AUDIO_PLAYBACK_FAILED', {
      severity: { level: 'medium', recoverable: true, requiresUserAction: false },
      userMessage: 'Audio playback issue detected. Attempting to restore...',
      solutions: [
        { action: 'restartAudio', description: 'Restart audio system', priority: 1, automated: true },
        { action: 'showTranscript', description: 'Show text transcript', priority: 2, automated: true }
      ],
      canRetry: true,
      retryDelay: 1000
    }],

    ['AUDIO_QUALITY_POOR', {
      severity: { level: 'low', recoverable: true, requiresUserAction: false },
      userMessage: 'Audio quality is poor. I\'m working to improve the connection.',
      solutions: [
        { action: 'optimizeConnection', description: 'Optimize connection settings', priority: 1, automated: true },
        { action: 'showTranscript', description: 'Enable transcript view', priority: 2, automated: true }
      ],
      canRetry: true,
      retryDelay: 0
    }],

    // Session Errors
    ['SESSION_EXPIRED', {
      severity: { level: 'medium', recoverable: true, requiresUserAction: false },
      userMessage: 'Your session has expired. Let me start a fresh conversation for you.',
      solutions: [
        { action: 'newSession', description: 'Start new session', priority: 1, automated: true },
        { action: 'recoverSession', description: 'Try to recover previous session', priority: 2, automated: false }
      ],
      canRetry: true,
      retryDelay: 1000
    }],

    ['SESSION_LIMIT_REACHED', {
      severity: { level: 'medium', recoverable: true, requiresUserAction: true },
      userMessage: 'Maximum concurrent sessions reached. Please close other voice sessions.',
      solutions: [
        { action: 'closeOtherSessions', description: 'Close other browser tabs with voice sessions', priority: 1, automated: false },
        { action: 'waitAndRetry', description: 'Wait a few minutes and try again', priority: 2, automated: false }
      ],
      canRetry: true,
      retryDelay: 10000
    }],

    // Network Errors  
    ['NETWORK_UNSTABLE', {
      severity: { level: 'medium', recoverable: true, requiresUserAction: false },
      userMessage: 'Network connection is unstable. Switching to low-bandwidth mode.',
      solutions: [
        { action: 'lowBandwidthMode', description: 'Use low-bandwidth audio settings', priority: 1, automated: true },
        { action: 'showTranscript', description: 'Enable text transcript', priority: 2, automated: true }
      ],
      canRetry: true,
      retryDelay: 2000
    }]
  ])

  /**
   * Handle and categorize voice-related errors
   */
  static handleError(error: VoiceError | Error, connectionState?: ConnectionState): ErrorHandlingResult {
    const errorCode = error instanceof Error ? 'UNKNOWN_ERROR' : error.code
    const pattern = this.errorPatterns.get(errorCode)
    
    const baseResult: ErrorHandlingResult = {
      severity: { level: 'medium', recoverable: true, requiresUserAction: true },
      userMessage: 'Something went wrong. Please try again.',
      technicalMessage: error.message || 'Unknown error occurred',
      solutions: [
        { action: 'retry', description: 'Try again', priority: 1, automated: false }
      ],
      fallbackOptions: ['text_chat'],
      shouldShowDetails: false,
      canRetry: true,
      retryDelay: 3000
    }

    // Merge with pattern-specific handling
    const result = { ...baseResult, ...pattern }
    
    // Contextual adjustments based on connection state
    if (connectionState) {
      result.solutions = this.adjustSolutionsForState(result.solutions, connectionState)
    }

    // Determine if technical details should be shown
    result.shouldShowDetails = result.severity.level === 'critical' || 
                              process.env.NODE_ENV === 'development'

    console.log(`[ErrorHandler] Handled error ${errorCode}:`, result)
    return result
  }

  /**
   * Adjust solutions based on current connection state
   */
  private static adjustSolutionsForState(
    solutions: ErrorSolution[], 
    connectionState: ConnectionState
  ): ErrorSolution[] {
    switch (connectionState) {
      case 'disconnected':
        return [
          { action: 'connect', description: 'Try connecting', priority: 1, automated: false },
          ...solutions.filter(s => s.action !== 'retry')
        ]
      
      case 'connecting':
        return [
          { action: 'wait', description: 'Wait for connection to complete', priority: 1, automated: true },
          ...solutions.filter(s => s.action !== 'connect')
        ]
      
      case 'connected':
        return solutions.filter(s => s.action !== 'connect')
      
      default:
        return solutions
    }
  }

  /**
   * Generate user-friendly error message with solutions
   */
  static generateUserMessage(result: ErrorHandlingResult): string {
    let message = result.userMessage

    const automatedSolutions = result.solutions.filter(s => s.automated)
    const manualSolutions = result.solutions.filter(s => !s.automated)

    if (automatedSolutions.length > 0) {
      message += ` I'm ${automatedSolutions[0].description.toLowerCase()}.`
    }

    if (manualSolutions.length > 0 && result.severity.requiresUserAction) {
      const topSolution = manualSolutions[0]
      message += ` You can help by: ${topSolution.description.toLowerCase()}.`
    }

    return message
  }

  /**
   * Get fallback options based on error severity
   */
  static getFallbackStrategy(result: ErrorHandlingResult): {
    type: 'immediate' | 'delayed' | 'manual'
    options: string[]
    message: string
  } {
    if (result.severity.level === 'critical') {
      return {
        type: 'immediate',
        options: result.fallbackOptions,
        message: 'Voice service is unavailable. Switching to text chat.'
      }
    }

    if (result.severity.level === 'high' && !result.canRetry) {
      return {
        type: 'immediate',
        options: result.fallbackOptions,
        message: 'Let\'s continue with text chat while I work on the voice connection.'
      }
    }

    if (result.canRetry) {
      return {
        type: 'delayed',
        options: result.fallbackOptions,
        message: `I'll try again in ${Math.round(result.retryDelay / 1000)} seconds. You can also switch to text chat.`
      }
    }

    return {
      type: 'manual',
      options: result.fallbackOptions,
      message: 'Please choose how you\'d like to continue.'
    }
  }

  /**
   * Create error object from generic error
   */
  static createVoiceError(
    error: Error | string, 
    code: string = 'UNKNOWN_ERROR',
    recoverable: boolean = true
  ): VoiceError {
    const message = typeof error === 'string' ? error : error.message

    return {
      code,
      message,
      details: typeof error === 'object' ? error : { originalMessage: error },
      timestamp: new Date(),
      recoverable
    }
  }

  /**
   * Log error with appropriate level
   */
  static logError(result: ErrorHandlingResult, error: VoiceError | Error): void {
    const logLevel = result.severity.level === 'critical' ? 'error' : 
                    result.severity.level === 'high' ? 'warn' : 'info'
    
    console[logLevel]('[VoiceErrorHandler]', {
      severity: result.severity,
      userMessage: result.userMessage,
      technicalMessage: result.technicalMessage,
      solutions: result.solutions,
      originalError: error
    })
  }
}