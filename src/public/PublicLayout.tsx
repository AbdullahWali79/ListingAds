import { Outlet } from 'react-router-dom'
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

      {/* Footer */}
      <footer
        style={{
          backgroundColor: '#2c3e50',
          color: '#fff',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>
            © {new Date().getFullYear()} Classified Ads. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default PublicLayout

