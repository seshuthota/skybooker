import { type NextRequest, NextResponse } from "next/server"
import { 
  getDB, 
  createUser, 
  createBooking, 
  createPaymentMethod 
} from "@/lib/services/database-service"

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json()

    // Initialize database
    await getDB();

    switch (type) {
      case 'user':
        // Create user in database
        const user = await createUser(data)
        return NextResponse.json({ success: true, user })
        
      case 'booking':
        // Create booking in database
        const booking = await createBooking(data)
        return NextResponse.json({ success: true, booking })
        
      case 'paymentMethod':
        // Create payment method in database
        const paymentMethod = await createPaymentMethod(data)
        return NextResponse.json({ success: true, paymentMethod })
        
      default:
        return NextResponse.json({ error: "Invalid migration type" }, { status: 400 })
    }
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json({ error: "Migration failed" }, { status: 500 })
  }
}