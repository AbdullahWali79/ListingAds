'use client';

/**
 * Example: Using PaymentForm component in Seller Dashboard after ad creation
 * 
 * This demonstrates how to integrate the PaymentForm component after creating an ad
 */

import { useState, useEffect } from 'react';
import PaymentForm from './PaymentForm';
import { adApi, categoryApi } from '@/lib/api';

export default function PaymentFormExample() {
  const [adCreated, setAdCreated] = useState<any>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category_id: '',
    package: 'Free' as 'Free' | 'Standard' | 'Premium',
  });

  // Fetch categories on mount
  useEffect(() => {
    categoryApi.getAll().then((res) => setCategories(res.data));
  }, []);

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await adApi.create({
        title: formData.title,
        description: formData.description || undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        category_id: parseInt(formData.category_id),
        package: formData.package,
      });

      setAdCreated(response.data);

      // If paid package, show payment form
      if (formData.package !== 'Free') {
        setShowPaymentForm(true);
      } else {
        alert('Ad created! Waiting for admin approval.');
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create ad');
    }
  };

  const handlePaymentSuccess = () => {
    alert('Payment submitted! Your ad will be reviewed by admin.');
    setShowPaymentForm(false);
    // Reset form or redirect
  };

  if (showPaymentForm && adCreated) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Submit Payment for Your Ad</h2>
        <p style={{ marginBottom: '20px' }}>
          Your ad &quot;{adCreated.title}&quot; has been created. Please submit payment details.
        </p>
        <PaymentForm adId={adCreated.id} onSuccess={handlePaymentSuccess} />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <h2>Create New Ad</h2>
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
  );
}

