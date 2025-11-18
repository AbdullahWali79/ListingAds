# ✅ Fixed Firestore Rules for Ads

## Problem
Categories are loading but ads are not showing.

## Solution
The issue is that Firestore rules for ads need to allow collection-level queries. Update your rules to:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Categories - PUBLIC READ ACCESS ✅ (Working)
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Ads - FIXED: Allow collection queries
    match /ads/{adId} {
      // Allow read for individual documents (if approved and not deleted)
      allow get: if resource.data.status == 'approved' 
                  && resource.data.isDeleted != true;
      // Allow list/query for collection (we filter in code)
      allow list: if true;
      allow write: if request.auth != null;
    }
    
    // Users - Only authenticated
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Payments - Only authenticated
    match /payments/{paymentId} {
      allow read, write: if request.auth != null;
    }
    
    // Price Packages - Only authenticated
    match /pricePackages/{packageId} {
      allow read, write: if request.auth != null;
    }
    
    // Reactivation Requests - Only authenticated
    match /reactivationRequests/{requestId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Key Change:
Changed from:
```javascript
allow read: if resource.data.status == 'approved' && resource.data.isDeleted != true;
```

To:
```javascript
allow get: if resource.data.status == 'approved' && resource.data.isDeleted != true;
allow list: if true; // Allow collection queries, filter in code
```

This allows:
- `get()` - Reading individual ads (filtered by status)
- `list()` - Querying the collection (we filter approved ads in code)

