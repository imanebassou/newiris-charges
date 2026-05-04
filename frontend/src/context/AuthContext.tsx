import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import api from '../api/axios'

interface PagePermission {
  page: number
  page_id: number
  page_code: string
  page_label: string
  page_path: string
  can_view: boolean
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
}

interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: string
  service: number | null
  fonction: string
  phone: string
  photo: string | null
  page_permissions: PagePermission[]
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (userData: User, accessToken: string, refreshToken: string) => void
  logout: () => void
  refreshUser: () => Promise<void>
  canViewPage: (pageCode: string) => boolean
  getPagePermission: (pageCode: string) => PagePermission | undefined
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me/')
      setUser(res.data)
      localStorage.setItem('user', JSON.stringify(res.data))
    } catch (error) {
      setUser(null)
      setToken(null)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
    }
  }

  useEffect(() => {
    const savedToken = localStorage.getItem('access_token')
    const savedUser = localStorage.getItem('user')

    if (savedToken) {
      setToken(savedToken)
      if (savedUser) {
        setUser(JSON.parse(savedUser))
      }
      void refreshUser()
    }
  }, [])

  const login = (userData: User, accessToken: string, refreshToken: string) => {
    setUser(userData)
    setToken(accessToken)
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  }

  const getPagePermission = (pageCode: string) =>
    user?.page_permissions?.find((permission) => permission.page_code === pageCode)

  const canViewPage = (pageCode: string) => !!getPagePermission(pageCode)?.can_view

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        refreshUser,
        canViewPage,
        getPagePermission,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
