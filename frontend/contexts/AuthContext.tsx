'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '@/lib/api'

interface User {
  id: string
  email: string
  role: string
  profile?: any
  riggerInfo?: any
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const response = await api.get('/auth/me')
        setUser(response.data.user)
      } catch (error) {
        localStorage.removeItem('token')
      }
    }
    setLoading(false)
  }

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', response.data.token)
    setUser(response.data.user)
  }

  const register = async (data: any) => {
    const response = await api.post('/auth/register', data)
    localStorage.setItem('token', response.data.token)
    setUser(response.data.user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const refreshUser = async () => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const response = await api.get('/auth/me')
        setUser(response.data.user)
      } catch (error) {
        console.error('Failed to refresh user:', error)
      }
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
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

