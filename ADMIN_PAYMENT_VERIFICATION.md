# Admin Payment Verification System

## Overview

Complete admin payment verification system with backend routes, SQL queries, and React admin dashboard.

## Backend Endpoints

### 1. GET /api/admin/payments/pending

**Description:** Get list of all pending payments with ad and user details

**Authentication:** Admin only

**Response:**
```json
[
  {
    "id": 1,
    "ad_id": 5,
    "ad_title": "iPhone 13 Pro",
    "package": "Premium",
    "sender_name": "John Doe",
    "bank_name": "Easypaisa",
    "transaction_id": "TXN123456",
    "screenshot_url": "https://example.com/screenshot.jpg",
    "user_name": "John Doe",
    "user_email": "john@example.com",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

### 2. POST /api/admin/payments/:id/approve

**Description:** Approve payment and activate ad

**Authentication:** Admin only

**Request Body (optional):**
```json
{
  "admin_note": "Payment verified successfully"
}
```

**SQL Updates:**
```sql
-- Update payment status to 'verified'
UPDATE payments 
SET status = 'verified', 
    verified_at = CURRENT_TIMESTAMP, 
    admin_note = $1
WHERE id = $2;

-- Update ad status to 'approved'
UPDATE ads 
SET status = 'approved' 
WHERE id = $1;
```

**Audit Log:**
```sql
INSERT INTO audit_logs (action, actor_id, target_id, target_type, details)
VALUES ('payment_approved', $1, $2, 'payment', $3);
```

**Response:**
```json
{
  "message": "Payment approved and ad activated"
}
```

### 3. POST /api/admin/payments/:id/reject

**Description:** Reject payment with admin note

**Authentication:** Admin only

**Request Body (required):**
```json
{
  "admin_note": "Transaction ID does not match"
}
```

**SQL Updates:**
```sql
-- Update payment status to 'rejected'
UPDATE payments 
SET status = 'rejected', 
    admin_note = $1
WHERE id = $2;

-- Update ad status to 'rejected'
UPDATE ads 
SET status = 'rejected', 
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1;
```

**Audit Log:**
```sql
INSERT INTO audit_logs (action, actor_id, target_id, target_type, details)
VALUES ('payment_rejected', $1, $2, 'payment', $3);
```

**Response:**
```json
{
  "message": "Payment rejected"
}
```

## Database Schema Updates

### Payments Table Status Values

Updated to use `'verified'` instead of `'approved'`:

```sql
-- Schema update
ALTER TABLE payments 
DROP CONSTRAINT IF EXISTS payments_status_check;

ALTER TABLE payments 
ADD CONSTRAINT payments_status_check 
CHECK (status IN ('pending', 'verified', 'rejected'));
```

Or in new migrations:

```sql
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  ad_id INTEGER REFERENCES ads(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  sender_name VARCHAR(255) NOT NULL,
  bank_name VARCHAR(255) NOT NULL,
  transaction_id VARCHAR(255) NOT NULL,
  screenshot_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  admin_note TEXT,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Frontend Components

### 1. Admin Dashboard (`/admin`)

**Features:**
- Table view of pending payments
- Columns: Ad Title, User, Bank/Service, Transaction ID, Submitted Date, Actions
- Approve/Reject buttons for each payment
- Confirmation modals before actions
- Toast notifications for success/error messages
- Responsive design

### 2. ConfirmModal Component

**Location:** `frontend/src/components/ConfirmModal.tsx`

**Props:**
- `isOpen`: boolean
- `title`: string
- `message`: string
- `confirmText`: string (default: "Confirm")
- `cancelText`: string (default: "Cancel")
- `onConfirm`: () => void
- `onCancel`: () => void
- `type`: 'danger' | 'success' | 'info'
- `children`: React.ReactNode (for additional content like textarea)

### 3. Toast Component

**Location:** `frontend/src/components/Toast.tsx`

**Props:**
- `message`: string
- `type`: 'success' | 'error' | 'info'
- `onClose`: () => void
- `duration`: number (default: 3000ms)

## Complete SQL Queries

### Approve Payment Flow

```sql
-- Step 1: Verify payment exists and is pending
SELECT * FROM payments WHERE id = $1;

-- Step 2: Update payment status
UPDATE payments 
SET status = 'verified', 
    verified_at = CURRENT_TIMESTAMP, 
    admin_note = COALESCE($1, admin_note)
WHERE id = $2;

-- Step 3: Update ad status
UPDATE ads 
SET status = 'approved',
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1;

-- Step 4: Create audit log
INSERT INTO audit_logs (action, actor_id, target_id, target_type, details, created_at)
VALUES (
  'payment_approved',
  $1,  -- admin user_id
  $2,  -- payment_id
  'payment',
  '{"ad_id": $3}'::jsonb,
  CURRENT_TIMESTAMP
);
```

### Reject Payment Flow

```sql
-- Step 1: Verify payment exists and is pending
SELECT * FROM payments WHERE id = $1;

-- Step 2: Update payment status
UPDATE payments 
SET status = 'rejected', 
    admin_note = $1
WHERE id = $2;

-- Step 3: Update ad status
UPDATE ads 
SET status = 'rejected',
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1;

-- Step 4: Create audit log
INSERT INTO audit_logs (action, actor_id, target_id, target_type, details, created_at)
VALUES (
  'payment_rejected',
  $1,  -- admin user_id
  $2,  -- payment_id
  'payment',
  '{"ad_id": $3, "reason": $4}'::jsonb,
  CURRENT_TIMESTAMP
);
```

### Get Pending Payments

```sql
SELECT 
  p.id,
  p.ad_id,
  p.sender_name,
  p.bank_name,
  p.transaction_id,
  p.screenshot_url,
  p.created_at,
  a.title as ad_title,
  a.package,
  u.name as user_name,
  u.email as user_email
FROM payments p
LEFT JOIN ads a ON p.ad_id = a.id
LEFT JOIN users u ON p.user_id = u.id
WHERE p.status = 'pending'
ORDER BY p.created_at ASC;
```

## Frontend Usage Example

```tsx
import { adminApi } from '@/lib/api';
import ConfirmModal from '@/components/ConfirmModal';
import Toast from '@/components/Toast';

// Approve payment
const handleApprove = async (paymentId: number) => {
  try {
    await adminApi.approvePayment(paymentId);
    showToast('Payment verified and ad approved!', 'success');
    fetchPendingPayments(); // Refresh list
  } catch (error) {
    showToast('Failed to approve payment', 'error');
  }
};

// Reject payment
const handleReject = async (paymentId: number, reason: string) => {
  try {
    await adminApi.rejectPayment(paymentId, { admin_note: reason });
    showToast('Payment rejected', 'success');
    fetchPendingPayments(); // Refresh list
  } catch (error) {
    showToast('Failed to reject payment', 'error');
  }
};
```

## Status Flow

1. **Payment Submitted** → `status = 'pending'`
2. **Admin Approves** → `payment.status = 'verified'`, `ad.status = 'approved'`
3. **Admin Rejects** → `payment.status = 'rejected'`, `ad.status = 'rejected'`

## Files Created/Updated

### Backend
- `backend/src/routes/admin.js` - Updated approve/reject routes
- `backend/src/db/schema.sql` - Updated payment status constraint

### Frontend
- `frontend/src/app/admin/page.tsx` - Complete admin dashboard with table
- `frontend/src/components/ConfirmModal.tsx` - Reusable confirmation modal
- `frontend/src/components/Toast.tsx` - Toast notification component

## Testing

1. Create a paid ad (Standard or Premium package)
2. Submit payment details
3. Login as admin
4. Navigate to `/admin`
5. View pending payments in table
6. Click "Approve" or "Reject" with confirmation
7. Verify toast notifications appear
8. Check database for updated statuses and audit logs

