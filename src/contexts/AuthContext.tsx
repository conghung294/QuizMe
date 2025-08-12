'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { toast } from 'react-toastify'

interface User {
  id: string
  email: string
  name?: string
  createdAt: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, name?: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  refreshToken: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

  useEffect(() => {
    // Check for stored auth data on mount
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('auth_token')
        const storedUser = localStorage.getItem('auth_user')

        if (storedToken && storedUser) {
          // Validate token by calling /auth/me endpoint
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
              'Content-Type': 'application/json',
            },
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success) {
              setToken(storedToken)
              setUser(data.data)
              // Update stored user data with fresh data from server
              localStorage.setItem('auth_user', JSON.stringify(data.data))
            } else {
              // Token is invalid, clear storage
              localStorage.removeItem('auth_token')
              localStorage.removeItem('auth_user')
            }
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('auth_token')
            localStorage.removeItem('auth_user')
          }
        }
      } catch (error) {
        console.error('Error validating stored token:', error)
        // Clear storage on error
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [API_BASE_URL])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const { user: userData, token: userToken } = data.data
        setUser(userData)
        setToken(userToken)

        // Store in localStorage
        localStorage.setItem('auth_token', userToken)
        localStorage.setItem('auth_user', JSON.stringify(userData))

        toast.success('Đăng nhập thành công!')
        return true
      } else {
        // Handle different error status codes
        if (response.status === 401) {
          toast.error('Email hoặc mật khẩu không đúng')
        } else if (response.status === 429) {
          toast.error('Quá nhiều lần thử. Vui lòng thử lại sau')
        } else {
          toast.error(data.message || 'Đăng nhập thất bại')
        }
        return false
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Có lỗi xảy ra khi đăng nhập')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (email: string, password: string, name?: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const { user: userData, token: userToken } = data.data
        setUser(userData)
        setToken(userToken)

        // Store in localStorage
        localStorage.setItem('auth_token', userToken)
        localStorage.setItem('auth_user', JSON.stringify(userData))

        toast.success('Đăng ký thành công!')
        return true
      } else {
        // Handle different error status codes
        if (response.status === 409) {
          toast.error('Email này đã được sử dụng')
        } else if (response.status === 400) {
          toast.error('Thông tin không hợp lệ. Vui lòng kiểm tra lại')
        } else {
          toast.error(data.message || 'Đăng ký thất bại')
        }
        return false
      }
    } catch (error) {
      console.error('Register error:', error)
      toast.error('Có lỗi xảy ra khi đăng ký')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    toast.info('Đã đăng xuất')
  }

  const refreshToken = async (): Promise<boolean> => {
    try {
      const storedToken = localStorage.getItem('auth_token')
      if (!storedToken) {
        return false
      }

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${storedToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUser(data.data)
          // Update stored user data with fresh data from server
          localStorage.setItem('auth_user', JSON.stringify(data.data))
          return true
        }
      }

      // Token is invalid, logout user
      logout()
      return false
    } catch (error) {
      console.error('Error refreshing token:', error)
      logout()
      return false
    }
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
    refreshToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
