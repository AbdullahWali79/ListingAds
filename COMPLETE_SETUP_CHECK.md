# Complete Setup Check - Sab Kuch Verify Karne Ke Liye

## 🔴 Current Issue: Database Connection

Database hostname resolve nahi ho raha. Pehle yeh fix karna hoga.

---

## ✅ Step 1: Database Setup (IMPORTANT)

### Option A: Supabase Database Verify Karein

1. **Supabase Dashboard Check Karein:**
   - https://supabase.com/dashboard par jayein
   - Apna project open karein
   - Settings → Database par jayein
   - **Connection string** ya **Host** verify karein

2. **Correct Hostname Update Karein:**
   - Agar hostname different hai, to `backend/.env` file mein update karein
   - Format: `db.xxxxx.supabase.co`

3. **Password Verify Karein:**
   - Supabase dashboard se database password verify karein
   - `backend/.env` file mein `DB_PASSWORD` update karein

### Option B: Local PostgreSQL Use Karein (Quick Fix)

1. **PostgreSQL Install Karein (agar nahi hai):**
   - Download: https://www.postgresql.org/download/windows/
   - Install karein aur password set karein

2. **Database Create Karein:**
   ```bash
   psql -U postgres
   CREATE DATABASE listingads;
   \q
   ```

3. **Backend .env Update Karein:**
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=listingads
   DB_USER=postgres
   DB_PASSWORD=your_local_postgres_password
   ```

---

## ✅ Step 2: Database Migration Run Karein

```bash
cd backend
npm run migrate
```

**Expected Output:**
```
Database migration completed successfully!
Default admin user created (email: admin@listingads.com, password: admin123)
Default categories created
```

---

## ✅ Step 3: Backend Server Verify Karein

```bash
cd backend
npm run dev
```

**Check:**
- Server `http://localhost:5000` par chal raha hai
- Health check: `curl http://localhost:5000/api/health`
- Expected: `{"status":"ok","database":"connected"}`

---

## ✅ Step 4: Frontend Server Verify Karein

```bash
cd frontend
npm run dev
```

**Check:**
- Server `http://localhost:3000` par chal raha hai
- `.env.local` file exists: `NEXT_PUBLIC_API_URL=http://localhost:5000/api`

---

## ✅ Step 5: Admin Panel Password Protection Test

1. **Direct Access Test:**
   - Browser: `http://localhost:3000/admin`
   - Expected: Redirect to `/login` (agar logged in nahi hai)

2. **Login Test:**
   - Email: `admin@listingads.com`
   - Password: `admin123`
   - Expected: Admin dashboard open ho jayega

3. **Unauthorized Access Test:**
   - Regular user se login karein
   - `/admin` par jane ki koshish karein
   - Expected: Redirect to home page with error message

---

## ✅ Step 6: User Registration/Signup Test

1. **Browser:** `http://localhost:3000/login`
2. **"Create Account" tab** select karein
3. **Form Fill Karein:**
   - Full Name: `Test User`
   - Email: `test@example.com` (unique email)
   - Password: `test123`
   - Account Type: `Buyer` ya `Seller`
4. **"Create Account"** click karein
5. **Expected:** 
   - Success message
   - Automatic login
   - Redirect to home page

---

## ✅ Step 7: Ads Creation Flow Test

1. **Seller Account Se Login Karein:**
   - Seller account create karein (signup se)
   - Login karein

2. **Seller Dashboard:**
   - `http://localhost:3000/seller` par jayein
   - "Create Ad" tab select karein

3. **Ad Create Karein:**
   - Title: `Test iPhone`
   - Description: `This is a test ad`
   - Price: `500`
   - Category: Select any category
   - Package: `Standard` (payment flow test ke liye)
   - Images: (optional)

4. **Expected:**
   - Ad created successfully
   - Redirect to payment page (agar Standard/Premium package)

---

## ✅ Step 8: Payment Submission Test

1. **Payment Form Fill Karein:**
   - Sender Name: `John Doe`
   - Bank/Service: `Easypaisa`
   - Transaction ID: `TXN123456`
   - Screenshot: (optional)

2. **"Submit Payment"** click karein

3. **Expected:**
   - Success message
   - Payment submitted
   - Status: `pending_verification`

---

## ✅ Step 9: Admin Approval Flow Test

1. **Admin Login Karein:**
   - Email: `admin@listingads.com`
   - Password: `admin123`

2. **Admin Dashboard:**
   - `http://localhost:3000/admin` par jayein
   - "Payments" tab select karein

3. **Pending Payments Check Karein:**
   - Submitted payment dikhna chahiye
   - Payment details verify karein

4. **Payment Approve Karein:**
   - "Approve" button click karein
   - Confirm modal mein confirm karein
   - Expected: Payment approved, ad status updated

5. **Ads Approval Test:**
   - "Ads" tab select karein
   - Pending ads dikhne chahiye
   - "Approve Ad" button se approve karein

---

## ✅ Step 10: Complete Flow Verification

### Checklist:

- [ ] Database migration successful
- [ ] Backend server running (port 5000)
- [ ] Frontend server running (port 3000)
- [ ] Admin panel password protected
- [ ] User registration working
- [ ] User login working
- [ ] Ads creation working
- [ ] Payment submission working
- [ ] Admin can see pending payments
- [ ] Admin can approve/reject payments
- [ ] Admin can approve/reject ads
- [ ] Toast notifications working
- [ ] Modals working correctly

---

## 🛠️ Troubleshooting

### Database Connection Error:
- Supabase hostname verify karein
- Password verify karein
- Internet connection check karein
- Ya local PostgreSQL use karein

### 404 Errors:
- Backend server running hai verify karein
- Frontend `.env.local` file check karein
- Frontend server restart karein

### Authentication Errors:
- Database migration run karein (admin user create hoga)
- Token verify karein
- Browser localStorage clear karein

---

## 📝 Quick Commands Reference

```bash
# Database migration
cd backend
npm run migrate

# Backend start
cd backend
npm run dev

# Frontend start
cd frontend
npm run dev

# Health check
curl http://localhost:5000/api/health
```

---

**Sab kuch setup hone ke baad, yeh complete flow test karein!**

