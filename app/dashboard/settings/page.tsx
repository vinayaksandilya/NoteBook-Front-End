"use client"

import * as React from "react"
import { useAuth } from "@/contexts/auth-context"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Loader2,
  User,
  BarChart2,
  Zap,
  History,
  Edit3,
  Save,
  AlertTriangle,
  FileText,
  BookOpen,
  Brain,
} from "lucide-react"
import { api } from "@/lib/api"
import { format, formatDistanceStrict } from "date-fns"

const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50, "Username too long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")), // Allow empty string for no change
})

type ProfileFormValues = z.infer<typeof profileSchema>

// --- Updated Interfaces ---
interface ModelUsageApiItem {
  // From /api/stats/model-usage
  model_name: string
  total_calls: number
  total_tokens: string // String in API
  total_processing_time: string // String in API
  avg_processing_time: string // String in API
  last_used: string | null
  success_rate: string // String in API
}

interface UserStatsApiResponse {
  // From /api/stats/user
  user_id: string
  total_files: number
  total_courses: number
  total_model_calls: number
  total_tokens_used: number
  total_processing_time: number // Overall processing time
  last_login_at: string | null
  created_at: string | null
  updated_at: string | null
  // model_stats from this endpoint will be ignored if /api/stats/model-usage is used for the model usage section
}

interface RecentActivityItemApi {
  // From /api/stats/recent-activity
  id: string
  user_id: string
  action_type: string
  details: Record<string, any>
  created_at: string | null
}

// --- Helper Functions ---
const isValidDate = (date: Date): boolean => !isNaN(date.getTime())

const formatDateSafe = (dateString: string | null | undefined, formatString: string, defaultValue = "N/A"): string => {
  if (!dateString) return defaultValue
  const date = new Date(dateString)
  return isValidDate(date) ? format(date, formatString) : defaultValue
}

const formatAccountAge = (isoDateString: string | null | undefined): string => {
  if (!isoDateString) return "N/A"
  const date = new Date(isoDateString)
  if (!isValidDate(date)) return "Invalid Date"
  return formatDistanceStrict(date, new Date(), { addSuffix: false })
}

const formatProcessingTime = (ms: number | string | undefined): string => {
  if (ms === undefined || ms === null) return "N/A"
  const numericMs = typeof ms === "string" ? Number.parseFloat(ms) : ms
  if (isNaN(numericMs)) return "N/A"

  if (numericMs < 1000) return `${numericMs.toFixed(0)} ms`
  const seconds = numericMs / 1000
  if (seconds < 60) return `${seconds.toFixed(2)} s`
  const minutes = seconds / 60
  return `${minutes.toFixed(2)} min`
}

const formatActivityDetails = (actionType: string, details: Record<string, any>): string => {
  switch (actionType.toLowerCase()) {
    case "file_download":
      return `File operation: ${details.action || "Unknown"}, Count: ${details.count || "N/A"}`
    case "model_call":
      return `Model: ${details.model || "N/A"}, Engine: ${details.engine || "N/A"}, Time: ${formatProcessingTime(details.processingTime)}`
    case "course_create":
      return `Course: "${details.title || "Untitled"}", Modules: ${details.moduleCount || "N/A"}`
    case "login":
      return `Login via ${details.method || "Unknown"}`
    default:
      return JSON.stringify(details)
  }
}

const getActivityIcon = (actionType: string | undefined) => {
  switch (actionType?.toLowerCase()) {
    case "file_upload":
    case "file_download":
      return <FileText className="h-4 w-4" />
    case "course_create":
    case "course_update":
      return <BookOpen className="h-4 w-4" />
    case "model_call":
      return <Brain className="h-4 w-4" />
    case "login":
      return <User className="h-4 w-4" />
    case "profile_update":
      return <Edit3 className="h-4 w-4" />
    default:
      return <History className="h-4 w-4" />
  }
}

export default function SettingsPage() {
  const { user, updateUserContext } = useAuth()
  const [isSavingProfile, setIsSavingProfile] = React.useState(false)

  const [modelUsage, setModelUsage] = React.useState<ModelUsageApiItem[]>([])
  const [isLoadingModelUsage, setIsLoadingModelUsage] = React.useState(true)
  const [errorModelUsage, setErrorModelUsage] = React.useState<string | null>(null)

  const [userStats, setUserStats] = React.useState<UserStatsApiResponse | null>(null)
  const [isLoadingUserStats, setIsLoadingUserStats] = React.useState(true)
  const [errorUserStats, setErrorUserStats] = React.useState<string | null>(null)

  const [recentActivity, setRecentActivity] = React.useState<RecentActivityItemApi[]>([])
  const [isLoadingRecentActivity, setIsLoadingRecentActivity] = React.useState(true)
  const [errorRecentActivity, setErrorRecentActivity] = React.useState<string | null>(null)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
      password: "", // Add this line
    },
  })

  React.useEffect(() => {
    if (user) {
      form.reset({
        username: user.username,
        email: user.email,
      })
    }
  }, [user, form])

  const fetchModelUsage = React.useCallback(async () => {
    setIsLoadingModelUsage(true)
    try {
      const usageData = await api.get("/api/stats/model-usage")
      setModelUsage(usageData || [])
      setErrorModelUsage(null)
    } catch (err: any) {
      setErrorModelUsage(err.message || "Failed to load model usage.")
      toast.error("Error loading model usage: " + (err.message || "Unknown error"))
    } finally {
      setIsLoadingModelUsage(false)
    }
  }, [])

  const fetchUserStats = React.useCallback(async () => {
    setIsLoadingUserStats(true)
    try {
      const statsData = await api.get("/api/stats/user")
      setUserStats(statsData)
      setErrorUserStats(null)
    } catch (err: any) {
      setErrorUserStats(err.message || "Failed to load user stats.")
      toast.error("Error loading user stats: " + (err.message || "Unknown error"))
    } finally {
      setIsLoadingUserStats(false)
    }
  }, [])

  const fetchRecentActivity = React.useCallback(async () => {
    setIsLoadingRecentActivity(true)
    try {
      const activityData = await api.get("/api/stats/recent-activity")
      setRecentActivity(activityData || [])
      setErrorRecentActivity(null)
    } catch (err: any) {
      setErrorRecentActivity(err.message || "Failed to load recent activity.")
      toast.error("Error loading recent activity: " + (err.message || "Unknown error"))
    } finally {
      setIsLoadingRecentActivity(false)
    }
  }, [])

  React.useEffect(() => {
    if (!user) return
    fetchModelUsage()
    fetchUserStats()
    fetchRecentActivity()
  }, [user, fetchModelUsage, fetchUserStats, fetchRecentActivity])

  const getInitials = (name = "") => {
    return (
      name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "U"
    )
  }

  async function onProfileSubmit(data: ProfileFormValues) {
    setIsSavingProfile(true)
    try {
      const payload: Partial<ProfileFormValues> = {
        username: data.username,
        email: data.email,
      }
      if (data.password) {
        payload.password = data.password
      }
      const updatedUser = await api.patch("/api/users/profile", payload)
      if (updatedUser) {
        updateUserContext(updatedUser)
        toast.success("Profile updated successfully!")
      } else {
        toast.warning("Profile updated, but couldn't refresh data immediately.")
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile.")
    } finally {
      setIsSavingProfile(false)
    }
  }

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading user data...</p>
      </div>
    )
  }

  const renderLoading = (section: string) => (
    <div className="flex items-center justify-center p-4 text-muted-foreground">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Loading {section}...
    </div>
  )

  const renderError = (errorMsg: string | null, section: string, onRetry?: () => void) =>
    errorMsg && (
      <div className="p-4 text-destructive">
        <div className="flex items-center">
          <AlertTriangle className="mr-2 h-5 w-5" />
          Error loading {section}: {errorMsg}
        </div>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm" className="mt-2">
            Try Again
          </Button>
        )}
      </div>
    )

  return (
    <div className="space-y-8 p-1 md:p-0">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Profile Information
          </CardTitle>
          <CardDescription>Manage your personal details and account settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={`https://avatar.vercel.sh/${user.email}.png`} alt={user.username} />
              <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
            </Avatar>
            <div>
              <Button variant="outline" size="sm" disabled>
                <Edit3 className="mr-2 h-4 w-4" /> Change Photo (Soon)
              </Button>
              <p className="text-xs text-muted-foreground mt-1">JPG, GIF or PNG. 1MB max.</p>
            </div>
          </div>
          <form onSubmit={form.handleSubmit(onProfileSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input id="username" {...form.register("username")} disabled={isSavingProfile} />
                {form.formState.errors.username && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.username.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...form.register("email")} disabled={isSavingProfile} />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="md:col-span-2">
                {" "}
                {/* Password field spans both columns on medium screens */}
                <Label htmlFor="password">New Password (optional)</Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register("password")}
                  placeholder="Leave blank to keep current password"
                  disabled={isSavingProfile}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.password.message}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSavingProfile}>
                {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" /> AI Model Usage
          </CardTitle>
          <CardDescription>Overview of your token consumption and model interactions.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingModelUsage
            ? renderLoading("model usage")
            : renderError(errorModelUsage, "model usage", fetchModelUsage) ||
              (modelUsage.length > 0 ? (
                <ul className="space-y-3">
                  {modelUsage.map((model, index) => (
                    <li
                      key={model.model_name + index}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                    >
                      <div>
                        <p className="font-medium">{model.model_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Total Calls: {(model.total_calls ?? 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Total Tokens: {(Number.parseFloat(model.total_tokens) || 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Processing Time: {formatProcessingTime(model.total_processing_time)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Success Rate: {Number.parseFloat(model.success_rate).toFixed(2)}%
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Last used: {formatDateSafe(model.last_used, "PP")}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No model usage data available.</p>
              ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5" /> User Statistics
          </CardTitle>
          <CardDescription>Your activity summary on the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingUserStats
            ? renderLoading("user statistics")
            : renderError(errorUserStats, "user statistics", fetchUserStats) ||
              (userStats ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-md border p-4 text-center">
                    <p className="text-2xl font-bold">{(userStats.total_files ?? 0).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Files Uploaded</p>
                  </div>
                  <div className="rounded-md border p-4 text-center">
                    <p className="text-2xl font-bold">{(userStats.total_courses ?? 0).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Courses Created</p>
                  </div>
                  <div className="rounded-md border p-4 text-center">
                    <p className="text-2xl font-bold">{(userStats.total_model_calls ?? 0).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">AI Model Calls</p>
                  </div>
                  <div className="rounded-md border p-4 text-center">
                    <p className="text-lg font-semibold">{formatAccountAge(userStats.created_at)}</p>
                    <p className="text-sm text-muted-foreground">Account Age</p>
                  </div>
                  <div className="rounded-md border p-4 text-center col-span-2 lg:col-span-4">
                    <p className="text-xl font-bold">{formatProcessingTime(userStats.total_processing_time)}</p>
                    <p className="text-sm text-muted-foreground">Total Processing Time</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No user statistics available.</p>
              ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" /> Recent Activity
          </CardTitle>
          <CardDescription>A log of your recent actions on the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRecentActivity
            ? renderLoading("recent activity")
            : renderError(errorRecentActivity, "recent activity", fetchRecentActivity) ||
              (recentActivity.length > 0 ? (
                <ul className="space-y-4">
                  {recentActivity.map((activity) => (
                    <li key={activity.id} className="flex items-start gap-3">
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        {getActivityIcon(activity.action_type)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {formatActivityDetails(activity.action_type, activity.details)}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDateSafe(activity.created_at, "PPPp")}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No recent activity to display.</p>
              ))}
        </CardContent>
      </Card>
    </div>
  )
}
