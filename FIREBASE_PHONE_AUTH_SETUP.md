# 📱 Firebase Phone Authentication Setup Guide

## Error: `auth/operation-not-allowed`

Yeh error tab aata hai jab Firebase Console mein **Phone Authentication enable nahi hai**.

---

## Step 1: Firebase Console Mein Jayein

1. https://console.firebase.google.com/ par jayein
2. Apna project select karein: `classified-ads-app-4f856`

---

## Step 2: Authentication Enable Karein

1. Left sidebar mein **"Authentication"** click karein
2. Agar pehli baar hai, to **"Get started"** button click karein

---

## Step 3: Phone Authentication Enable Karein

1. **"Sign-in method"** tab par jayein (top menu)
2. **"Phone"** provider ko dhundhein
3. **"Phone"** par click karein
4. **"Enable"** toggle ko **ON** karein
5. **"Save"** button click karein

---

## Step 4: Test Phone Numbers (Optional - Development Ke Liye)

Agar development/testing ke liye test phone numbers chahiye:

1. Phone provider settings mein **"Phone numbers for testing"** section mein jayein
2. **"Add phone number"** click karein
3. Phone number add karein (e.g., `+923001234567`)
4. Test OTP code add karein (e.g., `123456`)
5. **"Save"** click karein

**Note:** Test phone numbers sirf development ke liye hain. Production mein real SMS bhejne ke liye Firebase quota use hoga.

---

## Step 5: Authorized Domains Check Karein

1. **Authentication** → **Settings** → **Authorized domains**
2. Ensure karein ke yeh domains add hain:
   - `localhost` (development ke liye)
   - `your-project-name.vercel.app` (Vercel deployment ke liye)
   - Agar custom domain hai, wo bhi add karein

---

## Step 6: ReCAPTCHA Setup

Firebase automatically reCAPTCHA setup karta hai, lekin agar issues aayein:

1. **Authentication** → **Settings** → **reCAPTCHA**
2. Ensure karein ke reCAPTCHA v3 enabled hai

---

## Step 7: App Test Karein

1. Browser refresh karein
2. Registration form mein phone number enter karein
3. **"Send OTP"** button click karein
4. Ab OTP send hona chahiye! ✅

---

## Common Issues & Solutions

### Issue 1: Still Getting `auth/operation-not-allowed`
**Solution:**
- Firebase Console refresh karein
- Browser cache clear karein
- Hard refresh: `Ctrl + Shift + R` (Windows) ya `Cmd + Shift + R` (Mac)

### Issue 2: OTP Send Nahi Ho Raha
**Solution:**
- Phone number format check karein: `+923001234567` (with country code)
- Firebase Console mein Phone Authentication properly enable hai ya nahi verify karein
- Browser console mein errors check karein (F12)

### Issue 3: reCAPTCHA Issues
**Solution:**
- Domain authorized hai ya nahi check karein
- Browser extensions disable karein (ad blockers, etc.)
- Incognito mode mein test karein

### Issue 4: SMS Quota Exceeded
**Solution:**
- Firebase Console → Usage → Check SMS quota
- Agar free tier use kar rahe hain, to daily limit check karein
- Test phone numbers use karein development ke liye

---

## Firebase Phone Auth Pricing

- **Free Tier:** Limited SMS per month (check Firebase Console)
- **Paid Tier:** Pay-as-you-go pricing

**Tip:** Development ke liye test phone numbers use karein to save quota.

---

## Quick Checklist

- [ ] Firebase Console mein project open kiya
- [ ] Authentication → Sign-in method → Phone → Enable kiya
- [ ] Authorized domains check kiye
- [ ] Browser refresh kiya
- [ ] Phone number enter karke test kiya

---

## Screenshots Guide (Visual Reference)

### Step 1: Authentication Tab
```
Firebase Console
├── Project Overview
├── Authentication ← Yahan click karein
├── Firestore Database
└── ...
```

### Step 2: Sign-in Method
```
Authentication
├── Users
├── Sign-in method ← Yahan click karein
└── Settings
```

### Step 3: Enable Phone
```
Sign-in providers:
├── Email/Password
├── Phone ← Yahan click karein aur Enable karein
├── Google
└── ...
```

---

**Need More Help?**
- Firebase Docs: https://firebase.google.com/docs/auth/web/phone-auth
- Firebase Support: https://firebase.google.com/support

**Good Luck! 🚀**

