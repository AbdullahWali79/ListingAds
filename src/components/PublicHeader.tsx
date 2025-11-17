import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'

const PublicHeader = () => {
  const navigate = useNavigate()
  const { firebaseUser, userDoc, authLoading, logout } = useAuthContext()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  return (
    <header
      style={{
        backgroundColor: '#fff',
        borderBottom: '1px solid #e0e0e0',
        padding: '1rem 2rem',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Link
          to="/"
          style={{
            textDecoration: 'none',
            color: '#333',
          }}
        >
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
            Classified Ads
          </h1>
        </Link>
        <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <Link
            to="/"
            style={{
              textDecoration: 'none',
              color: '#333',
              fontSize: '0.95rem',
              fontWeight: '500',
            }}
          >
            Home
          </Link>
          {!authLoading && (
            <>
              {firebaseUser ? (
                <>
                  <Link
                    to="/dashboard"
                    style={{
                      textDecoration: 'none',
                      color: '#333',
                      fontSize: '0.95rem',
                      fontWeight: '500',
                    }}
                  >
                    My Account
                  </Link>
                  <button
                    onClick={handleLogout}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#c82333'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#dc3545'
                    }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/auth/login"
                    style={{
                      textDecoration: 'none',
                      color: '#333',
                      fontSize: '0.95rem',
                      fontWeight: '500',
                    }}
                  >
                    Login
                  </Link>
                  <button
                    onClick={() => navigate('/auth/register')}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#0056b3'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#007bff'
                    }}
                  >
                    Sign Up
                  </button>
                </>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

export default PublicHeader

