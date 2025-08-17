"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  createdAt: string
  updatedAt: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<boolean>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for existing session and validate token with backend
    const validateSession = async () => {
      const token = localStorage.getItem("skyBooker_token")
      if (token) {
        try {
          // Verify token by fetching user data from database
          const response = await fetch("/api/users/me", {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          })
          
          if (response.ok) {
            const userData = await response.json()
            setUser(userData.user)
          } else {
            // Token is invalid, clear it
            localStorage.removeItem("skyBooker_token")
            localStorage.removeItem("skyBooker_user")
          }
        } catch (error) {
          console.error("Session validation error:", error)
          // Clear invalid session data
          localStorage.removeItem("skyBooker_token")
          localStorage.removeItem("skyBooker_user")
        }
      }
      setIsLoading(false)
    }
    
    validateSession()
  }, [])

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        localStorage.setItem("skyBooker_token", data.token)
        localStorage.setItem("skyBooker_user", JSON.stringify(data.user))
        return true
      } else {
        console.error("Sign in failed:", data.error)
        return false
      }
    } catch (error) {
      console.error("Sign in error:", error)
      return false
    }
  }

  const signUp = async (email: string, password: string, firstName: string, lastName: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, firstName, lastName }),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        localStorage.setItem("skyBooker_token", data.token)
        localStorage.setItem("skyBooker_user", JSON.stringify(data.user))
        return true
      } else {
        console.error("Sign up failed:", data.error)
        return false
      }
    } catch (error) {
      console.error("Sign up error:", error)
      return false
    }
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem("skyBooker_token")
    localStorage.removeItem("skyBooker_user")
    router.push("/auth/signin")
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
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