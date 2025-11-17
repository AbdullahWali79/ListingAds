import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'

interface SellerProtectedRouteProps {
  children: React.ReactNode
}

const SellerProtectedRoute = ({ children }: SellerProtectedRouteProps) => {
  const { firebaseUser, userDoc, authLoading } = useAuthContext()

  if (authLoading) {
    return <div>Loading...</div>
  }

  if (!firebaseUser) {
    return <Navigate to="/auth/login" replace />
  }

  // Must be a seller
  if (userDoc?.role !== 'seller') {
    return <Navigate to="/dashboard" replace />
  }

  // Must be approved
  if (userDoc?.status !== 'approved') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export default SellerProtectedRoute

