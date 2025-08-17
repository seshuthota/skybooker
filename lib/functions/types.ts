/**
 * Core types for the function calling system
 * 
 * These interfaces define the structure for OpenAI-compatible function definitions
 * and provide type safety throughout the function calling system.
 */

/**
 * OpenAI-compatible function definition interface
 */
export interface FunctionDefinition {
  name: string
  description: string
  parameters: {
    type: "object"
    properties: Record<string, FunctionParameter>
    required: string[]
  }
}

/**
 * Function parameter definition for OpenAI schema
 */
export interface FunctionParameter {
  type: string
  description: string
  enum?: string[]
  format?: string
  minimum?: number
  maximum?: number
  pattern?: string
  items?: FunctionParameter
}

/**
 * Registry containing all available function definitions
 */
export interface FunctionRegistry {
  getUserInfo: FunctionDefinition
  searchFlights: FunctionDefinition
  getUserBookings: FunctionDefinition
  getBookingDetails: FunctionDefinition
  createBooking: FunctionDefinition
  cancelBooking: FunctionDefinition
  getUserPaymentMethods: FunctionDefinition
}

/**
 * Function call request from LLM
 */
export interface FunctionCall {
  name: string
  parameters?: any // Parsed parameters object
}

/**
 * Function call result
 */
export interface FunctionCallResult {
  data?: any
  metadata?: {
    functionName: string
    executionTime: number
    timestamp: Date
    requestId: string
  }
}

/**
 * Structured error response for function calls
 */
export interface FunctionError {
  type: string
  code: string
  message: string
  details?: Record<string, any>
}

/**
 * Context for function execution
 */
export interface FunctionCallContext {
  user?: any | null
  isAuthenticated: boolean
  requestId: string
  timestamp: Date
  userAgent: string
  ipAddress: string
}

/**
 * Validation result for function parameters
 */
export interface ValidationResult {
  valid: boolean
  errors?: string[]
  sanitizedData?: any
}

/**
 * Function metadata for registry management
 */
export interface FunctionMetadata {
  category: 'user' | 'flight' | 'booking' | 'payment'
  requiresAuth: boolean
  rateLimit?: {
    requests: number
    window: number // seconds
  }
}

/**
 * Complete function entry in registry
 */
export interface FunctionEntry {
  definition: FunctionDefinition
  metadata: FunctionMetadata
}