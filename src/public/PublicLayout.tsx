import { Outlet, Link } from 'react-router-dom'
import PublicHeader from '../components/PublicHeader'

const PublicLayout = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <PublicHeader />

      {/* Main Content */}
      <main style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        <Outlet />
      </main>

      {/* Modern Footer */}
      <footer
        style={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          color: '#fff',
          padding: '3rem 2rem 1.5rem 2rem',
          marginTop: '4rem',
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '2rem',
            marginBottom: '2rem',
          }}>
            <div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: '700' }}>
                Classified Ads
              </h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#b0b0b0', lineHeight: '1.6' }}>
                Your trusted platform for buying and selling. Connect with buyers and sellers in your area.
              </p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600' }}>Quick Links</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Link to="/" style={{ color: '#b0b0b0', textDecoration: 'none', fontSize: '0.9rem' }}>Home</Link>
                <Link to="/auth/register" style={{ color: '#b0b0b0', textDecoration: 'none', fontSize: '0.9rem' }}>Post an Ad</Link>
                <Link to="/auth/login" style={{ color: '#b0b0b0', textDecoration: 'none', fontSize: '0.9rem' }}>Login</Link>
              </div>
            </div>
            <div>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600' }}>Support</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <a href="#" style={{ color: '#b0b0b0', textDecoration: 'none', fontSize: '0.9rem' }}>Help Center</a>
                <a href="#" style={{ color: '#b0b0b0', textDecoration: 'none', fontSize: '0.9rem' }}>Contact Us</a>
                <a href="#" style={{ color: '#b0b0b0', textDecoration: 'none', fontSize: '0.9rem' }}>Privacy Policy</a>
              </div>
            </div>
            <div>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600' }}>Follow Us</h4>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <a href="#" style={{ color: '#b0b0b0', fontSize: '1.2rem', textDecoration: 'none' }}>📘</a>
                <a href="#" style={{ color: '#b0b0b0', fontSize: '1.2rem', textDecoration: 'none' }}>📷</a>
                <a href="#" style={{ color: '#b0b0b0', fontSize: '1.2rem', textDecoration: 'none' }}>🐦</a>
              </div>
            </div>
          </div>
          <div style={{ 
            borderTop: '1px solid rgba(255,255,255,0.1)', 
            paddingTop: '1.5rem', 
            textAlign: 'center' 
          }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#b0b0b0' }}>
              © {new Date().getFullYear()} Classified Ads. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PublicLayout

