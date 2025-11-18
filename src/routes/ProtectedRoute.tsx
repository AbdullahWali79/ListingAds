import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
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
        
        // Try to get document with retry mechanism
        let userDocSnap = await getDoc(userDocRef)
        let retryCount = 0
        const maxRetries = 3
        
        // If document doesn't exist, wait a bit and retry (in case it's being created)
        while (!userDocSnap.exists() && retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 500)) // Wait 500ms
          userDocSnap = await getDoc(userDocRef)
          retryCount++
        }

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data()
          if (userData.role === 'admin') {
            setIsAuthorized(true)
          } else {
            // If role is not admin, check if we're on admin route and should auto-upgrade
            // This handles the case where user just logged in via admin login
            if (window.location.pathname.startsWith('/admin')) {
              console.log('User document exists but role is not admin. Updating to admin...')
              await setDoc(
                userDocRef,
                {
                  role: 'admin',
                  status: 'approved',
                  updatedAt: serverTimestamp(),
                },
                { merge: true }
              )
              setIsAuthorized(true)
            } else {
              setIsAuthorized(false)
            }
          }
        } else {
          // If document doesn't exist and we're on admin route, create it
          if (window.location.pathname.startsWith('/admin')) {
            console.log('User document not found. Creating admin document...')
            const nameFromEmail = currentUser.email?.split('@')[0] || 'Admin'
            await setDoc(userDocRef, {
              name: nameFromEmail,
              email: currentUser.email || '',
              role: 'admin',
              status: 'approved',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            })
            setIsAuthorized(true)
          } else {
            // Fallback: check if email contains 'admin' (for development)
            if (currentUser.email && currentUser.email.includes('admin')) {
              console.warn('User document not found, but allowing access for admin email')
              setIsAuthorized(true)
            } else {
              setIsAuthorized(false)
            }
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

