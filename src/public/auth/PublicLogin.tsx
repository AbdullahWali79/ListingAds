import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../../firebase'

const PublicLogin = () => {
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

      // Ensure Firestore doc exists
      const userDocRef = doc(db, 'users', user.uid)
      const userDocSnap = await getDoc(userDocRef)

      if (userDocSnap.exists()) {
        // Update updatedAt if doc exists
        await setDoc(
          userDocRef,
          { updatedAt: serverTimestamp() },
          { merge: true }
        )
      } else {
        // Create doc if it doesn't exist
        const nameFromEmail = user.email?.split('@')[0] || 'User'
        await setDoc(userDocRef, {
          name: nameFromEmail,
          email: user.email || '',
          role: 'user' as const,
          status: 'approved' as const,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }

      // Navigate to dashboard
      navigate('/dashboard')
    } catch (err: any) {
      console.error('Login error:', err)
      
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
            errorMessage = 'This account has been disabled. Please contact support.'
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
          width: '100%',
          maxWidth: '400px',
        }}
      >
        <h1 style={{ marginBottom: '1.5rem', textAlign: 'center', color: '#333', fontSize: '24px' }}>
          Login
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
                <strong>Login nahi ho raha? Ye check karein:</strong>
                <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.25rem', lineHeight: '1.6' }}>
                  <li>Email sahi hai? (e.g., abdullahwale@gmail.com)</li>
                  <li>Password correct hai? (case-sensitive)</li>
                  <li>Account Firebase mein exist karta hai?</li>
                  <li>Pehle register kiya hai? Agar nahi, to <Link to="/auth/register" style={{ color: '#007bff', textDecoration: 'underline' }}>Sign Up</Link> karein</li>
                </ul>
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
              marginBottom: '1rem',
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.875rem', color: '#666' }}>
          Don't have an account?{' '}
          <Link
            to="/auth/register"
            style={{
              color: '#007bff',
              textDecoration: 'none',
              fontWeight: '500',
            }}
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}

export default PublicLogin

