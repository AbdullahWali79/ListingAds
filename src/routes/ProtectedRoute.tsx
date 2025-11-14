import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { onAuthStateChanged, User } from 'firebase/auth'
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
          setIsAuthorized(false)
        }
      } catch (error) {
        console.error('Error checking user role:', error)
        setIsAuthorized(false)
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

