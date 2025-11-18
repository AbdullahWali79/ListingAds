import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AdminLogin = () => {
  console.log('✅ AdminLogin component rendering')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Ensure Firestore user document exists with admin role
      const userDocRef = doc(db, 'users', user.uid)
      const userDocSnap = await getDoc(userDocRef)

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data()
        // If document exists but role is not admin, update it
        if (userData.role !== 'admin') {
          await setDoc(
            userDocRef,
            {
              role: 'admin',
              status: 'approved',
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          )
          console.log('✅ User role updated to admin')
        }
      } else {
        // If document doesn't exist, create it with admin role
        const nameFromEmail = user.email?.split('@')[0] || 'Admin'
        await setDoc(userDocRef, {
          name: nameFromEmail,
          email: user.email || '',
          role: 'admin',
          status: 'approved',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        console.log('✅ Admin user document created in Firestore')
      }

      // Wait a bit to ensure document is fully written
      await new Promise(resolve => setTimeout(resolve, 300))

      // Verify document was created/updated
      const verifyDoc = await getDoc(userDocRef)
      if (verifyDoc.exists() && verifyDoc.data()?.role === 'admin') {
        console.log('✅ Admin role verified, navigating to dashboard')
        navigate('/admin/dashboard')
      } else {
        throw new Error('Failed to set admin role. Please try again.')
      }
    } catch (err: any) {
      console.error('Admin login error:', err)
      
      // User-friendly error messages
      let errorMessage = 'Failed to login. Please try again.'
      
      if (err.code) {
        switch (err.code) {
          case 'auth/invalid-credential':
          case 'auth/wrong-password':
          case 'auth/user-not-found':
            errorMessage = 'Invalid email or password. Please check your credentials and try again.'
            break
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address. Please enter a valid email.'
            break
          case 'auth/user-disabled':
            errorMessage = 'This admin account has been disabled. Please contact support.'
            break
          case 'auth/too-many-requests':
            errorMessage = 'Too many failed login attempts. Please try again later.'
            break
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your internet connection.'
            break
          default:
            errorMessage = err.message || 'Failed to login. Please try again.'
        }
      } else {
        errorMessage = err.message || 'Failed to login. Please try again.'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        width: '100%',
        position: 'relative',
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '400px',
        }}
      >
        <h1 style={{ marginBottom: '1.5rem', textAlign: 'center', color: '#333', fontSize: '24px' }}>
          Admin Login
        </h1>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#333',
                fontWeight: '500',
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
              placeholder="Enter your email"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#333',
                fontWeight: '500',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 3rem 0.75rem 0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666',
                  fontSize: '1.1rem',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0f0f0'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <span title="Hide password">👁️</span>
                ) : (
                  <span title="Show password">👁️‍🗨️</span>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                backgroundColor: '#fee',
                color: '#c33',
                borderRadius: '4px',
                fontSize: '0.875rem',
                border: '1px solid #fcc',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚠️</span>
                <span style={{ flex: 1 }}>{error}</span>
              </div>
              <div
                style={{
                  marginTop: '0.75rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid #fcc',
                  fontSize: '0.8125rem',
                  color: '#a33',
                }}
              >
                <strong>Admin login nahi ho raha? Ye check karein:</strong>
                <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.25rem', lineHeight: '1.6' }}>
                  <li>Admin account Firebase Console mein exist karta hai?</li>
                  <li>Email sahi hai? (e.g., muhammadabdullah@cuivehari.edu.pk)</li>
                  <li>Password correct hai? (case-sensitive)</li>
                </ul>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', fontStyle: 'italic', color: '#28a745', fontWeight: '500' }}>
                  ✅ <strong>Auto Setup:</strong> Login ke baad automatically Firestore mein admin role set ho jayega. Manual setup ki zaroorat nahi hai!
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: loading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AdminLogin
