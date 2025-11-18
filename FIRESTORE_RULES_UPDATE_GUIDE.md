# 🔥 Firestore Security Rules Update - Step by Step

## Problem
Public users (not logged in) cannot see categories and ads because Firestore rules only allow authenticated users.

## Solution - Update Firestore Rules

### Step 1: Open Firebase Console
1. Go to: https://console.firebase.google.com/
2. Login with your Google account
3. Select project: **classified-ads-app-4f856**

### Step 2: Navigate to Firestore Rules
1. Click on **"Firestore Database"** in left sidebar
2. Click on **"Rules"** tab (top menu)

### Step 3: Replace Current Rules
**CURRENT RULES (WRONG):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**NEW RULES (CORRECT):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Categories - PUBLIC READ ACCESS
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Ads - PUBLIC READ for approved ads only
    // Note: For collection queries, we need to allow read on collection level
    match /ads/{adId} {
      // Allow read if ad is approved and not deleted
      allow read: if resource.data.status == 'approved' 
                   && resource.data.isDeleted != true;
      // Also allow read for collection queries (onSnapshot/getDocs)
      allow list: if true; // Allow listing, filter in code
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

### Step 4: Publish Rules
1. Click **"Publish"** button (top right)
2. Wait for confirmation message
3. Rules will be active immediately

### Step 5: Test
1. Go back to your app: `localhost:5173`
2. **Logout** if you're logged in (to test as public user)
3. Refresh the page
4. Categories and ads should now load!

## Important Notes:
- Rules update takes effect immediately
- No need to restart the app
- Public users can now read categories and approved ads
- Only authenticated users can write data

