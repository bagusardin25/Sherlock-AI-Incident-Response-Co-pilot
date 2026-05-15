'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (accessToken: string, refreshToken: string, user: User) => void
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

  /** Read auth state from localStorage and update React state */
  const syncFromStorage = useCallback(() => {
    const savedToken = localStorage.getItem('access_token')
    const parsedUser = parseStoredUser(localStorage.getItem('user'))

    if (savedToken && parsedUser) {
      setToken(savedToken)
      setUser(parsedUser)
    } else {
      // Partial/corrupt data — clean up
      if (savedToken || localStorage.getItem('user')) {
        clearStoredAuth()
      }
      setToken(null)
      setUser(null)
    }
  }, [])

  // Initial load from localStorage
  useEffect(() => {
    syncFromStorage()
    setIsLoading(false)
  }, [syncFromStorage])

  // Listen for cross-tab storage changes
  useEffect(() => {
    const handleStorageChange = () => syncFromStorage()
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [syncFromStorage])

  /** Store tokens + user and update React state in one step */
  const login = useCallback((accessToken: string, refreshToken: string, userData: User) => {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
    localStorage.setItem('user', JSON.stringify(userData))
    setToken(accessToken)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    clearStoredAuth()
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
