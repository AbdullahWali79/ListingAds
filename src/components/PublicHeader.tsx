import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'

const PublicHeader = () => {
  const navigate = useNavigate()
  const { firebaseUser, authLoading, logout } = useAuthContext()

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
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        padding: '1rem 2rem',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '2rem',
        }}
      >
        <Link
          to="/"
          style={{
            textDecoration: 'none',
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: '800',
            fontSize: '1.2rem',
          }}>
            A
          </div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Classified Ads
          </h1>
        </Link>
        
        <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginLeft: 'auto' }}>
          <Link
            to="/"
            style={{
              textDecoration: 'none',
              color: '#333',
              fontSize: '0.95rem',
              fontWeight: '600',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f8f9fa'
              e.currentTarget.style.color = '#667eea'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#333'
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
                      padding: '0.6rem 1.5rem',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '25px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      transition: 'all 0.3s',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'
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

