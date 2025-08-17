import { type NextRequest, NextResponse } from "next/server"
import { getDB, getUserByEmail } from "@/lib/services/database-service"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Initialize database
    await getDB();

    // Validate user against database
    const user = await getUserByEmail(email)

    if (!user || user.password !== password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      user: userWithoutPassword,
      token: `token_${user.id}`, // In real app, generate JWT
    })
  } catch (error) {
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}