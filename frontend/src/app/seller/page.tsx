'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { getUser } from '@/lib/auth';
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
  const [activeTab, setActiveTab] = useState<'create' | 'my-ads' | 'payments'>('create');
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
      if (formData.package !== 'Free') {
        setActiveTab('payments');
        router.push(`/seller/payment/${response.data.id}`);
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create ad');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: any = {
      approved: '#28a745',
      pending_admin_approval: '#ffc107',
      pending_verification: '#17a2b8',
      rejected: '#dc3545',
    };
    return (
      <span
        style={{
          padding: '5px 10px',
          borderRadius: '5px',
          background: colors[status] || '#6c757d',
          color: 'white',
          fontSize: '12px',
        }}
      >
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
        <h1 style={{ marginBottom: '30px' }}>Seller Dashboard</h1>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '2px solid #ddd' }}>
          <button
            onClick={() => setActiveTab('create')}
            className="btn"
            style={{
              background: activeTab === 'create' ? '#0070f3' : 'transparent',
              color: activeTab === 'create' ? 'white' : 'black',
              border: 'none',
              borderBottom: activeTab === 'create' ? '3px solid #0070f3' : 'none',
            }}
          >
            Create Ad
          </button>
          <button
            onClick={() => setActiveTab('my-ads')}
            className="btn"
            style={{
              background: activeTab === 'my-ads' ? '#0070f3' : 'transparent',
              color: activeTab === 'my-ads' ? 'white' : 'black',
              border: 'none',
              borderBottom: activeTab === 'my-ads' ? '3px solid #0070f3' : 'none',
            }}
          >
            My Ads
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className="btn"
            style={{
              background: activeTab === 'payments' ? '#0070f3' : 'transparent',
              color: activeTab === 'payments' ? 'white' : 'black',
              border: 'none',
              borderBottom: activeTab === 'payments' ? '3px solid #0070f3' : 'none',
            }}
          >
            Payments
          </button>
        </div>

        {activeTab === 'create' && (
          <div className="card">
            <h2 style={{ marginBottom: '20px' }}>Create New Ad</h2>
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

        {activeTab === 'my-ads' && (
          <div>
            <h2 style={{ marginBottom: '20px' }}>My Ads</h2>
            {ads.length === 0 ? (
              <p>No ads created yet</p>
            ) : (
              <div>
                {ads.map((ad) => (
                  <div key={ad.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3>{ad.title}</h3>
                        <p style={{ color: '#666' }}>Package: {ad.package}</p>
                        <p style={{ color: '#999', fontSize: '14px' }}>
                          Created: {new Date(ad.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(ad.status)}
                    </div>
                    {ad.status === 'pending_verification' && (
                      <div style={{ marginTop: '15px' }}>
                        <a href={`/seller/payment/${ad.id}`} className="btn btn-primary">
                          Submit Payment
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'payments' && (
          <div>
            <h2 style={{ marginBottom: '20px' }}>Payment History</h2>
            {payments.length === 0 ? (
              <p>No payments submitted</p>
            ) : (
              <div>
                {payments.map((payment) => (
                  <div key={payment.id} className="card">
                    <h3>Ad ID: {payment.ad_id}</h3>
                    <p>Status: {getStatusBadge(payment.status)}</p>
                    {payment.admin_note && <p>Note: {payment.admin_note}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

