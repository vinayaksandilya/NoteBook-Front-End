import { NextResponse } from "next/server"
import { headers } from "next/headers"

// Mock user data store (in a real app, this would be a database)
let mockUsersDb = [
  { id: "1", username: "Test User", email: "test@example.com", passwordHash: "hashedpassword1" },
  { id: "2", username: "Another User", email: "another@example.com", passwordHash: "hashedpassword2" },
]

// Helper to find user by token (simulated)
function getUserByToken(authorization: string | null) {
  if (!authorization || !authorization.startsWith("Bearer fake-jwt-token-for-")) {
    return null
  }
  const userId = authorization.split("-")[3] // e.g., "fake-jwt-token-for-1" -> "1"
  return mockUsersDb.find((u) => u.id === userId)
}

export async function GET(request: Request) {
  const authorization = headers().get("Authorization")
  const user = getUserByToken(authorization)

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  // Return user profile (excluding password)
  const { passwordHash, ...userProfile } = user
  return NextResponse.json(userProfile)
}

export async function PUT(request: Request) {
  const authorization = headers().get("Authorization")
  const user = getUserByToken(authorization)

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { username, email } = body

    // Validate input (basic example)
    if ((username && typeof username !== "string") || username.length < 3) {
      return NextResponse.json({ message: "Invalid username" }, { status: 400 })
    }
    if ((email && typeof email !== "string") || !email.includes("@")) {
      return NextResponse.json({ message: "Invalid email" }, { status: 400 })
    }

    // Update user data
    let updated = false
    if (username && user.username !== username) {
      user.username = username
      updated = true
    }
    if (email && user.email !== email) {
      // In a real app, check if email is already taken by another user
      user.email = email
      updated = true
    }

    if (!updated) {
      return NextResponse.json({ message: "No changes provided" }, { status: 200 })
    }

    // Simulate saving to DB
    mockUsersDb = mockUsersDb.map((u) => (u.id === user.id ? user : u))

    const { passwordHash, ...updatedUserProfile } = user
    return NextResponse.json(updatedUserProfile, { status: 200 })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ message: "Error updating profile" }, { status: 500 })
  }
}
