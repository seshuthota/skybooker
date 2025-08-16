import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const users = JSON.parse(globalThis.localStorage?.getItem("skyBooker_users") || "[]")
    const user = users.find((u: any) => u.id === params.id)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({ user: userWithoutPassword })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const updates = await request.json()
    const users = JSON.parse(globalThis.localStorage?.getItem("skyBooker_users") || "[]")

    const userIndex = users.findIndex((u: any) => u.id === params.id)
    if (userIndex === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    users[userIndex] = { ...users[userIndex], ...updates, updatedAt: new Date().toISOString() }
    globalThis.localStorage?.setItem("skyBooker_users", JSON.stringify(users))

    // Remove password from response
    const { password: _, ...userWithoutPassword } = users[userIndex]

    return NextResponse.json({ user: userWithoutPassword })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
