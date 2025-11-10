'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUser, logout } from '@/lib/auth';
import { adApi, categoryApi, paymentApi } from '@/lib/api';

interface Category {
  id: number;
  name: string;
}

interface Ad {
  id: number;
  title: string;
  status: string;
  package: string;
  category_name?: string;
  price?: number;
  created_at: string;
}

interface Payment {
  id: number;
  ad_id: number;
  status: string;
  admin_note: string;
}

export default function SellerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeNav, setActiveNav] = useState<'overview' | 'create' | 'my-ads' | 'payments' | 'notifications'>('overview');
  const [categories, setCategories] = useState<Category[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    image_urls: '',
    video_url: '',
    category_id: '',
    package: 'Free' as 'Free' | 'Standard' | 'Premium',
  });

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    fetchCategories();
    fetchMyAds();
    fetchMyPayments();
  }, []);

  useEffect(() => {
    if (activeNav === 'my-ads' || activeNav === 'overview') {
      fetchMyAds();
    } else if (activeNav === 'payments') {
      fetchMyPayments();
    }
  }, [activeNav]);

  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchMyAds = async () => {
    try {
      const response = await adApi.getMyAds();
      setAds(response.data);
    } catch (error) {
      console.error('Failed to fetch ads:', error);
    }
  };

  const fetchMyPayments = async () => {
    try {
      const response = await paymentApi.getMyPayments();
      setPayments(response.data);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    }
  };

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const imageUrls = formData.image_urls
        .split(',')
        .map((url) => url.trim())
        .filter((url) => url);

      const adData = {
        title: formData.title,
        description: formData.description || undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        image_urls: imageUrls.length > 0 ? imageUrls : undefined,
        video_url: formData.video_url || undefined,
        category_id: parseInt(formData.category_id),
        package: formData.package,
      };

      const response = await adApi.create(adData);
      alert('Ad created successfully!');
      setFormData({
        title: '',
        description: '',
        price: '',
        image_urls: '',
        video_url: '',
        category_id: '',
        package: 'Free',
      });
      fetchMyAds();
      setActiveNav('my-ads');
      if (formData.package !== 'Free') {
        router.push(`/seller/payment/${response.data.id}`);
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create ad');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { bg: string; color: string; text: string } } = {
      approved: { bg: '#d4edda', color: '#155724', text: 'Approved' },
      pending_admin_approval: { bg: '#fff3cd', color: '#856404', text: 'Pending' },
      pending_verification: { bg: '#d1ecf1', color: '#0c5460', text: 'Pending Verification' },
      rejected: { bg: '#f8d7da', color: '#721c24', text: 'Rejected' },
    };
    const statusInfo = statusMap[status] || { bg: '#e2e3e5', color: '#383d41', text: status };
    return (
      <span
        style={{
          padding: '6px 12px',
          borderRadius: '20px',
          background: statusInfo.bg,
          color: statusInfo.color,
          fontSize: '12px',
          fontWeight: '600',
        }}
      >
        {statusInfo.text}
      </span>
    );
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Calculate stats
  const totalAds = ads.length;
  const approvedAds = ads.filter(ad => ad.status === 'approved').length;
  const pendingAds = ads.filter(ad => ad.status === 'pending_admin_approval' || ad.status === 'pending_verification').length;
  const paymentsSubmitted = payments.length;

  // Calculate changes (mock data for now)
  const totalAdsChange = '+2%';
  const approvedAdsChange = '+5%';
  const pendingAdsChange = '-1';
  const paymentsChange = '+10%';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4f8' }}>
      {/* Sidebar */}
      <div style={{
        width: '250px',
        background: 'white',
        boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        height: '100vh',
        overflowY: 'auto'
      }}>
        {/* User Profile */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: '#e0e0e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              👤
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '15px' }}>{user?.name || 'John Doe'}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Seller Account</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ flex: 1, padding: '20px 0' }}>
          <nav style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              { id: 'overview', label: 'Dashboard', icon: '📊' },
              { id: 'create', label: 'Create Ad', icon: '➕' },
              { id: 'my-ads', label: 'My Ads', icon: '📋' },
              { id: 'payments', label: 'Payments', icon: '💳' },
              { id: 'notifications', label: 'Notifications', icon: '🔔' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 20px',
                  border: 'none',
                  background: activeNav === item.id ? '#e0f2fe' : 'transparent',
                  color: activeNav === item.id ? '#0070f3' : '#666',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: activeNav === item.id ? '600' : '400',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all 0.2s'
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Settings & Logout */}
        <div style={{ padding: '20px', borderTop: '1px solid #e5e7eb' }}>
          <button
            onClick={() => {}}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              border: 'none',
              background: 'transparent',
              color: '#666',
              cursor: 'pointer',
              fontSize: '14px',
              width: '100%',
              marginBottom: '8px'
            }}
          >
            <span>⚙️</span>
            <span>Settings</span>
          </button>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              border: 'none',
              background: 'transparent',
              color: '#dc3545',
              cursor: 'pointer',
              fontSize: '14px',
              width: '100%'
            }}
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ marginLeft: '250px', flex: 1, padding: '30px' }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>
            Dashboard
          </h1>
          <p style={{ color: '#666', fontSize: '16px' }}>
            Welcome back, {user?.name || 'John'}! Here's a summary of your activity.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '2px solid #e5e7eb' }}>
          {[
            { id: 'overview', label: 'Dashboard Overview' },
            { id: 'create', label: 'Create New Ad' },
            { id: 'my-ads', label: 'My Ads' },
            { id: 'payments', label: 'Payment Submission' },
            { id: 'notifications', label: 'Notifications' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveNav(tab.id as any)}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: 'transparent',
                color: activeNav === tab.id ? '#0070f3' : '#666',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: activeNav === tab.id ? '600' : '400',
                borderBottom: activeNav === tab.id ? '3px solid #0070f3' : '3px solid transparent',
                marginBottom: '-2px',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Overview */}
        {activeNav === 'overview' && (
          <>
            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total Ads</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                  {totalAds}
                </div>
                <div style={{ fontSize: '13px', color: '#28a745' }}>
                  {totalAdsChange} vs last month
                </div>
              </div>
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Approved Ads</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                  {approvedAds}
                </div>
                <div style={{ fontSize: '13px', color: '#28a745' }}>
                  {approvedAdsChange} vs last month
                </div>
              </div>
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Pending Ads</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                  {pendingAds}
                </div>
                <div style={{ fontSize: '13px', color: '#ff9800' }}>
                  {pendingAdsChange} vs last month
                </div>
              </div>
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Payments Submitted</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                  {paymentsSubmitted}
                </div>
                <div style={{ fontSize: '13px', color: '#28a745' }}>
                  {paymentsChange} vs last month
                </div>
              </div>
            </div>

            {/* My Latest Ads */}
            <div className="card">
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', color: '#333' }}>
                My Latest Ads
              </h2>
              {ads.length === 0 ? (
                <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>No ads created yet</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '13px' }}>AD TITLE</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '13px' }}>CATEGORY</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '13px' }}>PRICE</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '13px' }}>STATUS</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '13px' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ads.slice(0, 5).map((ad) => (
                        <tr key={ad.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '12px', fontSize: '14px' }}>{ad.title}</td>
                          <td style={{ padding: '12px', fontSize: '14px' }}>{ad.category_name || 'N/A'}</td>
                          <td style={{ padding: '12px', fontSize: '14px' }}>
                            {ad.price ? `$${ad.price.toFixed(2)}` : 'N/A'}
                          </td>
                          <td style={{ padding: '12px' }}>{getStatusBadge(ad.status)}</td>
                          <td style={{ padding: '12px' }}>
                            <Link href={`/ads/${ad.id}`} style={{ color: '#0070f3', fontSize: '14px', textDecoration: 'underline' }}>
                              Edit
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Create Ad */}
        {activeNav === 'create' && (
          <div className="card">
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px', color: '#333' }}>
              Create New Ad
            </h2>
            <form onSubmit={handleCreateAd}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                />
              </div>
              <div className="form-group">
                <label>Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Image URLs (comma-separated)</label>
                <input
                  type="text"
                  value={formData.image_urls}
                  onChange={(e) => setFormData({ ...formData, image_urls: e.target.value })}
                  placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                />
              </div>
              <div className="form-group">
                <label>Video URL</label>
                <input
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Package *</label>
                <select
                  value={formData.package}
                  onChange={(e) =>
                    setFormData({ ...formData, package: e.target.value as 'Free' | 'Standard' | 'Premium' })
                  }
                  required
                >
                  <option value="Free">Free</option>
                  <option value="Standard">Standard</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary">
                Create Ad
              </button>
            </form>
          </div>
        )}

        {/* My Ads */}
        {activeNav === 'my-ads' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px', color: '#333' }}>My Ads</h2>
            {ads.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ color: '#666', fontSize: '18px' }}>No ads created yet</p>
              </div>
            ) : (
              <div className="card">
                {ads.map((ad) => (
                  <div key={ad.id} style={{ padding: '15px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ marginBottom: '5px' }}>{ad.title}</h3>
                      <p style={{ color: '#666', fontSize: '14px' }}>Package: {ad.package}</p>
                      <p style={{ color: '#999', fontSize: '13px' }}>Created: {new Date(ad.created_at).toLocaleDateString()}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      {getStatusBadge(ad.status)}
                      {ad.status === 'pending_verification' && (
                        <Link href={`/seller/payment/${ad.id}`} className="btn btn-primary">
                          Submit Payment
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payments */}
        {activeNav === 'payments' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px', color: '#333' }}>Payment History</h2>
            {payments.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ color: '#666', fontSize: '18px' }}>No payments submitted</p>
              </div>
            ) : (
              <div className="card">
                {payments.map((payment) => (
                  <div key={payment.id} style={{ padding: '15px', borderBottom: '1px solid #e5e7eb' }}>
                    <h3 style={{ marginBottom: '5px' }}>Ad ID: {payment.ad_id}</h3>
                    <p style={{ marginBottom: '10px' }}>Status: {getStatusBadge(payment.status)}</p>
                    {payment.admin_note && <p style={{ color: '#666', fontSize: '14px' }}>Note: {payment.admin_note}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notifications */}
        {activeNav === 'notifications' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px', color: '#333' }}>Notifications</h2>
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#666', fontSize: '18px' }}>No new notifications</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
