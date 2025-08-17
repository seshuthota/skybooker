/**
 * Function Handler Registration
 * 
 * Central location for registering all function handlers with the executor
 */

import { registerFunctionHandler } from '@/lib/services/function-executor'
import { getUserInfo } from './user-functions'
import { searchFlights } from './flight-functions'
import { getUserBookings, getBookingDetails, createBooking } from './booking-functions'

/**
 * Register all function handlers
 * This should be called during application initialization
 */
export function registerAllFunctionHandlers(): void {
  // User functions
  registerFunctionHandler('getUserInfo', getUserInfo)

  // Flight functions
  registerFunctionHandler('searchFlights', searchFlights)

  // Booking functions
  registerFunctionHandler('getUserBookings', getUserBookings)
  registerFunctionHandler('getBookingDetails', getBookingDetails)
  registerFunctionHandler('createBooking', createBooking)
  // registerFunctionHandler('cancelBooking', cancelBooking)

  // Payment functions will be added here
  // registerFunctionHandler('getUserPaymentMethods', getUserPaymentMethods)

  console.log('All function handlers registered successfully')
}

/**
 * Get list of registered function names
 */
export function getRegisteredFunctionNames(): string[] {
  return [
    'getUserInfo',
    'searchFlights',
    'getUserBookings',
    'getBookingDetails',
    'createBooking'
    // More will be added as we implement them
  ]
}

// Re-export all handlers for convenient importing
export { getUserInfo } from './user-functions'
export { searchFlights } from './flight-functions'
export { getUserBookings, getBookingDetails, createBooking } from './booking-functions'