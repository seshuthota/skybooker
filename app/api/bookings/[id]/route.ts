import { type NextRequest, NextResponse } from "next/server"
import { getDB, getBookingById, updateBooking } from "@/lib/services/database-service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Initialize database
    await getDB();
    
    const booking = await getBookingById(params.id)

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
    
    // Initialize database
    await getDB();

    const booking = await getBookingById(params.id);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    const updatedBooking = await updateBooking(params.id, updates)

    return NextResponse.json({ booking: updatedBooking })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Initialize database
    await getDB();

    const booking = await getBookingById(params.id);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    await updateBooking(params.id, { status: "cancelled" })

    return NextResponse.json({ message: "Booking cancelled successfully" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 })
  }
}