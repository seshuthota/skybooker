import { type NextRequest, NextResponse } from "next/server"
import { getDB, getUserByEmail, createUser } from "@/lib/services/database-service"

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await request.json()

    // Initialize database
    await getDB();

    // Check if user already exists
    const existingUser = await getUserByEmail(email)
    
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    const newUser = {
      id: Date.now().toString(),
      email,
      password, // In real app, hash this
      firstName,
      lastName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const user = await createUser(newUser)

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      user: userWithoutPassword,
      token: `token_${newUser.id}`,
    })
  } catch (error) {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}