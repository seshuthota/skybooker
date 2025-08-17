import { type NextRequest, NextResponse } from "next/server"
import { getDB, getUserById } from "@/lib/services/database-service"

export async function GET(request: NextRequest) {
  try {
    // Check for Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    // Extract user ID from token (simplified token format: "token_${userId}")
    if (!token.startsWith('token_')) {
      return NextResponse.json({ error: "Invalid token format" }, { status: 401 })
    }

    const userId = token.substring(6) // Remove 'token_' prefix
    
    // Initialize database and fetch user
    await getDB()
    const user = await getUserById(userId)

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      user: userWithoutPassword
    })
  } catch (error) {
    console.error("Token validation error:", error)
    return NextResponse.json({ error: "Token validation failed" }, { status: 500 })
  }
}