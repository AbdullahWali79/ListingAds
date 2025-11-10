'use client';

import { useState } from 'react';
import { paymentApi } from '@/lib/api';

interface PaymentFormProps {
  adId: number;
  onSuccess?: () => void;
}

export default function PaymentForm({ adId, onSuccess }: PaymentFormProps) {
  const [formData, setFormData] = useState({
    sender_name: '',
    bank_name: 'Bank',
    transaction_id: '',
    screenshot_url: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.sender_name.trim()) {
      newErrors.sender_name = 'Sender name is required';
    }

    if (!formData.bank_name || formData.bank_name === '') {
      newErrors.bank_name = 'Bank/Service name is required';
    }

    if (!formData.transaction_id.trim()) {
      newErrors.transaction_id = 'Transaction ID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      // Determine the bank_name value - if "Other" is selected, we need to handle it
      let bankNameValue = formData.bank_name;
      if (formData.bank_name === 'Other') {
        // If Other is selected, you might want to add an input field for custom value
        // For now, we'll use "Other" as the value
        bankNameValue = 'Other';
      }

      await paymentApi.submit({
        ad_id: adId,
        sender_name: formData.sender_name.trim(),
        bank_name: bankNameValue,
        transaction_id: formData.transaction_id.trim(),
        screenshot_url: formData.screenshot_url.trim() || undefined,
      });

      setSubmitted(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to submit payment';
      setErrors({ submit: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="card" style={{ background: '#d4edda', border: '1px solid #c3e6cb', padding: '20px', borderRadius: '5px' }}>
        <h3 style={{ color: '#155724', marginBottom: '10px' }}>Payment Submitted Successfully!</h3>
        <p style={{ color: '#155724' }}>
          Your payment is under review. Admin will verify it soon.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 style={{ marginBottom: '20px' }}>Payment Details</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>
            Sender Name <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="text"
            value={formData.sender_name}
            onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
            required
            style={{ borderColor: errors.sender_name ? 'red' : undefined }}
          />
          {errors.sender_name && (
            <span style={{ color: 'red', fontSize: '14px', display: 'block', marginTop: '5px' }}>
              {errors.sender_name}
            </span>
          )}
        </div>

        <div className="form-group">
          <label>
            Bank/Service Name <span style={{ color: 'red' }}>*</span>
          </label>
          <select
            value={formData.bank_name}
            onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
            required
            style={{ borderColor: errors.bank_name ? 'red' : undefined }}
          >
            <option value="Bank">Bank</option>
            <option value="Easypaisa">Easypaisa</option>
            <option value="JazzCash">JazzCash</option>
            <option value="Other">Other</option>
          </select>
          {errors.bank_name && (
            <span style={{ color: 'red', fontSize: '14px', display: 'block', marginTop: '5px' }}>
              {errors.bank_name}
            </span>
          )}
        </div>

        <div className="form-group">
          <label>
            Transaction ID <span style={{ color: 'red' }}>*</span>
          </label>
          <input
            type="text"
            value={formData.transaction_id}
            onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
            required
            style={{ borderColor: errors.transaction_id ? 'red' : undefined }}
          />
          {errors.transaction_id && (
            <span style={{ color: 'red', fontSize: '14px', display: 'block', marginTop: '5px' }}>
              {errors.transaction_id}
            </span>
          )}
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

        {errors.submit && (
          <div style={{ color: 'red', marginBottom: '15px', padding: '10px', background: '#f8d7da', borderRadius: '5px' }}>
            {errors.submit}
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Payment'}
        </button>
      </form>
    </div>
  );
}

