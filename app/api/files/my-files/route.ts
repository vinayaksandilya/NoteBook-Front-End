import { NextResponse } from "next/server"
import { headers } from "next/headers"

// Mock file data
const mockFilesDb = [
  {
    id: "file1",
    userId: "1",
    filename: "Introduction to AI.pdf",
    uploadDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    size: 1024 * 1024 * 2,
    type: "application/pdf",
    url: "/placeholder.pdf",
  },
  {
    id: "file2",
    userId: "1",
    filename: "Advanced Machine Learning.pdf",
    uploadDate: new Date(Date.now() - 86400000).toISOString(),
    size: 1024 * 1024 * 5,
    type: "application/pdf",
    url: "/placeholder.pdf",
  },
  {
    id: "file3",
    userId: "2",
    filename: "Neuroscience Basics.pdf",
    uploadDate: new Date().toISOString(),
    size: 1024 * 1024 * 1.5,
    type: "application/pdf",
    url: "/placeholder.pdf",
  },
]

export async function GET(request: Request) {
  const authorization = headers().get("Authorization")
  if (!authorization || !authorization.startsWith("Bearer fake-jwt-token-for-")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }
  // Extract mock user ID from token
  const userId = authorization.split("-")[3]

  const userFiles = mockFilesDb.filter((file) => file.userId === userId)
  return NextResponse.json({ files: userFiles })
}
