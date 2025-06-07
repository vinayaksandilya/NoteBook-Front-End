import { NextResponse } from "next/server"
import { headers } from "next/headers"

// This needs to be consistent with the mockFilesDb in my-files/route.ts
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

export async function DELETE(request: Request, { params }: { params: { fileId: string } }) {
  const authorization = headers().get("Authorization")
  if (!authorization || !authorization.startsWith("Bearer fake-jwt-token-for-")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }
  const userId = authorization.split("-")[3]
  const fileId = params.fileId

  const fileIndex = mockFilesDb.findIndex((f) => f.id === fileId && f.userId === userId)

  if (fileIndex === -1) {
    return NextResponse.json({ message: "File not found or access denied" }, { status: 404 })
  }

  mockFilesDb.splice(fileIndex, 1) // Remove the file

  return NextResponse.json({ message: "File deleted successfully" }, { status: 200 })
}
