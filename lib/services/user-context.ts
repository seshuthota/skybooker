/**
 * User Context Service for Function Calling
 * 
 * Handles user authentication, context extraction, and permission validation
 * for assistant function calls. Integrates with existing authentication system.
 */

import { NextRequest } from 'next/server'
import { FunctionCallContext } from '@/lib/functions/types'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  createdAt: string
  updatedAt?: string
}

export interface AuthResult {
  success: boolean
  user?: User
  error?: string
}

export interface RateLimitInfo {
  requests: number
  window: number
  remaining: number
  resetTime: number
}

/**
 * Extract and validate user authentication from request
 */
export async function authenticateUser(request: NextRequest): Promise<AuthResult> {
  try {
    // Check for Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Missing or invalid authorization header'
      }
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    // Extract user ID from token (simplified token format: "token_${userId}")
    if (!token.startsWith('token_')) {
      return {
        success: false,
        error: 'Invalid token format'
      }
    }

    const userId = token.substring(6) // Remove 'token_' prefix
    
    // Fetch user from database
    const { getUserById } = await import('@/lib/services/database-service')
    const user = await getUserById(userId)

    if (!user) {
      return {
        success: false,
        error: 'Invalid or expired token'
      }
    }

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user

    return {
      success: true,
      user: userWithoutPassword as User
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return {
      success: false,
      error: 'Authentication failed'
    }
  }
}

/**
 * Create function call context from request
 */
export async function createFunctionContext(request: NextRequest): Promise<FunctionCallContext> {
  const authResult = await authenticateUser(request)
  
  return {
    user: authResult.user || null,
    isAuthenticated: authResult.success,
    requestId: generateRequestId(),
    timestamp: new Date(),
    userAgent: request.headers.get('User-Agent') || 'unknown',
    ipAddress: getClientIP(request)
  }
}

/**
 * Check if user has permission to call a specific function
 */
export function hasPermission(context: FunctionCallContext, functionName: string): boolean {
  // For functions that don't require authentication
  const publicFunctions = ['searchFlights']
  if (publicFunctions.includes(functionName)) {
    return true
  }

  // All other functions require authentication
  return context.isAuthenticated && context.user !== null
}

/**
 * Rate limiting storage (in-memory for now, in production use Redis)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Check rate limit for user and function
 */
export function checkRateLimit(
  userId: string, 
  functionName: string, 
  limit: { requests: number; window: number }
): RateLimitInfo {
  const key = `${userId}:${functionName}`
  const now = Date.now()
  const windowStart = now - (limit.window * 1000)
  
  let entry = rateLimitStore.get(key)
  
  // Clean up expired entries
  if (entry && entry.resetTime < now) {
    entry = undefined
  }
  
  if (!entry) {
    entry = {
      count: 0,
      resetTime: now + (limit.window * 1000)
    }
  }
  
  const remaining = Math.max(0, limit.requests - entry.count - 1)
  
  entry.count += 1
  rateLimitStore.set(key, entry)
  
  return {
    requests: limit.requests,
    window: limit.window,
    remaining,
    resetTime: entry.resetTime
  }
}

/**
 * Validate if function call is within rate limits
 */
export function isWithinRateLimit(rateLimitInfo: RateLimitInfo): boolean {
  return rateLimitInfo.remaining > 0
}

/**
 * Generate unique request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2)}`
}

/**
 * Extract client IP address from request
 */
function getClientIP(request: NextRequest): string {
  // Check various headers for client IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  // Fallback
  return 'unknown'
}

/**
 * Mock user data for development/testing
 */
export function getMockUser(): User {
  return {
    id: 'mock_user_123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    createdAt: new Date().toISOString()
  }
}

/**
 * Create mock authenticated context for testing
 */
export function createMockContext(): FunctionCallContext {
  return {
    user: getMockUser(),
    isAuthenticated: true,
    requestId: generateRequestId(),
    timestamp: new Date(),
    userAgent: 'test-agent',
    ipAddress: '127.0.0.1'
  }
}

/**
 * Validate user context for function execution
 */
export function validateUserContext(
  context: FunctionCallContext,
  functionName: string
): { valid: boolean; error?: string } {
  // Check authentication requirement
  if (!hasPermission(context, functionName)) {
    return {
      valid: false,
      error: `Function '${functionName}' requires authentication`
    }
  }

  // Additional validation can be added here
  // e.g., user status checks, subscription validation, etc.

  return { valid: true }
}