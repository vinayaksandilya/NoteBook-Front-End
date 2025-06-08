"use client"

import Link from "next/link"
import * as React from "react"
import { Download, Trash2, FileText, Loader2, AlertTriangle, UploadCloud } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api" // Import API_BASE_URL
import { useAuth } from "@/contexts/auth-context"

interface FileItem {
  id: string
  original_name: string // Changed from filename
  created_at: string // Changed from uploadDate
  size: number
  mime_type: string // Changed from type
  path: string // Added for download link
  url: string // Add this line
}

export default function MyFilesPage() {
  const [files, setFiles] = React.useState<FileItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = React.useState(false)
  const [fileToUpload, setFileToUpload] = React.useState<File | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)
  const [fileToDelete, setFileToDelete] = React.useState<FileItem | null>(null)

  const { user } = useAuth()

  const fetchFiles = React.useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await api.get("/api/files/my-files")
      setFiles(data || []) // API returns an array directly
    } catch (err: any) {
      setError(err.message || "Failed to fetch files.")
      toast.error(err.message || "Failed to fetch files.")
    } finally {
      setIsLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    if (user) {
      fetchFiles()
    } else {
      setIsLoading(false)
    }
  }, [fetchFiles, user])

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
      await api.postForm("/api/files/upload", formData)
      toast.success("File uploaded successfully!")
      setIsUploadModalOpen(false)
      setFileToUpload(null)
      fetchFiles()
    } catch (err: any) {
      toast.error(err.message || "File upload failed.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteFile = async () => {
    if (!fileToDelete) return
    try {
      await api.delete(`/api/files/${fileToDelete.id}`)
      toast.success(`File "${fileToDelete.original_name}" deleted successfully.`)
      setFiles(files.filter((f) => f.id !== fileToDelete.id))
      setFileToDelete(null)
    } catch (err: any) {
      toast.error(err.message || `Failed to delete file "${fileToDelete.original_name}".`)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading your files...</p>
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
          <Button onClick={fetchFiles} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!user && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-xl font-semibold">Authentication Error</p>
        <p className="text-muted-foreground">Please log in to view your files.</p>
        <Button asChild className="mt-4">
          <Link href="/login">Go to Login</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Files</h1>
        <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <UploadCloud className="mr-2 h-4 w-4" /> Upload New File
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload New File</DialogTitle>
              <DialogDescription>Select a PDF file to upload. Max size: 50MB.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="file-upload">File (PDF only)</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.md"
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

      {files.length === 0 ? (
        <Card className="mt-4">
          <CardContent className="pt-6 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No files yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Upload your first file to get started.</p>
            <Button className="mt-4" onClick={() => setIsUploadModalOpen(true)}>
              <UploadCloud className="mr-2 h-4 w-4" /> Upload File
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-4">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/files/${file.id}`} className="hover:underline">
                        {file.original_name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{file.mime_type?.split("/")[1]?.toUpperCase() || "FILE"}</Badge>
                    </TableCell>
                    <TableCell>{format(new Date(file.created_at), "PPp")}</TableCell>
                    <TableCell>{formatFileSize(file.size)}</TableCell>
                    <TableCell className="text-right">
                      {file.url && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={file.url} target="_blank" rel="noopener noreferrer" title="View/Download File">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Dialog
                        open={!!fileToDelete && fileToDelete.id === file.id}
                        onOpenChange={(isOpen) => !isOpen && setFileToDelete(null)}
                      >
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" title="Delete File" onClick={() => setFileToDelete(file)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Confirm Deletion</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete the file &quot;{file.original_name}&quot;? This action
                              cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button variant="destructive" onClick={handleDeleteFile}>
                              Delete
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
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
