
import { z } from 'zod';
import {
  getUserBookingsSchema,
  getBookingDetailsSchema,
  createBookingSchema,
  cancelBookingSchema,
} from '../validation';
import { FunctionCallContext } from '@/lib/functions/types';
import { getDB, createBooking as dbCreateBooking, getBookingsByUserId } from '@/lib/services/database-service';

// Helper functions for localStorage persistence
function getBookingsFromStorage(): any[] {
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return JSON.parse(globalThis.localStorage.getItem("skyBooker_bookings") || "[]")
  }
  return []
}

function saveBookingsToStorage(bookings: any[]): void {
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    globalThis.localStorage.setItem("skyBooker_bookings", JSON.stringify(bookings))
  }
}

async function getUserBookingsAPI(userId: string, query: z.infer<typeof getUserBookingsSchema>) {
  // Initialize database and get bookings
  await getDB();
  let bookings = await getBookingsByUserId(userId);
  
  if (query.status && query.status !== 'all') {
    bookings = bookings.filter(b => b.status === query.status);
  }
  return { bookings: bookings.slice(0, query.limit) };
}

async function getBookingDetailsAPI(userId: string, bookingId: string) {
  // Initialize database and get booking
  await getDB();
  const booking = await getBookingById(bookingId);
  
  if (!booking || booking.userId !== userId) {
    return { error: 'Booking not found' };
  }
  
  return { booking };
}

// Mock flight data - same as in flight-functions.ts for consistency
const mockFlights = [
  {
    id: "FL001",
    airline: "SkyWings",
    flightNumber: "SW 1234",
    departure: { airport: "JFK", city: "New York", time: "06:00" },
    arrival: { airport: "LAX", city: "Los Angeles", time: "09:30" },
    duration: "5h 30m",
    price: 299,
    stops: 0,
    aircraft: "Boeing 737",
  },
  {
    id: "FL002",
    airline: "AirConnect",
    flightNumber: "AC 5678",
    departure: { airport: "JFK", city: "New York", time: "08:15" },
    arrival: { airport: "LAX", city: "Los Angeles", time: "11:45" },
    duration: "5h 30m",
    price: 349,
    stops: 0,
    aircraft: "Airbus A320",
  },
  {
    id: "FL009",
    airline: "British Airways",
    flightNumber: "BA 1501",
    departure: { airport: "JFK", city: "New York", time: "22:30" },
    arrival: { airport: "LHR", city: "London", time: "10:00" },
    duration: "7h 30m",
    price: 649,
    stops: 0,
    aircraft: "Boeing 777",
  },
  {
    id: "FL010",
    airline: "Virgin Atlantic",
    flightNumber: "VS 3",
    departure: { airport: "JFK", city: "New York", time: "19:15" },
    arrival: { airport: "LHR", city: "London", time: "06:45" },
    duration: "7h 30m",
    price: 699,
    stops: 0,
    aircraft: "Airbus A350",
  },
  {
    id: "FL011",
    airline: "AirConnect",
    flightNumber: "AC 4455",
    departure: { airport: "JFK", city: "New York", time: "14:30" },
    arrival: { airport: "LGW", city: "London", time: "02:00" },
    duration: "7h 30m",
    price: 599,
    stops: 0,
    aircraft: "Boeing 787",
  },
  {
    id: "FL015",
    airline: "Air India",
    flightNumber: "AI 101",
    departure: { airport: "JFK", city: "New York", time: "01:30" },
    arrival: { airport: "BOM", city: "Mumbai", time: "06:00" },
    duration: "15h 30m",
    price: 899,
    stops: 1,
    aircraft: "Boeing 787",
  },
];

// Helper function to get flight details by ID
function getFlightById(flightId: string) {
  return mockFlights.find(flight => flight.id === flightId || flight.flightNumber === flightId);
}

async function createBookingAPI(userId: string, bookingDetails: z.infer<typeof createBookingSchema>) {
  // Initialize database
  await getDB();
  
  // Get flight details from mock data
  const flightData = getFlightById(bookingDetails.flightId);
  
  if (!flightData) {
    throw new Error(`Flight ${bookingDetails.flightId} not found`);
  }
  
  // Create new booking with a unique ID based on flight and timestamp
  const timestamp = new Date().toISOString().split('T')[0]
  const bookingId = `${bookingDetails.flightId}-${timestamp}-${userId.slice(-4)}-${Date.now().toString().slice(-6)}`
  
  // Calculate departure and arrival dates (tomorrow for next available flights)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const flightDate = tomorrow.toISOString().split('T')[0];
  
  // Create enriched booking data that matches dashboard expectations
  const newBooking = {
    id: bookingId,
    userId,
    flight: {
      airline: flightData.airline,
      flightNumber: flightData.flightNumber,
      departure: {
        airport: flightData.departure.airport,
        city: flightData.departure.city,
        time: flightData.departure.time,
        date: flightDate
      },
      arrival: {
        airport: flightData.arrival.airport,
        city: flightData.arrival.city,
        time: flightData.arrival.time,
        date: flightDate
      },
      duration: flightData.duration,
      class: "Economy" // Default class
    },
    passengers: bookingDetails.passengers,
    contactInfo: bookingDetails.contactInfo,
    paymentMethodId: bookingDetails.paymentMethodId,
    bookingDate: timestamp,
    status: 'confirmed',
    totalPrice: flightData.price + 89, // Flight price + taxes/fees
  };
  
  // Save to database using the database service
  try {
    await dbCreateBooking(newBooking);
    console.log('[BOOKING_CREATED] New booking saved to database with enriched flight data:', newBooking)
    return { booking: newBooking };
  } catch (error) {
    console.error('[BOOKING_ERROR] Failed to save booking to database:', error)
    throw new Error('Failed to save booking to database');
  }
}

async function cancelBookingAPI(userId: string, bookingId: string) {
  // Get bookings from localStorage
  const allBookings = getBookingsFromStorage()
  const bookingIndex = allBookings.findIndex(b => b.userId === userId && b.id === bookingId);
  if (bookingIndex === -1) {
    return { error: 'Booking not found' };
  }
  allBookings[bookingIndex].status = 'cancelled';
  saveBookingsToStorage(allBookings);
  return { success: true, booking: allBookings[bookingIndex] };
}

export async function getUserBookings(
  query: z.infer<typeof getUserBookingsSchema>,
  context: FunctionCallContext
) {
  if (!context.isAuthenticated || !context.user) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    const result = await getUserBookingsAPI(context.user.id, query);
    if (result.bookings.length > 0) {
      return {
        success: true,
        message: `Found ${result.bookings.length} bookings.`,
        data: result.bookings,
      };
    } else {
      return { success: true, message: 'No bookings found.', data: [] };
    }
  } catch (error) {
    return { success: false, error: 'Failed to retrieve bookings.' };
  }
}

export async function getBookingDetails(
  { bookingId }: z.infer<typeof getBookingDetailsSchema>,
  context: FunctionCallContext
) {
  if (!context.isAuthenticated || !context.user) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    const result = await getBookingDetailsAPI(context.user.id, bookingId);
    if (result.error) {
      return { success: false, error: result.error };
    }
    return { success: true, data: result.booking };
  } catch (error) {
    return { success: false, error: 'Failed to retrieve booking details.' };
  }
}

// Helper function to enrich booking details with user profile data
function enrichBookingWithUserData(
  bookingDetails: z.infer<typeof createBookingSchema>,
  user: any
): z.infer<typeof createBookingSchema> {
  const enrichedDetails = { ...bookingDetails };
  
  // Enrich passenger information with user profile data
  if (enrichedDetails.passengers && enrichedDetails.passengers.length > 0) {
    enrichedDetails.passengers = enrichedDetails.passengers.map((passenger, index) => {
      // For the first passenger, use authenticated user's data if missing
      if (index === 0) {
        return {
          ...passenger,
          firstName: passenger.firstName || user.firstName || passenger.firstName,
          lastName: passenger.lastName || user.lastName || passenger.lastName,
          dateOfBirth: passenger.dateOfBirth || user.dateOfBirth || '1990-01-01' // Fallback only if no user data
        };
      }
      // For additional passengers, use provided data or reasonable defaults
      return {
        ...passenger,
        dateOfBirth: passenger.dateOfBirth || '1990-01-01'
      };
    });
  }
  
  // Enrich contact information with user profile data
  if (enrichedDetails.contactInfo) {
    enrichedDetails.contactInfo = {
      ...enrichedDetails.contactInfo,
      email: enrichedDetails.contactInfo.email || user.email,
      phone: enrichedDetails.contactInfo.phone || user.phone || '1234567890' // Fallback only if no user data
    };
  }
  
  return enrichedDetails;
}

export async function createBooking(
  bookingDetails: z.infer<typeof createBookingSchema>,
  context: FunctionCallContext
) {
  if (!context.isAuthenticated || !context.user) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    // Enrich booking details with authenticated user's profile data
    const enrichedBookingDetails = enrichBookingWithUserData(bookingDetails, context.user);
    
    console.log('[BOOKING_ENRICHED] Original:', JSON.stringify(bookingDetails, null, 2));
    console.log('[BOOKING_ENRICHED] Enriched:', JSON.stringify(enrichedBookingDetails, null, 2));
    
    const result = await createBookingAPI(context.user.id, enrichedBookingDetails);
    return { success: true, message: 'Booking created successfully.', data: result.booking };
  } catch (error) {
    return { success: false, error: 'Failed to create booking.' };
  }
}

export async function cancelBooking(
  { bookingId }: z.infer<typeof cancelBookingSchema>,
  context: FunctionCallContext
) {
  if (!context.isAuthenticated || !context.user) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    const result = await cancelBookingAPI(context.user.id, bookingId);
    if (result.error) {
      return { success: false, error: result.error };
    }
    return { success: true, message: 'Booking cancelled successfully.', data: result.booking };
  } catch (error) {
    return { success: false, error: 'Failed to cancel booking.' };
  }
}
