import { Routes, Route, Navigate } from 'react-router-dom'
import AdminLogin from './pages/AdminLogin'
import AdminLayout from './pages/AdminLayout'
import Dashboard from './pages/Dashboard'
import Categories from './pages/Categories'
import Ads from './pages/Ads'
import Payments from './pages/Payments'
import Users from './pages/Users'
import Blogs from './pages/Blogs'
import ProtectedRoute from './routes/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
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
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
      </Route>
      <Route path="/" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  )
}

export default App
