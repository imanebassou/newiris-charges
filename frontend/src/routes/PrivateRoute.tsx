import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

interface Props {
  children: ReactNode
  allowedPage?: string
}

const PrivateRoute = ({ children, allowedPage }: Props) => {
  const { canViewPage, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedPage && !canViewPage(allowedPage)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}

export default PrivateRoute
