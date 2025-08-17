import { type NextRequest, NextResponse } from "next/server"
import { getDB, getPaymentMethodsByUserId, createPaymentMethod, deletePaymentMethod } from "@/lib/services/database-service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Initialize database
    await getDB();
    
    const paymentMethods = await getPaymentMethodsByUserId(params.id)

    return NextResponse.json({ paymentMethods })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch payment methods" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const paymentMethodData = await request.json()

    // Initialize database
    await getDB();
    
    const newPaymentMethod = {
      id: Date.now().toString(),
      userId: params.id,
      ...paymentMethodData,
      createdAt: new Date().toISOString(),
    }

    const paymentMethod = await createPaymentMethod(newPaymentMethod)

    return NextResponse.json({ paymentMethod })
  } catch (error) {
    return NextResponse.json({ error: "Failed to save payment method" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Initialize database
    await getDB();
    
    await deletePaymentMethod(params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete payment method" }, { status: 500 })
  }
}