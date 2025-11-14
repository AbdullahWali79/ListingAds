# Supabase Connection Details Kaise Lein

## 📋 Steps:

### 1. Supabase Dashboard Mein Jao:
- https://supabase.com/dashboard
- Apna `listingads` project select karo

### 2. Settings → Database:
- Left sidebar mein **Settings** (gear icon) click karo
- **Database** option select karo

### 3. Connection Details Copy Karo:
Scroll down to **Connection string** section. Yahan aapko milenge:

**Option A: Connection String (Direct Copy)**
- **Connection string** section mein "URI" ya "Connection pooling" select karo
- Copy karo: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

**Option B: Manual Details (Recommended)**
- **Host:** `db.xtkcqdybkwindpyglseq.supabase.co` (apne project ID ke saath)
- **Port:** `5432`
- **Database:** `postgres`
- **User:** `postgres`
- **Password:** (jo aapne project create karte waqt set kiya tha)

### 4. Password Agar Yaad Nahi Hai:
- Settings → Database → **Reset database password**
- Naya password set karo (save karo!)

---

## ✅ Ab Backend .env Update Karo:

`backend/.env` file mein yeh values update karo:

```env
# Server
PORT=5000
NODE_ENV=development

# Database - Supabase
DB_HOST=db.xtkcqdybkwindpyglseq.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=YOUR_SUPABASE_PASSWORD_HERE

# JWT
JWT_SECRET=listingads_super_secret_jwt_key_2024_change_in_production_use_random_string
JWT_EXPIRES_IN=7d

# Admin Payment Instructions
ADMIN_BANK_NAME=Your Bank Name
ADMIN_ACCOUNT_NUMBER=1234567890
ADMIN_ACCOUNT_TITLE=Your Account Title
```

**Important:** 
- `DB_HOST` mein apna actual hostname dalo (project ID ke saath)
- `DB_PASSWORD` mein apna Supabase database password dalo

---

## 🧪 Test Karo:

1. **Backend start karo:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Health check:**
   - Browser: http://localhost:5000/api/health
   - Expected: `{"status":"ok","database":"connected"}`

3. **Admin login test:**
   - Browser: http://localhost:3000/login
   - Email: `admin@listingads.com`
   - Password: `admin123`

