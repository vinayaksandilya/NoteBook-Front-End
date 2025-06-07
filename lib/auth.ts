export function storeToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("jwtToken", token)
  }
}

export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("jwtToken")
  }
  return null
}

export function removeToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("jwtToken")
    localStorage.removeItem("user") // Also clear stored user data
  }
}
