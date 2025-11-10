'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getUser, logout } from '@/lib/auth';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  return (
    <nav style={{ background: '#0070f3', color: 'white', padding: '15px 0' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ fontSize: '24px', fontWeight: 'bold' }}>
          ListingAds
        </Link>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link href="/">Home</Link>
          <Link href="/categories">Categories</Link>
          {user ? (
            <>
              {user.role === 'admin' && <Link href="/admin">Admin</Link>}
              <Link href="/seller">Seller Dashboard</Link>
              <span>{user.name}</span>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '5px 15px' }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login">Login</Link>
              <Link href="/register">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

