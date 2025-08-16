import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // In a real app, this would validate against a database
    // For now, we'll simulate user validation
    const users = JSON.parse(globalThis.localStorage?.getItem("skyBooker_users") || "[]")
    const user = users.find((u: any) => u.email === email && u.password === password)

    if (!user) {
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
