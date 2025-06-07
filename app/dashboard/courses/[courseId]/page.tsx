"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { Loader2, AlertTriangle, Save, Download, GripVertical, ChevronDown, Trash2, Plus } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { v4 as uuidv4 } from "uuid"

import { api, API_BASE_URL } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { getToken } from "@/lib/auth" // Add this line

interface Module {
  id: string
  heading: string
  summary: string
  key_takeaways: string[]
  order_index: number
}

interface Course {
  id: string
  title: string
  description: string
  modules: Module[]
}

interface SortableModuleItemProps {
  module: Module
  onModuleChange: (id: string, field: keyof Module, value: any) => void
  onDeleteModule: (id: string) => void
  onAddTakeaway: (moduleId: string) => void
  onDeleteTakeaway: (moduleId: string, index: number) => void
}

function SortableModuleItem({
  module,
  onModuleChange,
  onDeleteModule,
  onAddTakeaway,
  onDeleteTakeaway,
}: SortableModuleItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: module.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <Card className="bg-muted/50">
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <div className="flex items-center gap-2 flex-grow">
            <div {...attributes} {...listeners} className="cursor-grab touch-none p-2">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <Input
              value={module.heading}
              onChange={(e) => onModuleChange(module.id, "heading", e.target.value)}
              className="text-lg font-semibold border-none focus-visible:ring-1"
              placeholder="Module Heading"
            />
          </div>
          <Button variant="ghost" size="icon" onClick={() => onDeleteModule(module.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid gap-4">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">Summary</Label>
              <Textarea
                value={module.summary}
                onChange={(e) => onModuleChange(module.id, "summary", e.target.value)}
                className="mt-1"
                placeholder="Module summary..."
                rows={3}
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">Key Takeaways</Label>
              <div className="grid gap-2 mt-1">
                {module.key_takeaways.map((takeaway, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={takeaway}
                      onChange={(e) => {
                        const newTakeaways = [...module.key_takeaways]
                        newTakeaways[index] = e.target.value
                        onModuleChange(module.id, "key_takeaways", newTakeaways)
                      }}
                      placeholder={`Takeaway #${index + 1}`}
                    />
                    <Button variant="ghost" size="icon" onClick={() => onDeleteTakeaway(module.id, index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => onAddTakeaway(module.id)}>
                <Plus className="mr-2 h-4 w-4" /> Add Takeaway
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CourseViewPage() {
  const params = useParams()
  const courseId = params.courseId as string

  const [course, setCourse] = React.useState<Course | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isExportingMarkdown, setIsExportingMarkdown] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const fetchCourse = React.useCallback(async () => {
    if (!courseId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await api.get(`/api/courses/${courseId}`)
      setCourse(data)
    } catch (err: any) {
      setError(err.message || "Failed to load course details.")
      toast.error(err.message || "Failed to load course details.")
    } finally {
      setIsLoading(false)
    }
  }, [courseId])

  React.useEffect(() => {
    fetchCourse()
  }, [fetchCourse])

  const handleModuleChange = (id: string, field: keyof Module, value: any) => {
    setCourse((prev) => {
      if (!prev) return null
      const newModules = prev.modules.map((m) => (m.id === id ? { ...m, [field]: value } : m))
      return { ...prev, modules: newModules }
    })
  }

  const handleAddTakeaway = (moduleId: string) => {
    setCourse((prev) => {
      if (!prev) return null
      const newModules = prev.modules.map((m) =>
        m.id === moduleId ? { ...m, key_takeaways: [...m.key_takeaways, ""] } : m,
      )
      return { ...prev, modules: newModules }
    })
  }

  const handleDeleteTakeaway = (moduleId: string, index: number) => {
    setCourse((prev) => {
      if (!prev) return null
      const newModules = prev.modules.map((m) =>
        m.id === moduleId ? { ...m, key_takeaways: m.key_takeaways.filter((_, i) => i !== index) } : m,
      )
      return { ...prev, modules: newModules }
    })
  }

  const handleAddModule = () => {
    setCourse((prev) => {
      if (!prev) return null
      const newModule: Module = {
        id: uuidv4(), // Temporary ID for React key, backend will assign real one
        heading: "New Module",
        summary: "",
        key_takeaways: [],
        order_index: prev.modules.length,
      }
      return { ...prev, modules: [...prev.modules, newModule] }
    })
  }

  const handleDeleteModule = (id: string) => {
    setCourse((prev) => {
      if (!prev) return null
      return { ...prev, modules: prev.modules.filter((m) => m.id !== id) }
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setCourse((prev) => {
        if (!prev) return null
        const oldIndex = prev.modules.findIndex((m) => m.id === active.id)
        const newIndex = prev.modules.findIndex((m) => m.id === over.id)
        return { ...prev, modules: arrayMove(prev.modules, oldIndex, newIndex) }
      })
    }
  }

  const handleSave = async () => {
    if (!course) return
    setIsSaving(true)
    try {
      // Update order_index before saving
      const courseToSave = {
        ...course,
        modules: course.modules.map((module, index) => ({
          ...module,
          order_index: index,
        })),
      }
      await api.put(`/api/courses/${courseId}`, courseToSave)
      toast.success("Course saved successfully!")
      // Refetch to get latest data from backend (e.g., new module IDs)
      fetchCourse()
    } catch (err: any) {
      toast.error(err.message || "Failed to save course.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleExport = async (format: "markdown" | "json") => {
    if (!course) return
    if (format === "json") {
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(course, null, 2))}`
      const link = document.createElement("a")
      link.href = jsonString
      link.download = `${course.title.replace(/\s+/g, "-").toLowerCase()}.json`
      link.click()
    } else if (format === "markdown") {
      if (!course) return
      setIsExportingMarkdown(true)
      try {
        const token = getToken()
        if (!token) {
          toast.error("Authentication token not found. Please log in again.")
          setIsExportingMarkdown(false)
          return
        }

        const response = await fetch(`${API_BASE_URL}/api/courses/${courseId}/export/markdown`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to export Markdown: ${response.status} ${response.statusText}. ${errorText}`)
        }

        const markdownText = await response.text()
        const blob = new Blob([markdownText], { type: "text/markdown;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `${course.title.replace(/\s+/g, "-").toLowerCase() || "course"}.md`
        document.body.appendChild(link) // Required for Firefox
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success("Markdown content downloaded.")
      } catch (err: any) {
        console.error("Markdown export error:", err)
        toast.error(err.message || "Markdown export failed.")
      } finally {
        setIsExportingMarkdown(false)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !course) {
    return (
      <Card className="m-auto">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertTriangle className="mr-2 h-5 w-5" /> Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error || "Course could not be loaded."}</p>
          <Button onClick={fetchCourse} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-1">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm p-4 -mx-4 mb-4 border-b">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Edit Course</h1>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("markdown")} disabled={isExportingMarkdown}>
                  {isExportingMarkdown ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    "As Markdown (.md)"
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("json")}>As JSON (.json)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </div>
      </header>

      <main className="space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label htmlFor="course-title">Course Title</Label>
              <Input
                id="course-title"
                value={course.title}
                onChange={(e) => setCourse({ ...course, title: e.target.value })}
                className="text-2xl font-bold h-auto p-2"
                placeholder="Course Title"
              />
            </div>
            <div>
              <Label htmlFor="course-description">Course Description</Label>
              <Textarea
                id="course-description"
                value={course.description}
                onChange={(e) => setCourse({ ...course, description: e.target.value })}
                className="text-muted-foreground"
                placeholder="Course description..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div>
          <h2 className="text-xl font-semibold mb-4">Modules</h2>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={course.modules} strategy={verticalListSortingStrategy}>
              {course.modules.map((module) => (
                <SortableModuleItem
                  key={module.id}
                  module={module}
                  onModuleChange={handleModuleChange}
                  onDeleteModule={handleDeleteModule}
                  onAddTakeaway={handleAddTakeaway}
                  onDeleteTakeaway={handleDeleteTakeaway}
                />
              ))}
            </SortableContext>
          </DndContext>
          <Button variant="secondary" className="w-full mt-4" onClick={handleAddModule}>
            <Plus className="mr-2 h-4 w-4" /> Add New Module
          </Button>
        </div>
      </main>
    </div>
  )
}
