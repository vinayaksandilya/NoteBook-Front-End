"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, AlertTriangle, Book, PlusCircle, FileIcon } from "lucide-react"

import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface FileItem {
  id: string
  original_name: string
  path: string
  url: string
}

interface CourseItem {
  id: string
  file_id?: string
}

interface ModelOption {
  name: string
  description: string
}

interface EngineOption {
  name: string
  description: string
}

export default function FileViewPage() {
  const params = useParams()
  const router = useRouter()
  const fileId = params.fileId as string

  const [file, setFile] = React.useState<FileItem | null>(null)
  const [courseCount, setCourseCount] = React.useState(0)
  const [models, setModels] = React.useState<Record<string, ModelOption>>({})
  const [engines, setEngines] = React.useState<Record<string, EngineOption>>({})
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [isCreatingCourse, setIsCreatingCourse] = React.useState(false)
  const [selectedModel, setSelectedModel] = React.useState<string>("")
  const [selectedEngine, setSelectedEngine] = React.useState<string>("")

  const fetchData = React.useCallback(async () => {
    if (!fileId) return
    setIsLoading(true)
    setError(null)
    try {
      // Fetch all necessary data in parallel
      const [allFiles, allCourses, availableModels, availableEngines] = await Promise.all([
        api.get("/api/files/my-files"),
        api.get("/api/courses/my-courses"),
        api.get("/api/courses/available-models"),
        api.get("/api/courses/available-engines"),
      ])

      // Find the specific file
      const currentFile = allFiles.find((f: FileItem) => f.id === fileId)
      if (!currentFile) {
        throw new Error("File not found.")
      }
      setFile(currentFile)

      // Filter courses for this file
      const coursesForFile = allCourses.filter((c: CourseItem) => c.file_id === fileId)
      setCourseCount(coursesForFile.length)

      // Set models and engines
      setModels(availableModels)
      setEngines(availableEngines)
      // Set default selections
      setSelectedModel(Object.keys(availableModels)[0] || "")
      setSelectedEngine(Object.keys(availableEngines)[0] || "")
    } catch (err: any) {
      setError(err.message || "Failed to load file details.")
      toast.error(err.message || "Failed to load file details.")
    } finally {
      setIsLoading(false)
    }
  }, [fileId])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreateCourse = async () => {
    if (!fileId || !selectedModel || !selectedEngine) {
      toast.error("Please select a model and an engine.")
      return
    }
    setIsCreatingCourse(true)
    try {
      const newCourse = await api.post("/api/courses/create-from-file", {
        fileId: fileId,
        options: {
          aiModel: selectedModel,
          pdfEngine: selectedEngine,
        },
      })
      toast.success(`Successfully created course: "${newCourse.title}"`)
      setIsCreateModalOpen(false)
      // Redirect to the new course page
      router.push(`/dashboard/courses/${newCourse.id}`)
    } catch (err: any) {
      toast.error(err.message || "Failed to create course.")
    } finally {
      setIsCreatingCourse(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="m-auto">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertTriangle className="mr-2 h-5 w-5" /> Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <Button onClick={fetchData} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!file) {
    return null // Should be covered by error state
  }

  return (
    <div className="grid h-[calc(100vh-4rem)] grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
      <div className="md:col-span-2 lg:col-span-3 h-full">
        <iframe src={file.url} className="h-full w-full rounded-lg border" title={file.original_name} />
      </div>
      <aside className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileIcon className="h-5 w-5" />
              File Details
            </CardTitle>
            <CardDescription>{file.original_name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Courses from this file</span>
              <span className="font-semibold">{courseCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Book className="h-5 w-5" />
              Course Generation
            </CardTitle>
            <CardDescription>Create a new course using this file as source material.</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New Course
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Configure New Course</DialogTitle>
                  <DialogDescription>Select the AI model and PDF engine to generate your course.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="engine-select">PDF Engine</Label>
                    <Select value={selectedEngine} onValueChange={setSelectedEngine} disabled={isCreatingCourse}>
                      <SelectTrigger id="engine-select">
                        <SelectValue placeholder="Select an engine..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(engines).map(([id, engine]) => (
                          <SelectItem key={id} value={id}>
                            {engine.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="model-select">AI Model</Label>
                    <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isCreatingCourse}>
                      <SelectTrigger id="model-select">
                        <SelectValue placeholder="Select a model..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(models).map(([id, model]) => (
                          <SelectItem key={id} value={id}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={isCreatingCourse}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCourse} disabled={isCreatingCourse}>
                    {isCreatingCourse && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate Course
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}
