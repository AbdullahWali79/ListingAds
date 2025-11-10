'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { getUser } from '@/lib/auth';
import { adminApi } from '@/lib/api';
import Toast from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';

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

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'payments' | 'ads' | 'users'>('payments');
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  
  // Toast state
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    try {
      const currentUser = getUser();
      if (!currentUser || currentUser.role !== 'admin') {
        router.push('/');
        return;
      }
      setUser(currentUser);
      fetchPendingPayments();
    } catch (error) {
      console.error('Error in admin page:', error);
      setToast({ message: 'Error loading admin page', type: 'error' });
      router.push('/');
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'ads') {
      fetchAds();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'payments') {
      fetchPendingPayments();
    }
  }, [activeTab]);

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getPendingPayments();
      setPendingPayments(response.data || []);
    } catch (error: any) {
      console.error('Failed to fetch pending payments:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to fetch pending payments';
      showToast(errorMsg, 'error');
      // If unauthorized, redirect to login
      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAds = async () => {
    try {
      const response = await adminApi.getAllAds();
      setAds(response.data);
    } catch (error) {
      console.error('Failed to fetch ads:', error);
      showToast('Failed to fetch ads', 'error');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await adminApi.getAllUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users', error);
      showToast('Failed to fetch users', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  const handleApproveClick = (payment: PendingPayment) => {
    setSelectedPayment(payment);
    setShowApproveModal(true);
  };

  const handleRejectClick = (payment: PendingPayment) => {
    setSelectedPayment(payment);
    setRejectNote('');
    setShowRejectModal(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedPayment) return;

    try {
      await adminApi.approvePayment(selectedPayment.id);
      showToast('Payment verified and ad approved successfully!', 'success');
      setShowApproveModal(false);
      setSelectedPayment(null);
      fetchPendingPayments();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to approve payment', 'error');
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedPayment || !rejectNote.trim()) {
      showToast('Please provide a rejection reason', 'error');
      return;
    }

    try {
      await adminApi.rejectPayment(selectedPayment.id, { admin_note: rejectNote });
      showToast('Payment rejected successfully', 'success');
      setShowRejectModal(false);
      setSelectedPayment(null);
      setRejectNote('');
      fetchPendingPayments();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to reject payment', 'error');
    }
  };

  const handleApproveAd = async (adId: number) => {
    try {
      await adminApi.approveAd(adId);
      showToast('Ad approved successfully!', 'success');
      fetchAds();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to approve ad', 'error');
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
            Pending Payments ({pendingPayments.length})
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
            <h2 style={{ marginBottom: '20px' }}>Pending Payment Verifications</h2>
            {loading ? (
              <p>Loading...</p>
            ) : pendingPayments.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ color: '#666', fontSize: '18px' }}>No pending payments</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    background: 'white',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <thead>
                    <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                      <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Ad Title</th>
                      <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>User</th>
                      <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Bank/Service</th>
                      <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Transaction ID</th>
                      <th style={{ padding: '15px', textAlign: 'left', fontWeight: '600' }}>Submitted</th>
                      <th style={{ padding: '15px', textAlign: 'center', fontWeight: '600' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingPayments.map((payment, index) => (
                      <tr
                        key={payment.id}
                        style={{
                          borderBottom: index < pendingPayments.length - 1 ? '1px solid #dee2e6' : 'none',
                        }}
                      >
                        <td style={{ padding: '15px' }}>
                          <strong>{payment.ad_title}</strong>
                          <br />
                          <span style={{ color: '#666', fontSize: '14px' }}>Package: {payment.package}</span>
                        </td>
                        <td style={{ padding: '15px' }}>
                          {payment.user_name}
                          <br />
                          <span style={{ color: '#666', fontSize: '14px' }}>{payment.user_email}</span>
                        </td>
                        <td style={{ padding: '15px' }}>
                          {payment.bank_name}
                          <br />
                          <span style={{ color: '#666', fontSize: '14px' }}>
                            Sender: {payment.sender_name}
                          </span>
                        </td>
                        <td style={{ padding: '15px' }}>
                          <code
                            style={{
                              background: '#f8f9fa',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '14px',
                            }}
                          >
                            {payment.transaction_id}
                          </code>
                          {payment.screenshot_url && (
                            <div style={{ marginTop: '8px' }}>
                              <a
                                href={payment.screenshot_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#0070f3', fontSize: '14px' }}
                              >
                                View Screenshot →
                              </a>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '15px', color: '#666', fontSize: '14px' }}>
                          {new Date(payment.created_at).toLocaleString()}
                        </td>
                        <td style={{ padding: '15px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleApproveClick(payment)}
                              className="btn btn-success"
                              style={{ padding: '8px 16px', fontSize: '14px' }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectClick(payment)}
                              className="btn btn-danger"
                              style={{ padding: '8px 16px', fontSize: '14px' }}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={showApproveModal}
        title="Approve Payment"
        message={`Are you sure you want to verify this payment and approve the ad "${selectedPayment?.ad_title}"?`}
        confirmText="Approve"
        cancelText="Cancel"
        type="success"
        onConfirm={handleApproveConfirm}
        onCancel={() => {
          setShowApproveModal(false);
          setSelectedPayment(null);
        }}
      />

      <ConfirmModal
        isOpen={showRejectModal}
        title="Reject Payment"
        message="Please provide a reason for rejecting this payment:"
        confirmText="Reject"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleRejectConfirm}
        onCancel={() => {
          setShowRejectModal(false);
          setSelectedPayment(null);
          setRejectNote('');
        }}
      >
        {showRejectModal && (
          <div style={{ marginTop: '15px' }}>
            <textarea
              placeholder="Rejection reason (required)"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px',
                fontFamily: 'inherit',
              }}
              required
            />
          </div>
        )}
      </ConfirmModal>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
