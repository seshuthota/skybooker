/**
 * Parameter validation for function calls using Zod schemas
 * 
 * Provides runtime validation for all function parameters with detailed
 * error messages and automatic type coercion where appropriate.
 */

import { z } from 'zod'
import { ValidationResult } from './types'

/**
 * Validation schema for getUserInfo function
 */
export const GetUserInfoSchema = z.object({})

/**
 * Validation schema for searchFlights function
 */
export const SearchFlightsSchema = z.object({
  from: z.string()
    .min(2, 'Origin must be at least 2 characters')
    .max(50, 'Origin must be less than 50 characters')
    .refine(val => {
      // More flexible validation - check if it contains valid cities/keywords
      const validTerms = ['new york', 'nyc', 'york', 'london', 'mumbai', 'los angeles', 'la', 'angeles', 'jfk', 'lga', 'ewr', 'lhr', 'lgw', 'bom', 'lax']
      const normalized = val.toLowerCase().trim()
      return validTerms.some(term => normalized.includes(term) || term.includes(normalized))
    }, 'Origin must be a valid city name or airport code')
    .transform(str => str.trim()),
  
  to: z.string()
    .min(2, 'Destination must be at least 2 characters')
    .max(50, 'Destination must be less than 50 characters')
    .refine(val => {
      // More flexible validation - check if it contains valid cities/keywords
      const validTerms = ['new york', 'nyc', 'york', 'london', 'mumbai', 'los angeles', 'la', 'angeles', 'jfk', 'lga', 'ewr', 'lhr', 'lgw', 'bom', 'lax', 'iceland']
      const normalized = val.toLowerCase().trim()
      return validTerms.some(term => normalized.includes(term) || term.includes(normalized))
    }, 'Destination must be a valid city name or airport code')
    .transform(str => str.trim()),
  
  departDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Departure date must be in YYYY-MM-DD format')
    .refine(date => {
      const parsedDate = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return parsedDate >= today
    }, 'Departure date must be today or in the future')
    .optional(),
  
  returnDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Return date must be in YYYY-MM-DD format')
    .optional(),
  
  passengers: z.number()
    .int('Number of passengers must be a whole number')
    .min(1, 'Must have at least 1 passenger')
    .max(9, 'Maximum 9 passengers allowed')
    .default(1),
  
  tripType: z.enum(['roundtrip', 'oneway'], {
    errorMap: () => ({ message: 'Trip type must be either "roundtrip" or "oneway"' })
  }).default('oneway'),
  
  class: z.enum(['economy', 'business', 'first'], {
    errorMap: () => ({ message: 'Class must be "economy", "business", or "first"' })
  }).default('economy')
}).refine(data => {
  // Validate return date for round trips
  if (data.tripType === 'roundtrip' && !data.returnDate) {
    return false
  }
  if (data.tripType === 'roundtrip' && data.returnDate) {
    const departDate = new Date(data.departDate)
    const returnDate = new Date(data.returnDate)
    return returnDate >= departDate
  }
  return true
}, {
  message: 'Return date is required for round trips and must be on or after departure date',
  path: ['returnDate']
})

/**
 * Validation schema for getUserBookings function
 */
export const GetUserBookingsSchema = z.object({
  limit: z.number()
    .int('Limit must be a whole number')
    .min(1, 'Limit must be at least 1')
    .max(50, 'Limit cannot exceed 50')
    .default(10),
  
  status: z.enum(['all', 'upcoming', 'completed', 'cancelled'], {
    errorMap: () => ({ message: 'Status must be "all", "upcoming", "completed", or "cancelled"' })
  }).default('all')
})

/**
 * Validation schema for getBookingDetails function
 */
export const GetBookingDetailsSchema = z.object({
  bookingId: z.string()
    .min(1, 'Booking ID cannot be empty')
    .max(50, 'Booking ID too long')
})

/**
 * Passenger information schema for bookings - simplified for LLM compatibility
 */
const PassengerSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name too long')
    .transform(str => str.trim())
    .optional(), // Made optional so it can be filled from user profile
  
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name too long')
    .transform(str => str.trim())
    .optional(), // Made optional so it can be filled from user profile
  
  dateOfBirth: z.string()
    .optional()
    .default('1990-01-01'), // Default fallback for simplified booking
  
  passportNumber: z.string()
    .optional()
})

/**
 * Contact information schema - simplified for LLM compatibility
 */
const ContactInfoSchema = z.object({
  email: z.string()
    .optional(), // Made optional so it can be filled from user profile
  
  phone: z.string()
    .optional()
})

/**
 * Validation schema for createBooking function - simplified for LLM compatibility
 */
export const CreateBookingSchema = z.object({
  flightId: z.string()
    .min(1, 'Flight ID is required')
    .max(50, 'Flight ID too long'),
  
  passengers: z.array(PassengerSchema)
    .optional()
    .default([{}]), // Default to empty passenger object that will be filled from user profile
  
  contactInfo: ContactInfoSchema
    .optional()
    .default({}), // Default to empty object that will be filled from user profile
  
  paymentMethodId: z.string()
    .optional()
})

/**
 * Validation schema for cancelBooking function
 */
export const CancelBookingSchema = z.object({
  bookingId: z.string()
    .min(1, 'Booking ID cannot be empty')
    .max(50, 'Booking ID too long'),
  
  reason: z.enum(['change_of_plans', 'emergency', 'illness', 'other'], {
    errorMap: () => ({ message: 'Reason must be one of: change_of_plans, emergency, illness, other' })
  }).optional()
})

/**
 * Validation schema for getUserPaymentMethods function
 */
export const GetUserPaymentMethodsSchema = z.object({})

/**
 * Mapping of function names to their validation schemas
 */
const VALIDATION_SCHEMAS = {
  getUserInfo: GetUserInfoSchema,
  searchFlights: SearchFlightsSchema,
  getUserBookings: GetUserBookingsSchema,
  getBookingDetails: GetBookingDetailsSchema,
  createBooking: CreateBookingSchema,
  cancelBooking: CancelBookingSchema,
  getUserPaymentMethods: GetUserPaymentMethodsSchema
} as const

/**
 * Validate function parameters using the appropriate Zod schema
 */
export function validateFunctionParameters(
  functionName: string,
  parameters: any
): ValidationResult {
  const schema = VALIDATION_SCHEMAS[functionName as keyof typeof VALIDATION_SCHEMAS]
  
  if (!schema) {
    return {
      valid: false,
      errors: [`No validation schema found for function: ${functionName}`]
    }
  }

  try {
    const validatedData = schema.parse(parameters)
    return {
      valid: true,
      sanitizedData: validatedData
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => {
        const path = err.path.join('.')
        return path ? `${path}: ${err.message}` : err.message
      })
      
      return {
        valid: false,
        errors
      }
    }
    
    return {
      valid: false,
      errors: ['Unknown validation error occurred']
    }
  }
}

/**
 * Get validation schema for a specific function (for testing)
 */
export function getValidationSchema(functionName: string) {
  return VALIDATION_SCHEMAS[functionName as keyof typeof VALIDATION_SCHEMAS] || null
}

/**
 * Check if parameters are safe to use (basic sanitization check)
 */
export function sanitizeParameters(parameters: any): any {
  if (typeof parameters !== 'object' || parameters === null) {
    return parameters
  }

  const sanitized: any = {}
  
  for (const [key, value] of Object.entries(parameters)) {
    if (typeof value === 'string') {
      // Basic string sanitization
      sanitized[key] = value.trim()
    } else if (Array.isArray(value)) {
      // Recursively sanitize arrays
      sanitized[key] = value.map(item => 
        typeof item === 'object' ? sanitizeParameters(item) : item
      )
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize objects
      sanitized[key] = sanitizeParameters(value)
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}