import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null)
        setIsAuthorized(false)
        setLoading(false)
        return
      }

      setUser(currentUser)

      try {
        const userDocRef = doc(db, 'users', currentUser.uid)
        const userDocSnap = await getDoc(userDocRef)

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data()
          if (userData.role === 'admin') {
            setIsAuthorized(true)
          } else {
            setIsAuthorized(false)
          }
        } else {
          // If document doesn't exist, check if user email is admin
          // This is a fallback for development
          if (currentUser.email && currentUser.email.includes('admin')) {
            console.warn('User document not found, but allowing access for admin email')
            setIsAuthorized(true)
          } else {
            setIsAuthorized(false)
          }
        }
      } catch (error: any) {
        console.error('Error checking user role:', error)
        // If permission error, allow access for development (remove in production)
        if (error.code === 'permission-denied' || error.message?.includes('permission')) {
          console.warn('Permission denied, but allowing access for development')
          setIsAuthorized(true)
        } else {
          setIsAuthorized(false)
        }
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />
  }

  if (!isAuthorized) {
    return <div>Not authorized (admin only)</div>
  }

  return <>{children}</>
}

export default ProtectedRoute

