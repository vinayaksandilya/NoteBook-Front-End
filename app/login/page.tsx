"use client"

import * as React from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"

const loginSchema = z.object({
  login: z.string().min(1, { message: "Login identifier is required." }),
  password: z.string().min(1, { message: "Password is required." }),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login, fetchUserProfile } = useAuth()
  const [isLoading, setIsLoading] = React.useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      login: "",
      password: "",
    },
  })

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true)
    try {
      // Path to direct API: /api/users/login
      const loginResponse = await api.post("/api/users/login", data)
      const token = loginResponse.token

      if (!token) {
        throw new Error("Login failed: No token received.")
      }

      const userProfile = await fetchUserProfile(token)

      if (userProfile) {
        login(token, userProfile)
        toast.success("Login successful!")
      } else {
        throw new Error("Login failed: Could not retrieve user profile.")
      }
    } catch (error: any) {
      toast.error(error.message || "Login failed. Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your email below to login to your account.</CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="login">Email or Username</Label>
              <Input
                id="login"
                type="text"
                placeholder="yourname or m@example.com"
                {...form.register("login")}
                disabled={isLoading}
              />
              {form.formState.errors.login && (
                <p className="text-sm text-red-500">{form.formState.errors.login.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...form.register("password")} disabled={isLoading} />
              {form.formState.errors.password && (
                <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
            </Button>
            <div className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="underline">
                Register
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
