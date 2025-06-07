import { getToken, removeToken } from "./auth"
import { toast } from "sonner"

// API_BASE_URL is now the direct backend URL
export const API_BASE_URL = "https://notebook-backend.bhoral.com" // Export for use elsewhere

async function request(endpoint: string, options: RequestInit = {}) {
  const token = getToken()
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  }
  if (token) {
    ;(headers as any)["Authorization"] = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    if (response.status === 401) {
      removeToken()
      toast.error("Session expired or unauthorized. Please login again.")
      // Consider redirecting or letting AuthContext handle UI update
      // For example, by setting user to null, which triggers useEffect in AuthContext
      if (typeof window !== "undefined") {
        // This is a hard redirect, AuthContext might be cleaner
        // window.dispatchEvent(new Event('auth-error-redirect-to-login'));
      }
      throw new Error("Unauthorized")
    }

    if (!response.ok) {
      let errorData
      try {
        errorData = await response.json()
      } catch (e) {
        // If response is not JSON, use status text or a generic message
        errorData = { message: response.statusText || `Request failed with status ${response.status}` }
      }
      throw new Error(errorData.message || `API request failed to ${endpoint} with status ${response.status}`)
    }

    if (response.status === 204) {
      // No Content
      return null
    }
    return response.json()
  } catch (error: any) {
    console.error(`API Helper Error (${options.method || "GET"} ${endpoint}):`, error)
    // Avoid re-toasting if already handled (e.g., 401)
    if (error.message !== "Unauthorized") {
      // toast.error(error.message || 'An unexpected API error occurred.');
    }
    throw error // Re-throw to be caught by the caller for specific UI updates
  }
}

export const api = {
  get: (endpoint: string, options?: RequestInit) => request(endpoint, { ...options, method: "GET" }),
  post: (endpoint: string, body?: any, options?: RequestInit) =>
    request(endpoint, { ...options, method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: (endpoint: string, body: any, options?: RequestInit) =>
    request(endpoint, { ...options, method: "PUT", body: JSON.stringify(body) }),
  patch: (endpoint: string, body: any, options?: RequestInit) =>
    request(endpoint, { ...options, method: "PATCH", body: JSON.stringify(body) }),
  delete: (endpoint: string, options?: RequestInit) => request(endpoint, { ...options, method: "DELETE" }),
  postForm: async (endpoint: string, formData: FormData, options: RequestInit = {}) => {
    const token = getToken()
    const headers = { ...options.headers } // Don't set Content-Type for FormData
    if (token) {
      ;(headers as any)["Authorization"] = `Bearer ${token}`
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        ...options,
        headers,
        body: formData,
      })

      if (response.status === 401) {
        removeToken()
        toast.error("Session expired or unauthorized. Please login again.")
        if (typeof window !== "undefined") {
          // window.dispatchEvent(new Event('auth-error-redirect-to-login'));
        }
        throw new Error("Unauthorized")
      }

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch (e) {
          errorData = { message: response.statusText || `Request failed with status ${response.status}` }
        }
        throw new Error(errorData.message || `API Form request failed to ${endpoint} with status ${response.status}`)
      }
      if (response.status === 204) return null
      return response.json()
    } catch (error: any) {
      console.error(`API Form Helper Error (POST ${endpoint}):`, error)
      if (error.message !== "Unauthorized") {
        // toast.error(error.message || 'An unexpected API form error occurred.');
      }
      throw error
    }
  },
}
