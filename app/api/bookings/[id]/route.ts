import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const bookings = JSON.parse(globalThis.localStorage?.getItem("skyBooker_bookings") || "[]")
    const booking = bookings.find((b: any) => b.id === params.id)

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    return NextResponse.json({ booking })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch booking" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const updates = await request.json()
    const bookings = JSON.parse(globalThis.localStorage?.getItem("skyBooker_bookings") || "[]")

    const bookingIndex = bookings.findIndex((b: any) => b.id === params.id)
    if (bookingIndex === -1) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    bookings[bookingIndex] = { ...bookings[bookingIndex], ...updates, updatedAt: new Date().toISOString() }
    globalThis.localStorage?.setItem("skyBooker_bookings", JSON.stringify(bookings))

    return NextResponse.json({ booking: bookings[bookingIndex] })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const bookings = JSON.parse(globalThis.localStorage?.getItem("skyBooker_bookings") || "[]")
    const filteredBookings = bookings.filter((b: any) => b.id !== params.id)

    if (bookings.length === filteredBookings.length) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    globalThis.localStorage?.setItem("skyBooker_bookings", JSON.stringify(filteredBookings))

    return NextResponse.json({ message: "Booking cancelled successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 })
  }
}
