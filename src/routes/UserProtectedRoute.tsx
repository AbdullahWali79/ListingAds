import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'

interface UserProtectedRouteProps {
  children: React.ReactNode
}

const UserProtectedRoute = ({ children }: UserProtectedRouteProps) => {
  const { firebaseUser, userDoc, authLoading } = useAuthContext()

  if (authLoading) {
    return <div>Loading...</div>
  }

  if (!firebaseUser) {
    return <Navigate to="/auth/login" replace />
  }

  // If user is admin, redirect to admin dashboard
  if (userDoc?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  }

  // If user is blocked, show message
  if (userDoc?.status === 'blocked') {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'calc(100vh - 200px)',
          padding: '2rem',
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            maxWidth: '500px',
            textAlign: 'center',
          }}
        >
          <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>Account Blocked</h2>
          <p style={{ color: '#666', margin: 0 }}>
            Your account is blocked. Please contact support.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default UserProtectedRoute

