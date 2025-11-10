'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUser, logout } from '@/lib/auth';
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

interface Ad {
  id: number;
  title: string;
  status: string;
  category_name: string;
  seller_name: string;
  created_at: string;
}

interface Stats {
  totalUsers: { value: number; change: string; period: string };
  totalAds: { value: number; change: string; period: string };
  pendingPayments: { value: number; change: string; period: string };
  approvedAds: { value: number; change: string; period: string };
}

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeNav, setActiveNav] = useState<'overview' | 'ads' | 'payments' | 'categories' | 'users'>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentAds, setRecentAds] = useState<Ad[]>([]);
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
      fetchStats();
      fetchRecentAds();
      fetchPendingPayments();
    } catch (error) {
      console.error('Error in admin page:', error);
      setToast({ message: 'Error loading admin page', type: 'error' });
      router.push('/');
    }
  }, []);

  useEffect(() => {
    if (activeNav === 'ads') {
      fetchAds();
    } else if (activeNav === 'users') {
      fetchUsers();
    } else if (activeNav === 'payments') {
      fetchPendingPayments();
    } else if (activeNav === 'overview') {
      fetchStats();
      fetchRecentAds();
    }
  }, [activeNav]);

  const fetchStats = async () => {
    try {
      const response = await adminApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentAds = async () => {
    try {
      const response = await adminApi.getAllAds({ limit: 5 });
      setRecentAds(response.data || []);
    } catch (error) {
      console.error('Failed to fetch recent ads:', error);
    }
  };

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getPendingPayments();
      setPendingPayments(response.data || []);
    } catch (error: any) {
      console.error('Failed to fetch pending payments:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to fetch pending payments';
      showToast(errorMsg, 'error');
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
      fetchStats();
      fetchRecentAds();
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
      fetchRecentAds();
      fetchStats();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Failed to approve ad', 'error');
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
        {/* Logo */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <span style={{ fontSize: '24px', color: '#0070f3' }}>📋</span>
            <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#0070f3' }}>Classifieds</span>
          </Link>
        </div>

        {/* Navigation */}
        <div style={{ flex: 1, padding: '20px 0' }}>
          <nav style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'ads', label: 'Manage Ads', icon: '📄' },
              { id: 'payments', label: 'Payments', icon: '💳' },
              { id: 'categories', label: 'Categories', icon: '📁' },
              { id: 'users', label: 'Users', icon: '👥' },
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

        {/* User Info */}
        <div style={{ padding: '20px', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#e0e0e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              👤
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px' }}>{user?.name || 'Admin Name'}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>{user?.email || 'administrator@classifieds.c'}</div>
            </div>
          </div>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>
              Dashboard Overview
            </h1>
            <p style={{ color: '#666', fontSize: '14px' }}>
              Welcome back, {user?.name || 'Admin'}! Here's a summary of your activity.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <input
              type="text"
              placeholder="Search..."
              style={{
                padding: '10px 15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                width: '250px'
              }}
            />
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#e0e0e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}>
              👤
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {activeNav === 'overview' && stats && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total Users</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                  {stats.totalUsers.value.toLocaleString()}
                </div>
                <div style={{ fontSize: '13px', color: '#28a745' }}>
                  +{stats.totalUsers.change}% {stats.totalUsers.period}
                </div>
              </div>
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total Ads</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                  {stats.totalAds.value.toLocaleString()}
                </div>
                <div style={{ fontSize: '13px', color: '#28a745' }}>
                  +{stats.totalAds.change}% {stats.totalAds.period}
                </div>
              </div>
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Pending Payments</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                  {stats.pendingPayments.value}
                </div>
                <div style={{ fontSize: '13px', color: '#28a745' }}>
                  +{stats.pendingPayments.change}% {stats.pendingPayments.period}
                </div>
              </div>
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Approved Ads</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                  {stats.approvedAds.value.toLocaleString()}
                </div>
                <div style={{ fontSize: '13px', color: '#28a745' }}>
                  +{stats.approvedAds.change}% {stats.approvedAds.period}
                </div>
              </div>
            </div>

            {/* Recent Ad Submissions */}
            <div className="card">
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', color: '#333' }}>
                Recent Ad Submissions
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '13px' }}>AD TITLE</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '13px' }}>SUBMITTER</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '13px' }}>CATEGORY</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '13px' }}>DATE SUBMITTED</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '13px' }}>STATUS</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#666', fontSize: '13px' }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAds.map((ad) => (
                      <tr key={ad.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '12px', fontSize: '14px' }}>{ad.title}</td>
                        <td style={{ padding: '12px', fontSize: '14px' }}>{ad.seller_name}</td>
                        <td style={{ padding: '12px', fontSize: '14px' }}>{ad.category_name}</td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>
                          {new Date(ad.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px' }}>{getStatusBadge(ad.status)}</td>
                        <td style={{ padding: '12px' }}>
                          {ad.status === 'pending_admin_approval' ? (
                            <button
                              onClick={() => handleApproveAd(ad.id)}
                              style={{
                                color: '#0070f3',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '14px',
                                textDecoration: 'underline',
                                marginRight: '10px'
                              }}
                            >
                              Approve / Reject
                            </button>
                          ) : (
                            <Link href={`/ads/${ad.id}`} style={{ color: '#0070f3', fontSize: '14px', textDecoration: 'underline' }}>
                              View
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Payments Tab */}
        {activeNav === 'payments' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px', color: '#333' }}>
              Pending Payment Verifications
            </h2>
            {loading ? (
              <p>Loading...</p>
            ) : pendingPayments.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ color: '#666', fontSize: '18px' }}>No pending payments</p>
              </div>
            ) : (
              <div className="card" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
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
                      <tr key={payment.id} style={{ borderBottom: index < pendingPayments.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
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
                          <span style={{ color: '#666', fontSize: '14px' }}>Sender: {payment.sender_name}</span>
                        </td>
                        <td style={{ padding: '15px' }}>
                          <code style={{ background: '#f8f9fa', padding: '4px 8px', borderRadius: '4px', fontSize: '14px' }}>
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

        {/* Ads Tab */}
        {activeNav === 'ads' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px', color: '#333' }}>All Ads</h2>
            {ads.length === 0 ? (
              <p>No ads</p>
            ) : (
              <div className="card">
                {ads.map((ad) => (
                  <div key={ad.id} style={{ padding: '15px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ marginBottom: '5px' }}>{ad.title}</h3>
                      <p style={{ color: '#666', fontSize: '14px' }}>By {ad.seller_name}</p>
                      <p style={{ color: '#999', fontSize: '13px' }}>{new Date(ad.created_at).toLocaleDateString()}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      {getStatusBadge(ad.status)}
                      {ad.status === 'pending_admin_approval' && (
                        <button onClick={() => handleApproveAd(ad.id)} className="btn btn-success">
                          Approve Ad
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeNav === 'users' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px', color: '#333' }}>All Users</h2>
            {users.length === 0 ? (
              <p>No users</p>
            ) : (
              <div className="card">
                {users.map((user) => (
                  <div key={user.id} style={{ padding: '15px', borderBottom: '1px solid #e5e7eb' }}>
                    <h3 style={{ marginBottom: '5px' }}>{user.name}</h3>
                    <p style={{ color: '#666', fontSize: '14px' }}>{user.email}</p>
                    <p style={{ color: '#999', fontSize: '13px' }}>Role: {user.role} | Joined: {new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Categories Tab */}
        {activeNav === 'categories' && (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px', color: '#333' }}>Categories</h2>
            <p style={{ color: '#666' }}>Category management coming soon...</p>
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
    </div>
  );
}
