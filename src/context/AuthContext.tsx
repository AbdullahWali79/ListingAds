import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { doc, getDoc, type Timestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'

export interface UserDoc {
  name: string
  email: string
  role: 'user' | 'seller' | 'admin'
  status: 'approved' | 'pending' | 'blocked'
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

interface AuthContextValue {
  firebaseUser: User | null
  userDoc: (UserDoc & { id: string }) | null
  authLoading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [userDoc, setUserDoc] = useState<(UserDoc & { id: string }) | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user)

      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid)
          const userDocSnap = await getDoc(userDocRef)

          if (userDocSnap.exists()) {
            const data = userDocSnap.data() as UserDoc
            setUserDoc({ ...data, id: userDocSnap.id })
          } else {
            // If Firestore doc doesn't exist, set to null (no hard failure)
            setUserDoc(null)
          }
        } catch (error) {
          console.error('Error fetching user document:', error)
          setUserDoc(null)
        }
      } else {
        setUserDoc(null)
      }

      setAuthLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const logout = async () => {
    try {
      await signOut(auth)
      setFirebaseUser(null)
      setUserDoc(null)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  const value: AuthContextValue = {
    firebaseUser,
    userDoc,
    authLoading,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

