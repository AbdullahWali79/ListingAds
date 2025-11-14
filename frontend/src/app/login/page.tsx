'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { authApi } from '@/lib/api';
import { setToken, setUser } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordSignup, setShowPasswordSignup] = useState(false);
  
  // Login form
  const [loginData, setLoginData] = useState({ email: '', password: '', loginAs: 'buyer' as 'buyer' | 'seller' | 'admin' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Signup form
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '', accountType: 'buyer' as 'buyer' | 'seller' });
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const response = await authApi.login({ email: loginData.email, password: loginData.password });
      if (response.data && response.data.token && response.data.user) {
        setToken(response.data.token);
        setUser(response.data.user);
        if (response.data.user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      } else {
        setLoginError('Invalid response from server');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setLoginError(err.response?.data?.error || err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    setSignupLoading(true);

    try {
      const response = await authApi.register({
        name: signupData.name,
        email: signupData.email,
        password: signupData.password,
      });
      setToken(response.data.token);
      setUser(response.data.user);
      router.push('/');
    } catch (err: any) {
      setSignupError(err.response?.data?.error || 'Registration failed');
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div style={{
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
        padding: '40px 20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '500px',
          padding: '0'
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
            <button
              onClick={() => setActiveTab('login')}
              style={{
                flex: 1,
                padding: '20px',
                background: activeTab === 'login' ? 'white' : '#f9fafb',
                border: 'none',
                borderTopLeftRadius: '16px',
                cursor: 'pointer',
                fontWeight: activeTab === 'login' ? '600' : '400',
                color: activeTab === 'login' ? '#333' : '#666',
                fontSize: '16px',
                transition: 'all 0.2s'
              }}
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              style={{
                flex: 1,
                padding: '20px',
                background: activeTab === 'signup' ? 'white' : '#f9fafb',
                border: 'none',
                borderTopRightRadius: '16px',
                cursor: 'pointer',
                fontWeight: activeTab === 'signup' ? '600' : '400',
                color: activeTab === 'signup' ? '#333' : '#666',
                fontSize: '16px',
                transition: 'all 0.2s'
              }}
            >
              Sign Up
            </button>
          </div>

          <div style={{ padding: '40px' }}>
            {/* Login Form */}
            {activeTab === 'login' && (
              <div>
                <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '30px', color: '#333' }}>
                  Welcome Back!
                </h2>
                {loginError && (
                  <div style={{ 
                    color: '#dc3545', 
                    marginBottom: '20px', 
                    padding: '12px',
                    background: '#f8d7da',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}>
                    {loginError}
                  </div>
                )}
                <form onSubmit={handleLogin}>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label>Password</label>
                      <a href="#" style={{ color: '#0070f3', fontSize: '14px' }}>Forgot Password?</a>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                        style={{ paddingRight: '45px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#666',
                          fontSize: '18px'
                        }}
                      >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Login as</label>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setLoginData({ ...loginData, loginAs: 'buyer' })}
                        style={{
                          flex: 1,
                          minWidth: '100px',
                          padding: '12px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          background: loginData.loginAs === 'buyer' ? '#0070f3' : '#f9fafb',
                          color: loginData.loginAs === 'buyer' ? 'white' : '#666',
                          cursor: 'pointer',
                          fontWeight: loginData.loginAs === 'buyer' ? '600' : '400',
                          transition: 'all 0.2s'
                        }}
                      >
                        Buyer
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoginData({ ...loginData, loginAs: 'seller' })}
                        style={{
                          flex: 1,
                          minWidth: '100px',
                          padding: '12px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          background: loginData.loginAs === 'seller' ? '#0070f3' : '#f9fafb',
                          color: loginData.loginAs === 'seller' ? 'white' : '#666',
                          cursor: 'pointer',
                          fontWeight: loginData.loginAs === 'seller' ? '600' : '400',
                          transition: 'all 0.2s'
                        }}
                      >
                        Seller
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoginData({ ...loginData, loginAs: 'admin' })}
                        style={{
                          flex: 1,
                          minWidth: '100px',
                          padding: '12px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          background: loginData.loginAs === 'admin' ? '#dc3545' : '#f9fafb',
                          color: loginData.loginAs === 'admin' ? 'white' : '#666',
                          cursor: 'pointer',
                          fontWeight: loginData.loginAs === 'admin' ? '600' : '400',
                          transition: 'all 0.2s'
                        }}
                      >
                        Admin
                      </button>
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={loginLoading}
                    style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: '600' }}
                  >
                    {loginLoading ? 'Logging in...' : 'Login'}
                  </button>
                </form>
              </div>
            )}

            {/* Signup Form */}
            {activeTab === 'signup' && (
              <div>
                <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '30px', color: '#333' }}>
                  Create Your Account
                </h2>
                {signupError && (
                  <div style={{ 
                    color: '#dc3545', 
                    marginBottom: '20px', 
                    padding: '12px',
                    background: '#f8d7da',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}>
                    {signupError}
                  </div>
                )}
                <form onSubmit={handleSignup}>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={signupData.name}
                      onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={signupData.email}
                      onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPasswordSignup ? 'text' : 'password'}
                        placeholder="Create a password"
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        required
                        style={{ paddingRight: '45px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordSignup(!showPasswordSignup)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#666',
                          fontSize: '18px'
                        }}
                      >
                        {showPasswordSignup ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>I am a</label>
                    <select
                      value={signupData.accountType}
                      onChange={(e) => setSignupData({ ...signupData, accountType: e.target.value as 'buyer' | 'seller' })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '16px',
                        background: 'white'
                      }}
                    >
                      <option value="buyer">Buyer</option>
                      <option value="seller">Seller</option>
                    </select>
                  </div>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={signupLoading}
                    style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: '600' }}
                  >
                    {signupLoading ? 'Creating Account...' : 'Create Account'}
                  </button>
                  {signupData.accountType === 'seller' && (
                    <p style={{ 
                      marginTop: '15px', 
                      fontSize: '13px', 
                      color: '#666', 
                      textAlign: 'center',
                      lineHeight: '1.5'
                    }}>
                      Seller accounts require admin approval before you can post ads.
                    </p>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
