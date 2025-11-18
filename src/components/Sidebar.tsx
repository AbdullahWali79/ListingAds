import { NavLink } from 'react-router-dom'

const Sidebar = () => {
  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard' },
    { path: '/admin/categories', label: 'Categories' },
    { path: '/admin/ads', label: 'Ads' },
    { path: '/admin/payments', label: 'Payments' },
    { path: '/admin/users', label: 'Users' },
    { path: '/admin/price-packages', label: 'Price Packages' },
    { path: '/admin/blogs', label: 'Blogs' },
  ]

  return (
    <div
      style={{
        width: '250px',
        backgroundColor: '#2c3e50',
        minHeight: 'calc(100vh - 60px)',
        padding: '1.5rem 0',
      }}
    >
      <nav>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'block',
              padding: '0.75rem 1.5rem',
              color: isActive ? '#fff' : '#bdc3c7',
              textDecoration: 'none',
              backgroundColor: isActive ? '#34495e' : 'transparent',
              borderLeft: isActive ? '3px solid #3498db' : '3px solid transparent',
              transition: 'all 0.2s',
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default Sidebar

