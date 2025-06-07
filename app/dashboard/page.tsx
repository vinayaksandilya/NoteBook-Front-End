"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

// This page will redirect to /dashboard/my-files by default.
// The logic is mostly handled in app/page.tsx and AuthContext for initial routing.
// This can be a fallback or a specific dashboard overview if needed.
export default function DashboardPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/dashboard/create-course")
  }, [router])

  return null // Or a loading state
}
