/**
 * Authentication Context
 * Manages user authentication state across the application
 */

'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  roles: string[]
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  hasRole: (role: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      fetchCurrentUser(token)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchCurrentUser = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        // Token invalid, clear it
        localStorage.removeItem('auth_token')
        localStorage.removeItem('refresh_token')
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Login failed')
      }

      const data = await response.json()

      // Store tokens
      localStorage.setItem('auth_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)

      // Set user
      setUser(data.user)

      // Redirect based on role
      if (data.user.roles.includes('ceo')) {
        router.push('/ceo/interrupts')
      } else if (data.user.roles.includes('client')) {
        router.push('/client/[token]')
      } else {
        router.push('/dashboard/approvals')
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (token) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local state regardless of API response
      localStorage.removeItem('auth_token')
      localStorage.removeItem('refresh_token')
      setUser(null)
      router.push('/login')
    }
  }

  const hasRole = (role: string): boolean => {
    return user?.roles.includes(role) ?? false
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
