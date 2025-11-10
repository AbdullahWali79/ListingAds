'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { getUser } from '@/lib/auth';
import { adminApi } from '@/lib/api';

interface PendingPayment {
  id: number;
  ad_id: number;
  ad_title: string;
  package: string;
  sender_name: string;
  bank_name: string;
  transaction_id: string;
  screenshot_url: string;
  user_name: string;
  user_email: string;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'payments' | 'ads' | 'users'>('payments');
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [rejectNote, setRejectNote] = useState('');
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser || currentUser.role !== 'admin') {
      router.push('/');
      return;
    }
    setUser(currentUser);
    fetchPendingPayments();
  }, []);

  useEffect(() => {
    if (activeTab === 'ads') {
      fetchAds();
    } else if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchPendingPayments = async () => {
    try {
      const response = await adminApi.getPendingPayments();
      setPendingPayments(response.data);
    } catch (error) {
      console.error('Failed to fetch pending payments:', error);
    }
  };

  const fetchAds = async () => {
    try {
      const response = await adminApi.getAllAds();
      setAds(response.data);
    } catch (error) {
      console.error('Failed to fetch ads:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await adminApi.getAllUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleApprovePayment = async (paymentId: number) => {
    if (!confirm('Approve this payment?')) return;

    try {
      await adminApi.approvePayment(paymentId);
      alert('Payment approved successfully!');
      fetchPendingPayments();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to approve payment');
    }
  };

  const handleRejectPayment = async (paymentId: number) => {
    if (!rejectNote.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    if (!confirm('Reject this payment?')) return;

    try {
      await adminApi.rejectPayment(paymentId, { admin_note: rejectNote });
      alert('Payment rejected');
      setRejectNote('');
      setSelectedPaymentId(null);
      fetchPendingPayments();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to reject payment');
    }
  };

  const handleApproveAd = async (adId: number) => {
    if (!confirm('Approve this ad?')) return;

    try {
      await adminApi.approveAd(adId);
      alert('Ad approved successfully!');
      fetchAds();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to approve ad');
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
        <h1 style={{ marginBottom: '30px' }}>Admin Dashboard</h1>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '2px solid #ddd' }}>
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
            Pending Payments
          </button>
          <button
            onClick={() => setActiveTab('ads')}
            className="btn"
            style={{
              background: activeTab === 'ads' ? '#0070f3' : 'transparent',
              color: activeTab === 'ads' ? 'white' : 'black',
              border: 'none',
              borderBottom: activeTab === 'ads' ? '3px solid #0070f3' : 'none',
            }}
          >
            All Ads
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className="btn"
            style={{
              background: activeTab === 'users' ? '#0070f3' : 'transparent',
              color: activeTab === 'users' ? 'white' : 'black',
              border: 'none',
              borderBottom: activeTab === 'users' ? '3px solid #0070f3' : 'none',
            }}
          >
            Users
          </button>
        </div>

        {activeTab === 'payments' && (
          <div>
            <h2 style={{ marginBottom: '20px' }}>Pending Payments ({pendingPayments.length})</h2>
            {pendingPayments.length === 0 ? (
              <p>No pending payments</p>
            ) : (
              <div>
                {pendingPayments.map((payment) => (
                  <div key={payment.id} className="card">
                    <h3>{payment.ad_title}</h3>
                    <p><strong>Package:</strong> {payment.package}</p>
                    <p><strong>User:</strong> {payment.user_name} ({payment.user_email})</p>
                    <p><strong>Sender Name:</strong> {payment.sender_name}</p>
                    <p><strong>Bank/Service:</strong> {payment.bank_name}</p>
                    <p><strong>Transaction ID:</strong> {payment.transaction_id}</p>
                    {payment.screenshot_url && (
                      <p>
                        <strong>Screenshot:</strong>{' '}
                        <a href={payment.screenshot_url} target="_blank" rel="noopener noreferrer">
                          View
                        </a>
                      </p>
                    )}
                    <p style={{ color: '#999', fontSize: '14px' }}>
                      Submitted: {new Date(payment.created_at).toLocaleString()}
                    </p>
                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleApprovePayment(payment.id)}
                        className="btn btn-success"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setSelectedPaymentId(payment.id)}
                        className="btn btn-danger"
                      >
                        Reject
                      </button>
                    </div>
                    {selectedPaymentId === payment.id && (
                      <div style={{ marginTop: '15px' }}>
                        <textarea
                          placeholder="Rejection reason (required)"
                          value={rejectNote}
                          onChange={(e) => setRejectNote(e.target.value)}
                          style={{ width: '100%', minHeight: '80px', marginBottom: '10px' }}
                        />
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => handleRejectPayment(payment.id)}
                            className="btn btn-danger"
                          >
                            Confirm Reject
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPaymentId(null);
                              setRejectNote('');
                            }}
                            className="btn btn-secondary"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'ads' && (
          <div>
            <h2 style={{ marginBottom: '20px' }}>All Ads</h2>
            {ads.length === 0 ? (
              <p>No ads</p>
            ) : (
              <div>
                {ads.map((ad) => (
                  <div key={ad.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3>{ad.title}</h3>
                        <p style={{ color: '#666' }}>By {ad.seller_name}</p>
                        <p style={{ color: '#999', fontSize: '14px' }}>
                          {new Date(ad.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {getStatusBadge(ad.status)}
                    </div>
                    {ad.status === 'pending_admin_approval' && (
                      <div style={{ marginTop: '15px' }}>
                        <button
                          onClick={() => handleApproveAd(ad.id)}
                          className="btn btn-success"
                        >
                          Approve Ad
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h2 style={{ marginBottom: '20px' }}>All Users</h2>
            {users.length === 0 ? (
              <p>No users</p>
            ) : (
              <div>
                {users.map((user) => (
                  <div key={user.id} className="card">
                    <h3>{user.name}</h3>
                    <p>{user.email}</p>
                    <p>Role: {user.role}</p>
                    <p style={{ color: '#999', fontSize: '14px' }}>
                      Joined: {new Date(user.created_at).toLocaleDateString()}
                    </p>
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

