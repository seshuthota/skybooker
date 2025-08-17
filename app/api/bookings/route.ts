import { type NextRequest, NextResponse } from "next/server"
import { getDB, getBookingsByUserId, createBooking, getBookingById } from "@/lib/services/database-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Initialize database
    await getDB()
    
    const bookings = await getBookingsByUserId(userId)

    return NextResponse.json({ bookings })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json()

    // Initialize database
    await getDB()

    // In a real app, we would validate the booking data and check availability
    const newBooking = {
      id: `BK${Date.now()}`,
      ...bookingData,
      bookingDate: new Date().toISOString(),
    }

    const booking = await createBooking(newBooking)

    return NextResponse.json({ booking })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
  }
}