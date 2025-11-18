import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createUserWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../../firebase'

const PublicRegister = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [confirmationResult, setConfirmationResult] = useState<any>(null)
  const [role, setRole] = useState<'user' | 'seller'>('user')
  const [profileImageUrl, setProfileImageUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const navigate = useNavigate()

  // Send OTP
  const handleSendOtp = async () => {
    setError('')
    
    if (!phoneNumber.trim()) {
      setError('Phone number is required')
      return
    }

    // Format phone number (add +92 for Pakistan if not present)
    let formattedPhone = phoneNumber.trim()
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+92' + formattedPhone.substring(1)
      } else if (!formattedPhone.startsWith('92')) {
        formattedPhone = '+92' + formattedPhone
      } else {
        formattedPhone = '+' + formattedPhone
      }
    }

    setOtpLoading(true)
    try {
      // Setup reCAPTCHA
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
      })

      const result = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier)
      setConfirmationResult(result)
      setOtpSent(true)
      setError('')
    } catch (err: any) {
      console.error('OTP Error:', err)
      if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later.')
      } else {
        setError(err.message || 'Failed to send OTP. Please try again.')
      }
    } finally {
      setOtpLoading(false)
    }
  }

  // Verify OTP
  const handleVerifyOtp = async () => {
    setError('')
    
    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      return
    }

    if (!confirmationResult) {
      setError('OTP session expired. Please request a new OTP.')
      return
    }

    setOtpLoading(true)
    try {
      // Verify OTP with Firebase
      await confirmationResult.confirm(otp)
      setOtpVerified(true)
      setError('')
    } catch (err: any) {
      console.error('OTP Verification Error:', err)
      if (err.code === 'auth/invalid-verification-code') {
        setError('Invalid OTP. Please check and try again.')
      } else if (err.code === 'auth/code-expired') {
        setError('OTP expired. Please request a new one.')
        setOtpSent(false)
        setConfirmationResult(null)
      } else {
        setError(err.message || 'Invalid OTP. Please try again.')
      }
    } finally {
      setOtpLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (confirmPassword && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!phoneNumber.trim()) {
      setError('Phone number is required')
      return
    }

    if (!otpVerified) {
      setError('Please verify your phone number with OTP first')
      return
    }

    setLoading(true)

    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Format phone number
      let formattedPhone = phoneNumber.trim()
      if (!formattedPhone.startsWith('+')) {
        if (formattedPhone.startsWith('0')) {
          formattedPhone = '+92' + formattedPhone.substring(1)
        } else if (!formattedPhone.startsWith('92')) {
          formattedPhone = '+92' + formattedPhone
        } else {
          formattedPhone = '+' + formattedPhone
        }
      }

      // Create Firestore user document
      // Sellers need admin approval, buyers are auto-approved
      const initialStatus: 'pending' | 'approved' = role === 'seller' ? 'pending' : 'approved';
      
      await setDoc(doc(db, 'users', user.uid), {
        name: name.trim(),
        email,
        phoneNumber: formattedPhone,
        role: role,
        status: initialStatus,
        profileImageUrl: profileImageUrl.trim() || undefined,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      // Navigate to dashboard
      navigate('/dashboard')
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please login instead.')
      } else {
        setError(err.message || 'Failed to create account. Please try again.')
      }
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
          Create Account
        </h1>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="name"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#333',
                fontWeight: '500',
              }}
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
              placeholder="Enter your name"
            />
          </div>

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

          <div style={{ marginBottom: '1rem' }}>
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
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
              placeholder="Enter your password"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="confirmPassword"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#333',
                fontWeight: '500',
              }}
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
              placeholder="Confirm your password"
            />
          </div>

          {/* Phone Number with OTP Verification */}
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="phoneNumber"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#333',
                fontWeight: '500',
              }}
            >
              Phone Number *
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                disabled={otpVerified}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                  backgroundColor: otpVerified ? '#f0f0f0' : 'white',
                }}
                placeholder="03001234567 or +923001234567"
              />
              {!otpVerified && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpLoading || !phoneNumber.trim()}
                  style={{
                    padding: '0.75rem 1rem',
                    backgroundColor: otpLoading || !phoneNumber.trim() ? '#ccc' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: otpLoading || !phoneNumber.trim() ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {otpLoading ? 'Sending...' : 'Send OTP'}
                </button>
              )}
            </div>
            {otpSent && !otpVerified && (
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={otpLoading || otp.length !== 6}
                    style={{
                      padding: '0.75rem 1rem',
                      backgroundColor: otpLoading || otp.length !== 6 ? '#ccc' : '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: otpLoading || otp.length !== 6 ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {otpLoading ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#666', margin: 0 }}>
                  Enter the 6-digit code sent to your phone
                </p>
              </div>
            )}
            {otpVerified && (
              <div style={{ 
                marginTop: '0.5rem', 
                padding: '0.5rem', 
                backgroundColor: '#d4edda', 
                color: '#155724',
                borderRadius: '4px',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <span>✅</span>
                <span>Phone number verified</span>
              </div>
            )}
            <div id="recaptcha-container"></div>
            <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem', marginBottom: 0 }}>
              Phone number is required to contact sellers. We'll send you an OTP for verification.
            </p>
          </div>

          {role === 'seller' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="profileImageUrl"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  color: '#333',
                  fontWeight: '500',
                }}
              >
                Profile Image URL (Optional)
              </label>
              <input
                id="profileImageUrl"
                type="url"
                value={profileImageUrl}
                onChange={(e) => setProfileImageUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                }}
                placeholder="https://example.com/profile.jpg"
              />
              <div style={{ 
                marginTop: '0.75rem', 
                padding: '1rem', 
                backgroundColor: '#f0fdf4', 
                borderRadius: '8px',
                border: '1px solid #86efac',
              }}>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: '#166534', 
                  margin: '0 0 0.75rem 0',
                  fontWeight: '600',
                }}>
                  👤 How to Upload Profile Photo:
                </p>
                <ol style={{ 
                  margin: 0, 
                  paddingLeft: '1.25rem', 
                  fontSize: '0.8rem', 
                  color: '#14532d',
                  lineHeight: '1.6',
                }}>
                  <li style={{ marginBottom: '0.5rem' }}>Click on any image hosting website below</li>
                  <li style={{ marginBottom: '0.5rem' }}>Upload your profile photo (clear face photo recommended)</li>
                  <li style={{ marginBottom: '0.5rem' }}>Copy the direct image URL</li>
                  <li>Paste the URL in the field above</li>
                </ol>
                <p style={{ 
                  fontSize: '0.75rem', 
                  color: '#166534', 
                  margin: '0.75rem 0 0 0',
                  fontStyle: 'italic',
                }}>
                  Note: Admin will see this photo to verify your identity.
                </p>
                <div style={{ 
                  marginTop: '0.75rem', 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '0.5rem' 
                }}>
                  <a
                    href="https://imgur.com/upload"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#1e40af',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: '500',
                      display: 'inline-block',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1e3a8a'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1e40af'}
                  >
                    📷 Upload to Imgur
                  </a>
                  <a
                    href="https://imgbb.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#059669',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: '500',
                      display: 'inline-block',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#047857'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                  >
                    🖼️ Upload to ImgBB
                  </a>
                  <a
                    href="https://postimages.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#7c3aed',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: '500',
                      display: 'inline-block',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#6d28d9'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
                  >
                    🎨 Upload to PostImages
                  </a>
                </div>
              </div>
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#333',
                fontWeight: '500',
              }}
            >
              I want to register as:
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: role === 'user' ? '2px solid #007bff' : '2px solid #ddd',
                  backgroundColor: role === 'user' ? '#f0f8ff' : 'transparent',
                  flex: 1,
                  transition: 'all 0.2s',
                }}
              >
                <input
                  type="radio"
                  name="role"
                  value="user"
                  checked={role === 'user'}
                  onChange={(e) => setRole(e.target.value as 'user' | 'seller')}
                  style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: role === 'user' ? '600' : '400' }}>Buyer</span>
              </label>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  border: role === 'seller' ? '2px solid #007bff' : '2px solid #ddd',
                  backgroundColor: role === 'seller' ? '#f0f8ff' : 'transparent',
                  flex: 1,
                  transition: 'all 0.2s',
                }}
              >
                <input
                  type="radio"
                  name="role"
                  value="seller"
                  checked={role === 'seller'}
                  onChange={(e) => setRole(e.target.value as 'user' | 'seller')}
                  style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                />
                <span style={{ fontWeight: role === 'seller' ? '600' : '400' }}>Seller</span>
              </label>
            </div>
          </div>

          {error && (
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                backgroundColor: '#fee',
                color: '#c33',
                borderRadius: '4px',
                fontSize: '0.875rem',
              }}
            >
              {error}
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
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.875rem', color: '#666' }}>
          Already have an account?{' '}
          <Link
            to="/auth/login"
            style={{
              color: '#007bff',
              textDecoration: 'none',
              fontWeight: '500',
            }}
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default PublicRegister

