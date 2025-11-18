# Admin Role Set Karne Ka Guide

## ✅ Step 1: User UID Find Karein

1. Firebase Console → Authentication → Users
2. `muhammadabdullah@cuivehari.edu.pk` user ko find karein
3. User UID copy karein (yeh long string hai, e.g., `bzf8JdCXNnTwa3QG6HcSuM...`)

## ✅ Step 2: Firestore Database Mein User Document Create Karein

1. Firebase Console → **Firestore Database** open karein
2. **users** collection select karein (agar nahi hai to create karein)
3. **Add document** button click karein
4. **Document ID** mein user ka UID paste karein (jo Step 1 mein copy kiya)
5. **Fields** add karein:

   | Field | Type | Value |
   |-------|------|-------|
   | `name` | string | `Muhammad Abdullah` (ya jo bhi name chahiye) |
   | `email` | string | `muhammadabdullah@cuivehari.edu.pk` |
   | `role` | string | `admin` ⚠️ **Important: exactly "admin"** |
   | `status` | string | `approved` |
   | `createdAt` | timestamp | Current timestamp |
   | `updatedAt` | timestamp | Current timestamp |

6. **Save** button click karein

## ✅ Step 3: Verify Karein

1. Firestore Database → users collection
2. Apne user ka document open karein
3. Check karein:
   - `role` = `admin` ✅
   - `status` = `approved` ✅
   - `email` = `muhammadabdullah@cuivehari.edu.pk` ✅

## 🎯 Quick Method (Firestore Console Se)

### Option 1: Manual Entry

1. Firestore Database → users collection
2. Add document → Document ID = User UID
3. Fields add karein:
   ```
   name: "Muhammad Abdullah"
   email: "muhammadabdullah@cuivehari.edu.pk"
   role: "admin"
   status: "approved"
   createdAt: [timestamp - auto]
   updatedAt: [timestamp - auto]
   ```

### Option 2: JSON Import (Agar Available Hai)

```json
{
  "name": "Muhammad Abdullah",
  "email": "muhammadabdullah@cuivehari.edu.pk",
  "role": "admin",
  "status": "approved",
  "createdAt": "2025-11-17T00:00:00Z",
  "updatedAt": "2025-11-17T00:00:00Z"
}
```

## ⚠️ Important Points

1. **Document ID** exactly user ka UID hona chahiye (Authentication se copy kiya hua)
2. **role** field exactly `"admin"` hona chahiye (case-sensitive)
3. **status** field `"approved"` hona chahiye
4. Agar document pehle se exist karta hai, to sirf `role` aur `status` update karein

## 🔍 Verification Checklist

- [ ] User Firebase Authentication mein exist karta hai
- [ ] User UID copy kiya
- [ ] Firestore 'users' collection mein document create kiya
- [ ] Document ID = User UID
- [ ] `role: "admin"` set kiya
- [ ] `status: "approved"` set kiya
- [ ] Login test kiya

## 🧪 Test Karein

1. Browser mein `/admin/login` page open karein
2. Email: `muhammadabdullah@cuivehari.edu.pk`
3. Password: Firebase Authentication mein jo password set kiya hai
4. Login button click karein
5. Admin dashboard access hona chahiye

---

**Note:** Agar document pehle se exist karta hai, to existing document mein sirf `role` field update karein `"admin"` se.

