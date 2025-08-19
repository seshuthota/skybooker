import { z } from 'zod'

// Minimal local tool helper to avoid importing SDKs in tests.
type ToolInvoke = (runContext: any, input: string) => Promise<any>
export type Tool = {
  type: 'function'
  name: string
  description: string
  parameters: any
  strict: boolean
  invoke: ToolInvoke
}

function tool<T extends Record<string, any>>(options: {
  name: string
  description: string
  parameters: any
  strict?: boolean
  execute: (input: T, runContext: any) => Promise<any>
}): Tool {
  const strict = options.strict ?? true
  return {
    type: 'function',
    name: options.name,
    description: options.description,
    parameters: options.parameters,
    strict,
    async invoke(_runContext: any, input: string) {
      // Match SDK behavior: parse JSON input and pass to execute
      const parsed = typeof input === 'string' && input.trim() ? JSON.parse(input) : {}
      return options.execute(parsed as T, _runContext)
    },
  }
}

// Shared schemas
const passengerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().describe('YYYY-MM-DD'),
  gender: z.string().optional(),
})

const contactSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(7).describe('E.164 or local format'),
})

export const searchFlightsTool = tool({
  name: 'search_flights',
  description:
    'Search for available flights given origin, destination, dates, passengers, and preferences. Returns a list of flight options.',
  parameters: z.object({
    from: z.string().min(2).describe('Departure city or airport code, e.g., JFK or New York'),
    to: z.string().min(2).describe('Arrival city or airport code, e.g., LAX or Los Angeles'),
    departDate: z.string().min(8).describe('Departure date in YYYY-MM-DD'),
    returnDate: z.string().min(8).describe('Return date in YYYY-MM-DD (optional)').optional(),
    passengers: z.number().int().min(1).default(1),
    cabinClass: z.enum(['economy', 'premium_economy', 'business', 'first']).default('economy'),
    nonstop: z.boolean().optional(),
    tripType: z.enum(['oneway', 'roundtrip']).default('oneway'),
  }),
  strict: true,
  async execute(input) {
    const params = new URLSearchParams()
    params.set('from', input.from)
    params.set('to', input.to)
    params.set('departDate', input.departDate)
    if (input.returnDate) params.set('returnDate', input.returnDate)
    params.set('passengers', String(input.passengers ?? 1))
    params.set('tripType', input.tripType ?? 'oneway')

    const resp = await fetch(`/api/flights/search?${params.toString()}`)
    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      throw new Error(`search_flights failed: ${resp.status} ${text}`)
    }
    const data = await resp.json()
    return {
      results: data.flights ?? [],
      searchParams: data.searchParams ?? input,
    }
  },
})

export const bookFlightTool = tool({
  name: 'book_flight',
  description:
    'Create a booking for a selected flight. Requires userId, flightId, passenger list, and contact info. Returns booking details.',
  parameters: z.object({
    userId: z.string().min(1),
    flightId: z.string().min(1),
    passengers: z.array(passengerSchema).min(1),
    contact: contactSchema,
    notes: z.string().optional(),
  }),
  strict: true,
  async execute(input) {
    const resp = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: input.userId,
        flightId: input.flightId,
        passengers: input.passengers,
        contact: input.contact,
        notes: input.notes,
      }),
    })
    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      throw new Error(`book_flight failed: ${resp.status} ${text}`)
    }
    const data = await resp.json()
    return data.booking
  },
})

export const getUserProfileTool = tool({
  name: 'get_user_profile',
  description: 'Fetch the current user profile by userId (without sensitive fields).',
  parameters: z.object({ userId: z.string().min(1) }),
  strict: true,
  async execute(input) {
    const resp = await fetch(`/api/users/${encodeURIComponent(input.userId)}`)
    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      throw new Error(`get_user_profile failed: ${resp.status} ${text}`)
    }
    const data = await resp.json()
    return data.user
  },
})

export const getUserBookingsTool = tool({
  name: 'get_user_bookings',
  description: 'List bookings for a given user.',
  parameters: z.object({ userId: z.string().min(1) }),
  strict: true,
  async execute(input) {
    const params = new URLSearchParams({ userId: input.userId })
    const resp = await fetch(`/api/bookings?${params.toString()}`)
    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      throw new Error(`get_user_bookings failed: ${resp.status} ${text}`)
    }
    const data = await resp.json()
    return data.bookings ?? []
  },
})

export const getBookingByIdTool = tool({
  name: 'get_booking_by_id',
  description: 'Retrieve details for a specific booking by bookingId.',
  parameters: z.object({ bookingId: z.string().min(1) }),
  strict: true,
  async execute(input) {
    const resp = await fetch(`/api/bookings/${encodeURIComponent(input.bookingId)}`)
    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      throw new Error(`get_booking_by_id failed: ${resp.status} ${text}`)
    }
    const data = await resp.json()
    return data.booking
  },
})

export const cancelBookingTool = tool({
  name: 'cancel_booking',
  description: 'Cancel an existing booking by bookingId.',
  parameters: z.object({ bookingId: z.string().min(1) }),
  strict: true,
  async execute(input) {
    const resp = await fetch(`/api/bookings/${encodeURIComponent(input.bookingId)}`, {
      method: 'DELETE',
    })
    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      throw new Error(`cancel_booking failed: ${resp.status} ${text}`)
    }
    const data = await resp.json().catch(() => ({}))
    return data?.message ?? 'Booking cancelled'
  },
})

export const assistantTools: Tool[] = [
  searchFlightsTool,
  bookFlightTool,
  getUserProfileTool,
  getUserBookingsTool,
  getBookingByIdTool,
  cancelBookingTool,
]

export type AssistantToolName =
  | 'search_flights'
  | 'book_flight'
  | 'get_user_profile'
  | 'get_user_bookings'
  | 'get_booking_by_id'
  | 'cancel_booking'
