/**
 * Function Registry for SkyBooker Assistant
 * 
 * Central registry that manages all available function definitions,
 * provides validation, and offers utility methods for function management.
 */

import {
  FunctionDefinition,
  FunctionRegistry,
  FunctionEntry,
  FunctionMetadata,
  ValidationResult
} from './types'

import {
  GET_USER_INFO_FUNCTION,
  SEARCH_FLIGHTS_FUNCTION,
  GET_USER_BOOKINGS_FUNCTION,
  GET_BOOKING_DETAILS_FUNCTION,
  CREATE_BOOKING_FUNCTION,
  CANCEL_BOOKING_FUNCTION,
  GET_USER_PAYMENT_METHODS_FUNCTION
} from './function-definitions'

/**
 * Function metadata defining categories and requirements
 */
const FUNCTION_METADATA: Record<string, FunctionMetadata> = {
  getUserInfo: {
    category: 'user',
    requiresAuth: true,
    rateLimit: { requests: 10, window: 60 }
  },
  searchFlights: {
    category: 'flight',
    requiresAuth: false,
    rateLimit: { requests: 20, window: 60 }
  },
  getUserBookings: {
    category: 'booking',
    requiresAuth: true,
    rateLimit: { requests: 15, window: 60 }
  },
  getBookingDetails: {
    category: 'booking',
    requiresAuth: true,
    rateLimit: { requests: 20, window: 60 }
  },
  createBooking: {
    category: 'booking',
    requiresAuth: true,
    rateLimit: { requests: 5, window: 300 } // 5 bookings per 5 minutes
  },
  cancelBooking: {
    category: 'booking',
    requiresAuth: true,
    rateLimit: { requests: 5, window: 300 } // 5 cancellations per 5 minutes
  },
  getUserPaymentMethods: {
    category: 'payment',
    requiresAuth: true,
    rateLimit: { requests: 10, window: 60 }
  }
}

/**
 * Complete function registry with definitions and metadata
 */
export const FUNCTION_REGISTRY: Record<string, FunctionEntry> = {
  getUserInfo: {
    definition: GET_USER_INFO_FUNCTION,
    metadata: FUNCTION_METADATA.getUserInfo
  },
  searchFlights: {
    definition: SEARCH_FLIGHTS_FUNCTION,
    metadata: FUNCTION_METADATA.searchFlights
  },
  getUserBookings: {
    definition: GET_USER_BOOKINGS_FUNCTION,
    metadata: FUNCTION_METADATA.getUserBookings
  },
  getBookingDetails: {
    definition: GET_BOOKING_DETAILS_FUNCTION,
    metadata: FUNCTION_METADATA.getBookingDetails
  },
  createBooking: {
    definition: CREATE_BOOKING_FUNCTION,
    metadata: FUNCTION_METADATA.createBooking
  },
  cancelBooking: {
    definition: CANCEL_BOOKING_FUNCTION,
    metadata: FUNCTION_METADATA.cancelBooking
  },
  getUserPaymentMethods: {
    definition: GET_USER_PAYMENT_METHODS_FUNCTION,
    metadata: FUNCTION_METADATA.getUserPaymentMethods
  }
}

/**
 * Get a specific function definition by name
 */
export function getFunctionDefinition(name: string): FunctionDefinition | null {
  const entry = FUNCTION_REGISTRY[name]
  return entry ? entry.definition : null
}

/**
 * Get function metadata by name
 */
export function getFunctionMetadata(name: string): FunctionMetadata | null {
  const entry = FUNCTION_REGISTRY[name]
  return entry ? entry.metadata : null
}

/**
 * Get all function definitions for LLM integration
 */
export function getAllFunctionDefinitions(): FunctionDefinition[] {
  return Object.values(FUNCTION_REGISTRY).map(entry => entry.definition)
}

/**
 * Get function definitions by category
 */
export function getFunctionsByCategory(category: FunctionMetadata['category']): FunctionDefinition[] {
  return Object.values(FUNCTION_REGISTRY)
    .filter(entry => entry.metadata.category === category)
    .map(entry => entry.definition)
}

/**
 * Get functions that don't require authentication
 */
export function getPublicFunctions(): FunctionDefinition[] {
  return Object.values(FUNCTION_REGISTRY)
    .filter(entry => !entry.metadata.requiresAuth)
    .map(entry => entry.definition)
}

/**
 * Get functions that require authentication
 */
export function getAuthenticatedFunctions(): FunctionDefinition[] {
  return Object.values(FUNCTION_REGISTRY)
    .filter(entry => entry.metadata.requiresAuth)
    .map(entry => entry.definition)
}

/**
 * Check if a function exists in the registry
 */
export function isFunctionRegistered(name: string): boolean {
  return name in FUNCTION_REGISTRY
}

/**
 * Check if a function requires authentication
 */
export function requiresAuthentication(name: string): boolean {
  const metadata = getFunctionMetadata(name)
  return metadata ? metadata.requiresAuth : true // Default to requiring auth
}

/**
 * Get rate limit configuration for a function
 */
export function getFunctionRateLimit(name: string): { requests: number; window: number } | null {
  const metadata = getFunctionMetadata(name)
  return metadata?.rateLimit || null
}

/**
 * Validate that a function call has the required parameters
 */
export function validateFunctionCall(name: string, parameters: any): ValidationResult {
  const definition = getFunctionDefinition(name)
  
  if (!definition) {
    return {
      valid: false,
      errors: [`Function '${name}' is not registered`]
    }
  }

  const errors: string[] = []
  const required = definition.parameters.required || []
  
  // Check required parameters
  for (const param of required) {
    if (!(param in parameters)) {
      errors.push(`Missing required parameter: ${param}`)
    }
  }

  // Basic type checking
  const properties = definition.parameters.properties
  for (const [key, value] of Object.entries(parameters)) {
    if (!(key in properties)) {
      errors.push(`Unknown parameter: ${key}`)
      continue
    }

    const paramDef = properties[key]
    if (paramDef.type === 'string' && typeof value !== 'string') {
      errors.push(`Parameter '${key}' must be a string`)
    } else if (paramDef.type === 'number' && typeof value !== 'number') {
      errors.push(`Parameter '${key}' must be a number`)
    } else if (paramDef.type === 'array' && !Array.isArray(value)) {
      errors.push(`Parameter '${key}' must be an array`)
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    sanitizedData: errors.length === 0 ? parameters : undefined
  }
}

/**
 * Get a summary of all registered functions for documentation
 */
export function getFunctionSummary(): Array<{
  name: string
  description: string
  category: string
  requiresAuth: boolean
  parameterCount: number
}> {
  return Object.entries(FUNCTION_REGISTRY).map(([name, entry]) => ({
    name,
    description: entry.definition.description,
    category: entry.metadata.category,
    requiresAuth: entry.metadata.requiresAuth,
    parameterCount: entry.definition.parameters.required.length
  }))
}