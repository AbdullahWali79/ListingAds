# Database Setup Guide

## 🔴 Current Issue: Database Connection Failed

Error: `ECONNREFUSED` - Database server connect nahi ho raha

---

## ✅ Solution Options:

### Option 1: Supabase Use Karein (Recommended - Cloud Database)

**Steps:**

1. **Supabase Account Banayein:**
   - https://supabase.com par jayein
   - Free account create karein

2. **New Project Create Karein:**
   - Dashboard mein "New Project" click karein
   - Project name: `listingads`
   - Database password set karein (save karein!)
   - Region select karein
   - "Create new project" click karein

3. **Database Connection Details Lein:**
   - Project settings → Database
   - Connection string copy karein ya manually note karein:
     - **Host:** `db.xxxxx.supabase.co`
     - **Port:** `5432`
     - **Database:** `postgres`
     - **User:** `postgres`
     - **Password:** (jo aapne set kiya)

4. **Backend .env File Update Karein:**
   
   `backend/.env` file mein yeh update karein:
   
   ```env
   PORT=5000
   NODE_ENV=development
   
   # Supabase Database
   DB_HOST=db.xxxxx.supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=your_supabase_password_here
   
   # JWT
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
   JWT_EXPIRES_IN=7d
   
   # Admin Payment Instructions
   ADMIN_BANK_NAME=Your Bank Name
   ADMIN_ACCOUNT_NUMBER=1234567890
   ADMIN_ACCOUNT_TITLE=Your Account Title
   ```

5. **Migration Run Karein:**
   ```bash
   cd backend
   npm run migrate
   ```

---

### Option 2: Local PostgreSQL Use Karein

**Steps:**

1. **PostgreSQL Install Karein (agar nahi hai):**
   - Download: https://www.postgresql.org/download/windows/
   - Install karein
   - Password set karein (save karein!)

2. **PostgreSQL Service Start Karein:**
   - Windows Services (services.msc) mein jayein
   - "postgresql-x64-XX" service start karein
   - Ya command prompt mein:
     ```bash
     net start postgresql-x64-14
     ```
     (Version number different ho sakta hai)

3. **Database Create Karein:**
   ```bash
   # PostgreSQL command line tool open karein
   psql -U postgres
   
   # Password enter karein
   # Phir database create karein:
   CREATE DATABASE listingads;
   \q
   ```

4. **Backend .env File Update Karein:**
   
   `backend/.env` file mein yeh update karein:
   
   ```env
   PORT=5000
   NODE_ENV=development
   
   # Local PostgreSQL
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=listingads
   DB_USER=postgres
   DB_PASSWORD=your_local_postgres_password
   
   # JWT
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
   JWT_EXPIRES_IN=7d
   
   # Admin Payment Instructions
   ADMIN_BANK_NAME=Your Bank Name
   ADMIN_ACCOUNT_NUMBER=1234567890
   ADMIN_ACCOUNT_TITLE=Your Account Title
   ```

5. **Migration Run Karein:**
   ```bash
   cd backend
   npm run migrate
   ```

---

## ✅ Migration Success Ke Baad:

1. **Backend Server Restart Karein:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Health Check Karein:**
   ```bash
   curl http://localhost:5000/api/health
   ```
   
   Expected response:
   ```json
   {"status":"ok","database":"connected"}
   ```

3. **Registration Test Karein:**
   - Browser: `http://localhost:3000/login`
   - "Create Account" tab
   - Form fill karein aur test karein

4. **Admin Login Karein:**
   - Email: `admin@listingads.com`
   - Password: `admin123`

---

## 🛠️ Troubleshooting

### PostgreSQL Service Not Running:
```bash
# Check service status
Get-Service postgresql*

# Start service
Start-Service postgresql-x64-14
```

### Connection Still Failing:
- Database credentials double-check karein
- Firewall settings check karein
- Supabase project active hai verify karein

### Migration Errors:
- Database credentials sahi hain verify karein
- Database server accessible hai check karein
- Error logs carefully read karein

---

## 📝 Quick Checklist

- [ ] Database server running hai (PostgreSQL ya Supabase)
- [ ] `.env` file mein correct credentials hain
- [ ] Migration successfully complete hui
- [ ] Backend server restart ho gaya
- [ ] Health check successful hai

---

**Recommendation:** Supabase use karein - setup easy hai aur cloud par hai!

