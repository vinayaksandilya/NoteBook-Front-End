"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, AlertTriangle, PlusCircle, FileText, Cpu, Cog, UploadCloud } from "lucide-react"

import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"

interface FileItem {
  id: string
  original_name: string
  // Add other fields if needed for display, e.g., created_at, size
}

interface ModelOption {
  name: string
  description: string
}

interface EngineOption {
  name: string
  description: string
}

export default function CreateCoursePage() {
  const router = useRouter()
  const { user } = useAuth()

  const [files, setFiles] = React.useState<FileItem[]>([])
  const [models, setModels] = React.useState<Record<string, ModelOption>>({})
  const [engines, setEngines] = React.useState<Record<string, EngineOption>>({})

  const [selectedFileId, setSelectedFileId] = React.useState<string>("")
  const [selectedModel, setSelectedModel] = React.useState<string>("")
  const [selectedEngine, setSelectedEngine] = React.useState<string>("")

  const [isLoadingData, setIsLoadingData] = React.useState(true)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // State for upload modal
  const [isUploadModalOpen, setIsUploadModalOpen] = React.useState(false)
  const [fileToUpload, setFileToUpload] = React.useState<File | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)

  const fetchData = React.useCallback(async () => {
    setIsLoadingData(true)
    setError(null)
    try {
      const [filesData, modelsData, enginesData] = await Promise.all([
        api.get("/api/files/my-files"),
        api.get("/api/courses/available-models"),
        api.get("/api/courses/available-engines"),
      ])
      setFiles(filesData || [])
      setModels(modelsData || {})
      setEngines(enginesData || {})

      if (modelsData && Object.keys(modelsData).length > 0) {
        setSelectedModel(Object.keys(modelsData)[0])
      }
      if (enginesData && Object.keys(enginesData).length > 0) {
        setSelectedEngine(Object.keys(enginesData)[0])
      }
    } catch (err: any) {
      setError(err.message || "Failed to load necessary data.")
      toast.error(err.message || "Failed to load necessary data.")
    } finally {
      setIsLoadingData(false)
    }
  }, [])

  React.useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, fetchData])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFileToUpload(event.target.files[0])
    }
  }

  const handleUploadFile = async () => {
    if (!fileToUpload) {
      toast.error("Please select a file to upload.")
      return
    }
    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", fileToUpload)

    try {
      const newFile = await api.postForm("/api/files/upload", formData)
      toast.success("File uploaded successfully!")
      setFileToUpload(null)
      setIsUploadModalOpen(false)

      // Refresh file list and select the new file
      const updatedFiles = await api.get("/api/files/my-files")
      setFiles(updatedFiles || [])
      if (newFile && newFile.id) {
        setSelectedFileId(newFile.id)
      }
    } catch (err: any) {
      toast.error(err.message || "File upload failed.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleGenerateCourse = async () => {
    if (!selectedFileId) {
      toast.error("Please select a file.")
      return
    }
    if (!selectedModel) {
      toast.error("Please select an AI model.")
      return
    }
    if (!selectedEngine) {
      toast.error("Please select a PDF engine.")
      return
    }

    setIsGenerating(true)
    try {
      const payload = {
        fileId: selectedFileId,
        options: {
          aiModel: selectedModel,
          pdfEngine: selectedEngine,
        },
      }
      const newCourse = await api.post("/api/courses/create-from-file", payload)
      toast.success(`Course "${newCourse.title}" created successfully! Redirecting...`)
      router.push(`/dashboard/courses/${newCourse.id}`)
    } catch (err: any) {
      toast.error(err.message || "Failed to generate course.")
      setIsGenerating(false) // Keep button enabled on error
    }
    // Do not set isGenerating to false on success, as page will redirect
  }

  if (isLoadingData) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading configuration...</p>
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
          {/* Optionally add a retry button here */}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-0">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Create New Course</CardTitle>
          <CardDescription>
            Select an uploaded file and configure the generation options to create your new course.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="file-select" className="flex items-center">
                <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                Source File
              </Label>
              <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Upload New
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload New File</DialogTitle>
                    <DialogDescription>Select a file to upload. Max size: 50MB.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="file-upload">File (PDF only)</Label>
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        disabled={isUploading}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsUploadModalOpen(false)} disabled={isUploading}>
                      Cancel
                    </Button>
                    <Button onClick={handleUploadFile} disabled={!fileToUpload || isUploading}>
                      {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Upload
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <Select value={selectedFileId} onValueChange={setSelectedFileId} disabled={isGenerating}>
              <SelectTrigger id="file-select">
                <SelectValue placeholder="Select an uploaded file..." />
              </SelectTrigger>
              <SelectContent>
                {files.length === 0 && (
                  <SelectItem value="no-files" disabled>
                    No files uploaded yet.
                  </SelectItem>
                )}
                {files.map((file) => (
                  <SelectItem key={file.id} value={file.id}>
                    {file.original_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="engine-select" className="flex items-center">
              <Cog className="mr-2 h-4 w-4 text-muted-foreground" />
              PDF Engine
            </Label>
            <Select value={selectedEngine} onValueChange={setSelectedEngine} disabled={isGenerating}>
              <SelectTrigger id="engine-select">
                <SelectValue placeholder="Select a PDF engine..." />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(engines).length === 0 && (
                  <SelectItem value="no-engines" disabled>
                    No engines available.
                  </SelectItem>
                )}
                {Object.entries(engines).map(([id, engine]) => (
                  <SelectItem key={id} value={id} title={engine.description}>
                    {engine.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model-select" className="flex items-center">
              <Cpu className="mr-2 h-4 w-4 text-muted-foreground" />
              AI Model
            </Label>
            <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isGenerating}>
              <SelectTrigger id="model-select">
                <SelectValue placeholder="Select an AI model..." />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(models).length === 0 && (
                  <SelectItem value="no-models" disabled>
                    No models available.
                  </SelectItem>
                )}
                {Object.entries(models).map(([id, model]) => (
                  <SelectItem key={id} value={id} title={model.description}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGenerateCourse}
            disabled={isGenerating || !selectedFileId || files.length === 0}
            className="w-full"
          >
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
            Generate Course
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
