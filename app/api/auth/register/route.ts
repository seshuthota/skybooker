import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await request.json()

    // In a real app, this would save to a database
    const users = JSON.parse(globalThis.localStorage?.getItem("skyBooker_users") || "[]")

    // Check if user already exists
    if (users.find((u: any) => u.email === email)) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    const newUser = {
      id: Date.now().toString(),
      email,
      password, // In real app, hash this
      firstName,
      lastName,
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    globalThis.localStorage?.setItem("skyBooker_users", JSON.stringify(users))

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser

    return NextResponse.json({
      user: userWithoutPassword,
      token: `token_${newUser.id}`,
    })
  } catch (error) {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
