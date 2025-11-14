# Database Password Kaise Lein - Quick Guide

## ⚠️ Important:
- **API Key** ≠ **Database Password**
- API key: REST API ke liye (jo aapne diya)
- Database Password: PostgreSQL connection ke liye (chahiye)

## 📋 Steps to Get Database Password:

### Option 1: Connection String Se (Easiest)

1. **Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Apna `listingads` project select karo

2. **Settings → Database:**
   - Left sidebar: **Settings** (gear icon)
   - **Database** click karo

3. **Connection String:**
   - Scroll down to **"Connection string"** section
   - **"URI"** tab select karo
   - Copy the connection string:
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.xtkcqdybkwlndpyglseq.supabase.co:5432/postgres
     ```
   - `[YOUR-PASSWORD]` wala part hi database password hai!

### Option 2: Reset Password (Agar Yaad Nahi Hai)

1. **Settings → Database:**
   - Scroll down to **"Database password"** section
   - **"Reset database password"** button click karo
   - Naya password set karo (save karo!)
   - Example: `MySecurePass123!@#`

---

## ✅ Ab Backend .env Update Karo:

`backend/.env` file mein yeh update karo:

```env
# Server
PORT=5000
NODE_ENV=development

# Database - Supabase
DB_HOST=db.xtkcqdybkwlndpyglseq.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=YOUR_ACTUAL_DATABASE_PASSWORD_HERE  # ← Yahan password dalo!

# JWT
JWT_SECRET=listingads_super_secret_jwt_key_2024_change_in_production_use_random_string
JWT_EXPIRES_IN=7d

# Admin Payment Instructions
ADMIN_BANK_NAME=Your Bank Name
ADMIN_ACCOUNT_NUMBER=1234567890
ADMIN_ACCOUNT_TITLE=Your Account Title
```

**Important:** 
- `DB_PASSWORD` mein connection string se password copy karo
- Ya reset karke naya password set karo

---

## 🧪 Test:

1. Password add karne ke baad backend restart karo
2. Health check: http://localhost:5000/api/health
3. Expected: `{"status":"ok","database":"connected"}`

