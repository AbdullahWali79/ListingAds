# Admin Account Setup Guide

## 🔐 Admin Login Password Kya Hai?

**Important:** Admin password code mein stored nahi hai. Yeh Firebase Authentication mein stored hota hai.

## 📝 Admin Account Kaise Create Karein?

### Step 1: Firebase Console Mein Admin Account Create Karein

1. **Firebase Console** open karein: https://console.firebase.google.com/
2. Apna project select karein: `classified-ads-app-4f856`
3. Left sidebar se **Authentication** click karein
4. **Users** tab par jayein
5. **Add user** button click karein
6. Form fill karein:
   - **Email**: `admin@admin.com` (ya koi aur admin email)
   - **Password**: Apna strong password enter karein (e.g., `Admin@123`)
7. **Add user** click karein

### Step 2: Firestore Mein Admin Role Set Karein

1. Firebase Console mein **Firestore Database** open karein
2. **users** collection select karein
3. Agar user document nahi hai, to create karein:
   - **Document ID**: Firebase Authentication se user ka UID copy karein
   - **Fields** add karein:
     ```
     name: "Admin User"
     email: "admin@admin.com"
     role: "admin"
     status: "approved"
     createdAt: [timestamp]
     updatedAt: [timestamp]
     ```
4. **Save** karein

### Step 3: Admin Login Test Karein

1. Browser mein `/admin/login` page open karein
2. Email aur password enter karein
3. Login button click karein

## 🔑 Default Admin Credentials (Agar Create Kiye Hain)

Agar aapne pehle se admin account create kiya hai, to:

**Option 1: Firebase Console Se Check Karein**
- Firebase Console → Authentication → Users
- Admin email click karein
- Password reset kar sakte hain (but existing password nahi dikhega)

**Option 2: New Admin Account Create Karein**
- Naya admin account create karein with new email/password

## 🛠️ Admin Account Create Karne Ka Quick Method

### Method 1: Firebase Console Se (Recommended)

1. Firebase Console → Authentication → Users
2. Add user → Email/Password
3. Email: `admin@admin.com`
4. Password: `Admin@123` (ya koi strong password)
5. Add user

### Method 2: Code Se (Development Only)

Agar aap development environment mein hain, to ek script bana sakte hain jo automatically admin account create kare:

```typescript
// scripts/createAdmin.ts (temporary script)
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../src/firebase'

const createAdmin = async () => {
  try {
    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      'admin@admin.com',
      'Admin@123' // Change this password
    )
    
    // Create Firestore document
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      name: 'Admin User',
      email: 'admin@admin.com',
      role: 'admin',
      status: 'approved',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    
    console.log('Admin account created successfully!')
  } catch (error) {
    console.error('Error creating admin:', error)
  }
}

createAdmin()
```

## ⚠️ Important Notes

1. **Password Security**: Strong password use karein (minimum 8 characters, uppercase, lowercase, numbers, symbols)
2. **Role Check**: Firestore 'users' collection mein `role: 'admin'` set hona chahiye
3. **Status**: `status: 'approved'` hona chahiye
4. **Production**: Production mein admin accounts manually create karein, code mein hardcode na karein

## 🔍 Troubleshooting

### Problem: "Invalid email or password" error

**Solutions:**
1. Firebase Console → Authentication → Users mein check karein ke account exist karta hai
2. Password sahi hai ya nahi verify karein
3. Firestore 'users' collection mein role: 'admin' set hai ya nahi check karein

### Problem: Login ho raha hai but admin panel access nahi mil raha

**Solutions:**
1. Firestore 'users' collection mein user document check karein
2. `role` field `'admin'` set hai ya nahi verify karein
3. Browser console mein errors check karein

### Problem: Password bhool gaye

**Solutions:**
1. Firebase Console → Authentication → Users
2. Admin user select karein
3. **Reset password** option use karein
4. Email par reset link aayega

## 📋 Quick Checklist

- [ ] Firebase Authentication mein admin account create kiya
- [ ] Firestore 'users' collection mein user document create kiya
- [ ] `role: 'admin'` set kiya
- [ ] `status: 'approved'` set kiya
- [ ] Login test kiya

## 🎯 Example Admin Account Structure

**Firebase Authentication:**
```
Email: admin@admin.com
Password: Admin@123 (ya aapka password)
```

**Firestore Document (users/{userId}):**
```json
{
  "name": "Admin User",
  "email": "admin@admin.com",
  "role": "admin",
  "status": "approved",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

**Note:** Agar aapko admin password nahi pata, to Firebase Console se naya admin account create karein ya existing account ka password reset karein.

