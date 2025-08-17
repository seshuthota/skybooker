/**
 * Function Call Router and Execution Service
 * 
 * Central service for routing, validating, and executing assistant function calls.
 * Handles authentication, rate limiting, validation, and error handling.
 */

import { NextRequest } from 'next/server'
import { 
  FunctionCall, 
  FunctionCallResult, 
  FunctionCallContext, 
  FunctionError 
} from '@/lib/functions/types'
import { 
  isFunctionRegistered,
  getFunctionDefinition,
  getFunctionMetadata,
  getFunctionRateLimit
} from '@/lib/functions/function-registry'
import { validateFunctionParameters } from '@/lib/functions/validation'
import {
  createFunctionContext,
  validateUserContext,
  checkRateLimit,
  isWithinRateLimit
} from '@/lib/services/user-context'

// Helper functions for creating context
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2)}`
}

function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}

export interface ExecutionResult {
  success: boolean
  result?: FunctionCallResult
  error?: FunctionError
  context: FunctionCallContext
}

export interface FunctionHandler {
  (parameters: any, context: FunctionCallContext): Promise<any>
}

/**
 * Registry of function handlers
 */
const functionHandlers = new Map<string, FunctionHandler>()

/**
 * Register a function handler
 */
export function registerFunctionHandler(name: string, handler: FunctionHandler): void {
  functionHandlers.set(name, handler)
}

/**
 * Get registered function handler
 */
export function getFunctionHandler(name: string): FunctionHandler | undefined {
  return functionHandlers.get(name)
}

/**
 * Main function execution service with optional user context
 */
export async function executeFunctionCall(
  functionCall: FunctionCall,
  request: NextRequest,
  userContext?: { user?: any | null }
): Promise<ExecutionResult> {
  const startTime = Date.now()
  
  try {
    // Create user context from request or use provided context
    let context: FunctionCallContext
    if (userContext?.user) {
      // Create context with provided user info
      context = {
        user: userContext.user,
        isAuthenticated: true,
        requestId: generateRequestId(),
        timestamp: new Date(),
        userAgent: request.headers.get('User-Agent') || 'unknown',
        ipAddress: getClientIP(request)
      }
    } else {
      // Fall back to extracting from request headers
      context = await createFunctionContext(request)
    }
    
    // Step 1: Validate function exists
    if (!isFunctionRegistered(functionCall.name)) {
      return {
        success: false,
        error: {
          type: 'function_not_found',
          message: `Function '${functionCall.name}' is not registered`,
          code: 'FUNCTION_NOT_FOUND',
          details: { functionName: functionCall.name }
        },
        context
      }
    }

    // Step 2: Validate user context and permissions
    const contextValidation = validateUserContext(context, functionCall.name)
    if (!contextValidation.valid) {
      return {
        success: false,
        error: {
          type: 'permission_denied',
          message: contextValidation.error || 'Permission denied',
          code: 'PERMISSION_DENIED',
          details: { 
            functionName: functionCall.name,
            isAuthenticated: context.isAuthenticated 
          }
        },
        context
      }
    }

    // Step 3: Check rate limits (only for authenticated users)
    if (context.isAuthenticated && context.user) {
      const rateLimit = getFunctionRateLimit(functionCall.name)
      if (rateLimit) {
        const rateLimitInfo = checkRateLimit(context.user.id, functionCall.name, rateLimit)
        
        if (!isWithinRateLimit(rateLimitInfo)) {
          return {
            success: false,
            error: {
              type: 'rate_limit_exceeded',
              message: `Rate limit exceeded for function '${functionCall.name}'`,
              code: 'RATE_LIMIT_EXCEEDED',
              details: {
                functionName: functionCall.name,
                limit: rateLimit,
                resetTime: new Date(rateLimitInfo.resetTime)
              }
            },
            context
          }
        }
      }
    }

    // Step 4: Validate function parameters
    console.log(`[FUNCTION_EXECUTOR] Validating parameters for ${functionCall.name}:`, JSON.stringify(functionCall.parameters, null, 2))
    const paramValidation = validateFunctionParameters(
      functionCall.name, 
      functionCall.parameters
    )
    
    if (!paramValidation.valid) {
      console.error(`[FUNCTION_EXECUTOR] Parameter validation failed for ${functionCall.name}:`)
      console.error('Validation errors:', paramValidation.errors)
      console.error('Received parameters:', JSON.stringify(functionCall.parameters, null, 2))
      
      return {
        success: false,
        error: {
          type: 'invalid_parameters',
          message: `Invalid function parameters: ${paramValidation.errors.join(', ')}`,
          code: 'INVALID_PARAMETERS',
          details: {
            functionName: functionCall.name,
            errors: paramValidation.errors,
            receivedParameters: functionCall.parameters,
            suggestion: functionCall.name === 'createBooking' 
              ? 'For createBooking, only flightId is required. Passenger and contact info will be auto-filled from user profile.'
              : undefined
          }
        },
        context
      }
    }
    console.log(`[FUNCTION_EXECUTOR] Parameters validated successfully for ${functionCall.name}`)

    // Step 5: Get function handler
    const handler = getFunctionHandler(functionCall.name)
    if (!handler) {
      return {
        success: false,
        error: {
          type: 'handler_not_found',
          message: `No handler registered for function '${functionCall.name}'`,
          code: 'HANDLER_NOT_FOUND',
          details: { functionName: functionCall.name }
        },
        context
      }
    }

    // Step 6: Execute function with timeout
    const metadata = getFunctionMetadata(functionCall.name)
    const timeoutMs = 30000 // 30 second timeout
    
    const executionPromise = handler(paramValidation.sanitizedData, context)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Function execution timeout')), timeoutMs)
    )

    const result = await Promise.race([executionPromise, timeoutPromise])
    const executionTime = Date.now() - startTime

    // Log successful execution
    logFunctionCall(functionCall, context, true, executionTime)

    return {
      success: true,
      result: {
        data: result,
        metadata: {
          functionName: functionCall.name,
          executionTime,
          timestamp: new Date(),
          requestId: context.requestId
        }
      },
      context
    }

  } catch (error) {
    const executionTime = Date.now() - startTime
    
    // Log failed execution
    const context = await createFunctionContext(request).catch(() => ({
      user: null,
      isAuthenticated: false,
      requestId: 'unknown',
      timestamp: new Date(),
      userAgent: 'unknown',
      ipAddress: 'unknown'
    }))
    
    logFunctionCall(functionCall, context, false, executionTime, error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return {
      success: false,
      error: {
        type: 'execution_error',
        message: `Function execution failed: ${errorMessage}`,
        code: 'EXECUTION_ERROR',
        details: {
          functionName: functionCall.name,
          executionTime,
          originalError: errorMessage
        }
      },
      context
    }
  }
}

/**
 * Execute multiple function calls in sequence
 */
export async function executeFunctionCalls(
  functionCalls: FunctionCall[],
  request: NextRequest
): Promise<ExecutionResult[]> {
  const results: ExecutionResult[] = []
  
  for (const functionCall of functionCalls) {
    const result = await executeFunctionCall(functionCall, request)
    results.push(result)
    
    // Stop execution chain if any function fails
    if (!result.success) {
      break
    }
  }
  
  return results
}

/**
 * Log function call for audit and monitoring
 */
function logFunctionCall(
  functionCall: FunctionCall,
  context: FunctionCallContext,
  success: boolean,
  executionTime: number,
  error?: any
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    requestId: context.requestId,
    functionName: functionCall.name,
    userId: context.user?.id || 'anonymous',
    userAgent: context.userAgent,
    ipAddress: context.ipAddress,
    success,
    executionTime,
    parameterCount: Object.keys(functionCall.parameters || {}).length,
    error: error ? {
      message: error instanceof Error ? error.message : String(error),
      type: error.constructor?.name || 'UnknownError'
    } : undefined
  }

  // In production, this would go to a proper logging service
  console.log('[FUNCTION_CALL]', JSON.stringify(logEntry))
}

/**
 * Get execution statistics (for monitoring dashboard)
 */
export interface ExecutionStats {
  totalCalls: number
  successfulCalls: number
  failedCalls: number
  averageExecutionTime: number
  functionUsage: Record<string, number>
}

// In-memory stats (in production, use persistent storage)
let executionStats: ExecutionStats = {
  totalCalls: 0,
  successfulCalls: 0,
  failedCalls: 0,
  averageExecutionTime: 0,
  functionUsage: {}
}

/**
 * Get current execution statistics
 */
export function getExecutionStats(): ExecutionStats {
  return { ...executionStats }
}

/**
 * Reset execution statistics
 */
export function resetExecutionStats(): void {
  executionStats = {
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
    averageExecutionTime: 0,
    functionUsage: {}
  }
}

/**
 * Validate function call format
 */
export function validateFunctionCallFormat(functionCall: any): functionCall is FunctionCall {
  return (
    typeof functionCall === 'object' &&
    functionCall !== null &&
    typeof functionCall.name === 'string' &&
    functionCall.name.length > 0 &&
    (functionCall.parameters === undefined || typeof functionCall.parameters === 'object')
  )
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  type: string,
  message: string,
  code: string,
  details?: any
): FunctionError {
  return {
    type,
    message,
    code,
    details
  }
}