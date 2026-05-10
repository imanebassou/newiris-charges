import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface Props {
  children: ReactNode
  allowedPage?: string
}

const PrivateRoute = ({ children, allowedPage }: Props) => {
  const { canViewPage, isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // super_admin et admin ont accès à tout
  if (user?.role === 'super_admin' || user?.role === 'admin') {
    return <>{children}</>
  }

  // Autres roles → vérifier permissions par page
  if (allowedPage && !canViewPage(allowedPage)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}

export default PrivateRoute