'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getUser, logout } from '@/lib/auth';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    // Check user on mount and when route changes
    setUser(getUser());
  }, [pathname]);

  const handleLogout = () => {
    logout();
    setUser(null);
    // Redirect to home after logout
    window.location.href = '/';
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <nav style={{ 
      background: 'white', 
      color: '#333', 
      padding: '20px 0',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '24px', fontWeight: 'bold', color: '#0070f3' }}>
          <span style={{ 
            width: '32px', 
            height: '32px', 
            background: '#0070f3', 
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '20px'
          }}>📋</span>
          Classifieds
        </Link>
        
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
          <Link href="/" style={{ color: pathname === '/' ? '#0070f3' : '#333', fontWeight: pathname === '/' ? '600' : '400' }}>
            Home
          </Link>
          <Link href="/categories" style={{ color: pathname === '/categories' ? '#0070f3' : '#333', fontWeight: pathname === '/categories' ? '600' : '400' }}>
            Categories
          </Link>
          <Link href="/seller" style={{ color: pathname === '/seller' ? '#0070f3' : '#333', fontWeight: pathname === '/seller' ? '600' : '400' }}>
            Post Ad
          </Link>
          {user && (
            <Link href="/buyer" style={{ color: pathname === '/buyer' ? '#0070f3' : '#333', fontWeight: pathname === '/buyer' ? '600' : '400' }}>
              My Dashboard
            </Link>
          )}
        </div>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search ads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '10px 15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                width: '200px',
                outline: 'none'
              }}
            />
            <button 
              type="submit"
              style={{
                marginLeft: '8px',
                padding: '10px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              🔍
            </button>
          </form>

          {user ? (
            <>
              {user.role === 'admin' && (
                <Link href="/admin" style={{ color: '#333', padding: '8px 16px', borderRadius: '8px', background: pathname === '/admin' ? '#f0f4f8' : 'transparent' }}>
                  Admin
                </Link>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '50%', 
                  background: '#e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}>
                  👤
                </div>
                <button 
                  onClick={handleLogout} 
                  className="btn btn-secondary" 
                  style={{ padding: '8px 16px', fontSize: '14px' }}
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" style={{ color: '#333', padding: '8px 16px' }}>
                Log In
              </Link>
              <Link href="/register" className="btn btn-primary" style={{ padding: '8px 20px' }}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

