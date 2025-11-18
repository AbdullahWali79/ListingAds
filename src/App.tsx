import { Routes, Route, Navigate } from 'react-router-dom'
import PublicLayout from './public/PublicLayout'
import Home from './public/Home'
import CategoryAds from './public/CategoryAds'
import AdDetails from './public/AdDetails'
import AdminLogin from './pages/AdminLogin'
import AdminLayout from './pages/AdminLayout'
import Dashboard from './pages/Dashboard'
import Categories from './pages/Categories'
import Ads from './pages/Ads'
import Payments from './pages/Payments'
import Users from './pages/Users'
import Blogs from './pages/Blogs'
import PricePackages from './pages/PricePackages'
import PublicLogin from './public/auth/PublicLogin'
import PublicRegister from './public/auth/PublicRegister'
import UserDashboard from './public/UserDashboard'
import PostAd from './public/PostAd'
import ProtectedRoute from './routes/ProtectedRoute'
import UserProtectedRoute from './routes/UserProtectedRoute'
import SellerProtectedRoute from './routes/SellerProtectedRoute'

function App() {
  console.log('✅ App component rendering')
  
  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#f5f5f5',
        zIndex: -1
      }} />
      <Routes>
        {/* Public site */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="category/:slug" element={<CategoryAds />} />
          <Route path="ad/:adId" element={<AdDetails />} />
          {/* Public auth + user dashboard */}
          <Route path="auth/login" element={<PublicLogin />} />
          <Route path="auth/register" element={<PublicRegister />} />
          <Route
            path="dashboard"
            element={
              <UserProtectedRoute>
                <UserDashboard />
              </UserProtectedRoute>
            }
          />
          <Route
            path="post-ad"
            element={
              <SellerProtectedRoute>
                <PostAd />
              </SellerProtectedRoute>
            }
          />
        </Route>

        {/* Admin auth + panel */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="categories" element={<Categories />} />
          <Route path="ads" element={<Ads />} />
          <Route path="payments" element={<Payments />} />
          <Route path="users" element={<Users />} />
          <Route path="blogs" element={<Blogs />} />
          <Route path="price-packages" element={<PricePackages />} />
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
