import { type NextRequest, NextResponse } from "next/server"
import { getDB, getUserById, updateUser } from "@/lib/services/database-service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Initialize database
    await getDB();
    
    const user = await getUserById(params.id);

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
    
    // Initialize database
    await getDB();
    
    const user = await getUserById(params.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const updatedUser = await updateUser(params.id, { ...updates, updatedAt: new Date().toISOString() })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser

    return NextResponse.json({ user: userWithoutPassword })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}