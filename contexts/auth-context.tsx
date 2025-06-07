"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getToken, storeToken, removeToken } from "@/lib/auth"
import { api } from "@/lib/api"

interface User {
  id: string
  username: string
  email: string
  // Add any other fields your /api/users/profile returns for the user object
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (token: string, userData: User) => void
  logout: () => void
  fetchUserProfile: (token: string) => Promise<User | null>
  updateUserContext: (newUserData: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setTokenState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const fetchUserProfile = async (currentToken: string): Promise<User | null> => {
    try {
      // Path to direct API: /api/users/profile
      const profileData = await api.get("/api/users/profile", {
        headers: { Authorization: `Bearer ${currentToken}` },
      })
      const userData: User = profileData
      if (!userData) {
        throw new Error("User data not found in profile response")
      }
      setUser(userData)
      localStorage.setItem("user", JSON.stringify(userData))
      return userData
    } catch (error) {
      console.error("Failed to fetch user profile:", error)
      removeToken()
      localStorage.removeItem("user")
      setTokenState(null)
      setUser(null)
      return null
    }
  }

  useEffect(() => {
    const initialAuthCheck = async () => {
      const currentToken = getToken()
      if (currentToken) {
        setTokenState(currentToken)
        await fetchUserProfile(currentToken)
      }
      setIsLoading(false)
    }
    initialAuthCheck()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!isLoading && !user && !["/login", "/register"].includes(pathname)) {
      router.push("/login")
    } else if (!isLoading && user && ["/login", "/register"].includes(pathname)) {
      router.push("/dashboard/create-course")
    }
  }, [user, isLoading, pathname, router])

  const login = (newToken: string, userData: User) => {
    storeToken(newToken)
    localStorage.setItem("user", JSON.stringify(userData))
    setTokenState(newToken)
    setUser(userData)
    router.push("/dashboard/create-course")
  }

  const logout = () => {
    removeToken()
    localStorage.removeItem("user")
    setTokenState(null)
    setUser(null)
    router.push("/login")
  }

  const updateUserContext = (newUserData: User) => {
    setUser(newUserData)
    localStorage.setItem("user", JSON.stringify(newUserData))
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, fetchUserProfile, updateUserContext }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
