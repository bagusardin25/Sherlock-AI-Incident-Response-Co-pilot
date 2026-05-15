'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function clearStoredAuth() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
}

function parseStoredUser(savedUser: string | null): User | null {
  if (!savedUser) return null

  try {
    const parsed = JSON.parse(savedUser)
    if (parsed && typeof parsed.id === 'string' && typeof parsed.email === 'string') {
      return parsed
    }
  } catch (error) {
    console.warn('Invalid stored auth user. Clearing local session.', error)
  }

  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('access_token')
    const parsedUser = parseStoredUser(localStorage.getItem('user'))

    if (savedToken && parsedUser) {
      setToken(savedToken)
      setUser(parsedUser)
    } else if (savedToken || localStorage.getItem('user')) {
      clearStoredAuth()
    }

    setIsLoading(false)
  }, [])

  const logout = () => {
    clearStoredAuth()
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
