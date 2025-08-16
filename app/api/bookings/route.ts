import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const bookings = JSON.parse(globalThis.localStorage?.getItem("skyBooker_bookings") || "[]")
    const userBookings = bookings.filter((booking: any) => booking.userId === userId)

    return NextResponse.json({ bookings: userBookings })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json()

    const bookings = JSON.parse(globalThis.localStorage?.getItem("skyBooker_bookings") || "[]")

    const newBooking = {
      id: `BK${Date.now()}`,
      ...bookingData,
      status: "confirmed",
      createdAt: new Date().toISOString(),
    }

    bookings.push(newBooking)
    globalThis.localStorage?.setItem("skyBooker_bookings", JSON.stringify(bookings))

    return NextResponse.json({ booking: newBooking })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 })
  }
}
