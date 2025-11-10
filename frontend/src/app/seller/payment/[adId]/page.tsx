'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { getUser } from '@/lib/auth';
import { paymentApi, adApi } from '@/lib/api';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [instructions, setInstructions] = useState<any>(null);
  const [ad, setAd] = useState<any>(null);
  const [formData, setFormData] = useState({
    sender_name: '',
    bank_name: '',
    transaction_id: '',
    screenshot_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [instructionsRes, adRes] = await Promise.all([
        paymentApi.getInstructions(),
        adApi.getById(Number(params.adId)),
      ]);
      setInstructions(instructionsRes.data);
      setAd(adRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await paymentApi.submit({
        ad_id: Number(params.adId),
        sender_name: formData.sender_name,
        bank_name: formData.bank_name,
        transaction_id: formData.transaction_id,
        screenshot_url: formData.screenshot_url || undefined,
      });
      alert('Payment submitted successfully! Waiting for admin verification.');
      router.push('/seller');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to submit payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ paddingTop: '40px' }}>
          <p>Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: '40px', paddingBottom: '40px', maxWidth: '800px' }}>
        <h1 style={{ marginBottom: '30px' }}>Submit Payment</h1>

        {instructions && (
          <div className="card" style={{ background: '#f0f7ff', marginBottom: '30px' }}>
            <h2 style={{ marginBottom: '15px' }}>Payment Instructions</h2>
            <p><strong>Bank Name:</strong> {instructions.bank_name}</p>
            <p><strong>Account Number:</strong> {instructions.account_number}</p>
            <p><strong>Account Title:</strong> {instructions.account_title}</p>
            <p style={{ marginTop: '15px', color: '#666' }}>
              Please transfer the payment for your {ad?.package} package ad and submit the details below.
            </p>
          </div>
        )}

        <div className="card">
          <h2 style={{ marginBottom: '20px' }}>Payment Details</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Sender Name *</label>
              <input
                type="text"
                value={formData.sender_name}
                onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Bank Name or Service *</label>
              <input
                type="text"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                placeholder="e.g., Easypaisa, JazzCash, Bank Name"
                required
              />
            </div>
            <div className="form-group">
              <label>Transaction ID *</label>
              <input
                type="text"
                value={formData.transaction_id}
                onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Screenshot URL (optional)</label>
              <input
                type="url"
                value={formData.screenshot_url}
                onChange={(e) => setFormData({ ...formData, screenshot_url: e.target.value })}
                placeholder="https://example.com/screenshot.jpg"
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Payment'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

