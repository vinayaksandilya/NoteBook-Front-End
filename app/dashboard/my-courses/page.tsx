"use client"

import * as React from "react"
import Link from "next/link"
import { Book, Loader2, AlertTriangle, PlusCircle } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

interface CourseItem {
  id: string
  title: string
  description: string
  created_at: string // ISO string
  // Add other relevant fields from API if needed, e.g., updated_at, user_id
}

export default function MyCoursesPage() {
  const [courses, setCourses] = React.useState<CourseItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()

  const fetchCourses = React.useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await api.get("/api/courses/my-courses")
      setCourses(data || []) // API returns an array directly
    } catch (err: any) {
      setError(err.message || "Failed to fetch courses.")
      toast.error(err.message || "Failed to fetch courses.")
    } finally {
      setIsLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    if (user) {
      fetchCourses()
    } else {
      // If no user, don't attempt to load, or redirect via AuthContext
      setIsLoading(false)
    }
  }, [fetchCourses, user])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading your courses...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertTriangle className="mr-2 h-5 w-5" /> Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <Button onClick={fetchCourses} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!user && !isLoading) {
    // This state should ideally be handled by the AuthContext redirecting to login
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-xl font-semibold">Authentication Error</p>
        <p className="text-muted-foreground">Please log in to view your courses.</p>
        <Button asChild className="mt-4">
          <Link href="/login">Go to Login</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Courses</h1>
        <Button onClick={() => router.push("/dashboard/create-course")}>
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Course
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card className="mt-4">
          <CardContent className="pt-6 text-center">
            <Book className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No courses yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Create your first course from a PDF.</p>
            <Button className="mt-4" onClick={() => router.push("/dashboard/create-course")}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Course
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-4">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium max-w-xs truncate">{course.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-md truncate">
                      {course.description}
                    </TableCell>
                    <TableCell>{format(new Date(course.created_at), "PPp")}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/courses/${course.id}`)}
                      >
                        View Details
                      </Button>
                      {/* Add other actions like Edit, Delete if applicable */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  )
}
