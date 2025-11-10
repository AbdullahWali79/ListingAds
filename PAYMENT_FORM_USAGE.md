# PaymentForm Component Usage Guide

## Component Overview

The `PaymentForm` component is a reusable React component for submitting payment details for paid ads.

## Component Location

`frontend/src/components/PaymentForm.tsx`

## Props

```typescript
interface PaymentFormProps {
  adId: number;        // Required: The ID of the ad for which payment is being submitted
  onSuccess?: () => void;  // Optional: Callback function called after successful submission
}
```

## Fields

- **Sender Name** (text, required)
- **Bank/Service Name** (select, required): Options are:
  - Bank
  - Easypaisa
  - JazzCash
  - Other
- **Transaction ID** (text, required)
- **Screenshot URL** (text, optional)

## Validation

- All fields except screenshot URL are required
- Form validates before submission
- Shows error messages for missing required fields

## Backend Route

**POST** `/api/payments`

### Request Body:
```json
{
  "ad_id": 123,
  "sender_name": "John Doe",
  "bank_name": "Easypaisa",
  "transaction_id": "TXN123456",
  "screenshot_url": "https://example.com/screenshot.jpg" // optional
}
```

### Response:
- **201 Created**: Payment submitted successfully
- **400 Bad Request**: Validation error or ad not in correct status
- **404 Not Found**: Ad not found or not owned by user

### Database Insert:
- Inserts into `payments` table with `status='pending'`
- Links to `ad_id` and `user_id` (from JWT token)

## Example 1: Using in Seller Dashboard After Ad Creation

```tsx
'use client';

import { useState } from 'react';
import PaymentForm from '@/components/PaymentForm';
import { adApi } from '@/lib/api';

export default function SellerDashboard() {
  const [createdAd, setCreatedAd] = useState<any>(null);
  const [showPayment, setShowPayment] = useState(false);

  const handleCreateAd = async (adData: any) => {
    try {
      const response = await adApi.create(adData);
      setCreatedAd(response.data);
      
      // If paid package, show payment form
      if (adData.package !== 'Free') {
        setShowPayment(true);
      }
    } catch (error) {
      console.error('Failed to create ad:', error);
    }
  };

  const handlePaymentSuccess = () => {
    alert('Payment submitted! Your ad will be reviewed by admin.');
    setShowPayment(false);
  };

  return (
    <div>
      {showPayment && createdAd ? (
        <div>
          <h2>Submit Payment</h2>
          <PaymentForm 
            adId={createdAd.id} 
            onSuccess={handlePaymentSuccess}
          />
        </div>
      ) : (
        <AdCreationForm onSubmit={handleCreateAd} />
      )}
    </div>
  );
}
```

## Example 2: Using in Payment Page

```tsx
'use client';

import { useParams } from 'next/navigation';
import PaymentForm from '@/components/PaymentForm';

export default function PaymentPage() {
  const params = useParams();
  const adId = Number(params.adId);

  return (
    <div>
      <h1>Submit Payment</h1>
      <PaymentForm 
        adId={adId}
        onSuccess={() => {
          // Redirect or show success message
          window.location.href = '/seller';
        }}
      />
    </div>
  );
}
```

## Example 3: Inline in My Ads List

```tsx
'use client';

import { useState } from 'react';
import PaymentForm from '@/components/PaymentForm';

export default function MyAds() {
  const [ads, setAds] = useState([]);
  const [selectedAdId, setSelectedAdId] = useState<number | null>(null);

  return (
    <div>
      {ads.map((ad) => (
        <div key={ad.id}>
          <h3>{ad.title}</h3>
          {ad.status === 'pending_verification' && (
            <div>
              {selectedAdId === ad.id ? (
                <PaymentForm 
                  adId={ad.id}
                  onSuccess={() => {
                    setSelectedAdId(null);
                    // Refresh ads list
                  }}
                />
              ) : (
                <button onClick={() => setSelectedAdId(ad.id)}>
                  Submit Payment
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

## Success Message

After successful submission, the component automatically displays:

> **"Your payment is under review. Admin will verify it soon."**

## Backend Implementation Details

The backend route `/api/payments` (POST):

1. **Validates** required fields (ad_id, sender_name, bank_name, transaction_id)
2. **Verifies** the ad belongs to the authenticated user
3. **Checks** ad status is `pending_verification`
4. **Prevents** duplicate payment submissions
5. **Inserts** payment record with `status='pending'`
6. **Creates** audit log entry
7. **Returns** the created payment record

## Database Schema

The payment is saved to the `payments` table:

```sql
INSERT INTO payments (
  ad_id,
  user_id,           -- from JWT token
  sender_name,
  bank_name,
  transaction_id,
  screenshot_url,
  status             -- set to 'pending'
)
```

## Notes

- The `user_id` is automatically extracted from the JWT token, not from the form
- The `ad_id` must be provided as a prop
- Only one pending payment per ad is allowed
- The ad must be in `pending_verification` status

