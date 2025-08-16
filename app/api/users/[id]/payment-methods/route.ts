import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const paymentMethods = JSON.parse(globalThis.localStorage?.getItem(`skyBooker_cards_${params.id}`) || "[]")

    return NextResponse.json({ paymentMethods })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch payment methods" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const paymentMethodData = await request.json()

    const paymentMethods = JSON.parse(globalThis.localStorage?.getItem(`skyBooker_cards_${params.id}`) || "[]")

    const newPaymentMethod = {
      id: Date.now().toString(),
      ...paymentMethodData,
      createdAt: new Date().toISOString(),
    }

    paymentMethods.push(newPaymentMethod)
    globalThis.localStorage?.setItem(`skyBooker_cards_${params.id}`, JSON.stringify(paymentMethods))

    return NextResponse.json({ paymentMethod: newPaymentMethod })
  } catch (error) {
    return NextResponse.json({ error: "Failed to save payment method" }, { status: 500 })
  }
}
