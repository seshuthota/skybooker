/**
 * Function definitions for the SkyBooker assistant
 * 
 * Each function is defined with OpenAI-compatible schema and includes
 * detailed parameter specifications for proper LLM integration.
 */

import { FunctionDefinition } from './types'

/**
 * Get current user's profile information
 */
export const GET_USER_INFO_FUNCTION: FunctionDefinition = {
  name: 'getUserInfo',
  description: 'Get the current authenticated user\'s profile information including name, email, and account details',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  }
}

/**
 * Search for flights based on travel criteria
 */
export const SEARCH_FLIGHTS_FUNCTION: FunctionDefinition = {
  name: 'searchFlights',
  description: 'Search for available flights based on origin, destination, dates, and other travel preferences',
  parameters: {
    type: 'object',
    properties: {
      from: {
        type: 'string',
        description: 'Origin city name or airport code (e.g., "New York", "London", "Mumbai", "JFK", "LHR", "BOM")'
      },
      to: {
        type: 'string',
        description: 'Destination city name or airport code (e.g., "New York", "London", "Mumbai", "JFK", "LHR", "BOM")'
      },
      departDate: {
        type: 'string',
        description: 'Departure date in YYYY-MM-DD format (optional, defaults to tomorrow if not provided)',
        format: 'date'
      },
      returnDate: {
        type: 'string',
        description: 'Return date in YYYY-MM-DD format (required for round trip)',
        format: 'date'
      },
      passengers: {
        type: 'number',
        description: 'Number of passengers (1-9)',
        minimum: 1,
        maximum: 9
      },
      tripType: {
        type: 'string',
        description: 'Type of trip',
        enum: ['roundtrip', 'oneway']
      },
      class: {
        type: 'string',
        description: 'Travel class preference',
        enum: ['economy', 'business', 'first']
      }
    },
    required: ['from', 'to']
  }
}

/**
 * Get user's booking history
 */
export const GET_USER_BOOKINGS_FUNCTION: FunctionDefinition = {
  name: 'getUserBookings',
  description: 'Retrieve the current user\'s flight booking history',
  parameters: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of bookings to return (default: 10)',
        minimum: 1,
        maximum: 50
      },
      status: {
        type: 'string',
        description: 'Filter bookings by status',
        enum: ['all', 'upcoming', 'completed', 'cancelled']
      }
    },
    required: []
  }
}

/**
 * Get detailed information for a specific booking
 */
export const GET_BOOKING_DETAILS_FUNCTION: FunctionDefinition = {
  name: 'getBookingDetails',
  description: 'Get detailed information for a specific booking by ID or confirmation number',
  parameters: {
    type: 'object',
    properties: {
      bookingId: {
        type: 'string',
        description: 'Booking ID or confirmation number'
      }
    },
    required: ['bookingId']
  }
}

/**
 * Create a new flight booking
 */
export const CREATE_BOOKING_FUNCTION: FunctionDefinition = {
  name: 'createBooking',
  description: 'Create a new flight booking. For authenticated users, passenger and contact info will be automatically filled from their profile if not provided.',
  parameters: {
    type: 'object',
    properties: {
      flightId: {
        type: 'string',
        description: 'ID or flight number of the flight to book (e.g., "FL011" or "AC 4455")'
      },
      passengers: {
        type: 'array',
        description: 'List of passenger information (optional for single authenticated user - will use profile data)',
        items: {
          type: 'object',
          properties: {
            firstName: {
              type: 'string',
              description: 'Passenger first name (optional - will use authenticated user\'s name if not provided)'
            },
            lastName: {
              type: 'string',
              description: 'Passenger last name (optional - will use authenticated user\'s name if not provided)'
            },
            dateOfBirth: {
              type: 'string',
              description: 'Date of birth in YYYY-MM-DD format (optional)',
              format: 'date'
            }
          }
        }
      },
      contactInfo: {
        type: 'object',
        description: 'Contact information (optional - will use authenticated user\'s email if not provided)',
        properties: {
          email: {
            type: 'string',
            description: 'Contact email address (optional)',
            format: 'email'
          },
          phone: {
            type: 'string',
            description: 'Contact phone number (optional)'
          }
        }
      }
    },
    required: ['flightId']
  }
}

/**
 * Cancel an existing booking
 */
export const CANCEL_BOOKING_FUNCTION: FunctionDefinition = {
  name: 'cancelBooking',
  description: 'Cancel an existing flight booking by ID or confirmation number',
  parameters: {
    type: 'object',
    properties: {
      bookingId: {
        type: 'string',
        description: 'Booking ID or confirmation number to cancel'
      },
      reason: {
        type: 'string',
        description: 'Reason for cancellation (optional)',
        enum: ['change_of_plans', 'emergency', 'illness', 'other']
      }
    },
    required: ['bookingId']
  }
}

/**
 * Get user's saved payment methods
 */
export const GET_USER_PAYMENT_METHODS_FUNCTION: FunctionDefinition = {
  name: 'getUserPaymentMethods',
  description: 'Get the current user\'s saved payment methods with masked card information',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  }
}