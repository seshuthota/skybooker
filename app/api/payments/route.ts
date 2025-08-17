import { type NextRequest, NextResponse } from "next/server"
import { getDB, createPaymentMethod } from "@/lib/services/database-service"

export async function POST(request: NextRequest) {
  try {
    const { amount, paymentMethod, bookingId, userId } = await request.json()

    // Initialize database
    await getDB();

    // Simulate payment processing
    const paymentId = `PAY_${Date.now()}`

    // In a real app, this would integrate with Stripe, PayPal, etc.
    const payment = {
      id: paymentId,
      amount,
      paymentMethod,
      bookingId,
      userId,
      status: "completed",
      transactionId: `TXN_${Date.now()}`,
      processedAt: new Date().toISOString(),
    }

    // If this is a request to save a payment method, save it to the database
    if (paymentMethod.saveForLater) {
      const paymentMethodData = {
        id: `PM_${Date.now()}`,
        userId,
        cardType: paymentMethod.cardType,
        last4: paymentMethod.last4,
        expiryMonth: paymentMethod.expiryMonth,
        expiryYear: paymentMethod.expiryYear,
        cardName: paymentMethod.cardName,
        createdAt: new Date().toISOString(),
      }

      await createPaymentMethod(paymentMethodData)
    }

    return NextResponse.json({ payment })
  } catch (error) {
    return NextResponse.json({ error: "Payment processing failed" }, { status: 500 })
  }
}