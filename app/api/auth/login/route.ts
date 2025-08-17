import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getDB, getUserByEmail } from "@/lib/services/database-service"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Initialize database
    await getDB();

    // Validate user against database
    const user = await getUserByEmail(email)

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Compare password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
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