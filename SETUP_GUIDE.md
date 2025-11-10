# Step-by-Step Setup Guide

## 🎯 Overview
This guide will walk you through setting up the ListingAds platform from scratch.

---

## Step 1: Database Setup

You have two options: **Supabase** (cloud) or **Local PostgreSQL**

### Option A: Using Supabase (Recommended - You have it open!)

1. **Create a new Supabase project:**
   - Click the green **"+ New project"** button in your Supabase dashboard
   - Fill in:
     - **Name:** `listingads` (or any name you prefer)
     - **Database Password:** Create a strong password (save it!)
     - **Region:** Choose closest to you
   - Click **"Create new project"**
   - Wait 2-3 minutes for setup

2. **Get your database connection details:**
   - Once created, go to **Settings** → **Database**
   - Find **Connection string** section
   - Copy the **URI** connection string (looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`)
   - Or note these details separately:
     - **Host:** `db.xxx.supabase.co`
     - **Port:** `5432`
     - **Database:** `postgres`
     - **User:** `postgres`
     - **Password:** (the one you created)

3. **Run the SQL schema:**
   - Go to **SQL Editor** in Supabase dashboard
   - Click **"New query"**
   - Open `backend/src/db/schema.sql` from your project
   - Copy the entire contents
   - Paste into Supabase SQL Editor
   - Click **"Run"** (or press Ctrl+Enter)
   - You should see "Success. No rows returned"

4. **Create default admin user:**
   - In SQL Editor, run this (replace `admin123` with your desired password):
   ```sql
   -- First, hash the password (you'll need to do this from backend)
   -- Or use this temporary query to set admin password
   INSERT INTO users (name, email, password, role) 
   VALUES ('Admin', 'admin@listingads.com', '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', 'admin')
   ON CONFLICT (email) DO NOTHING;
   ```
   - **Note:** The password hash above is for `admin123`. We'll set it properly in Step 3.

### Option B: Using Local PostgreSQL

1. **Install PostgreSQL** (if not installed):
   - Download from: https://www.postgresql.org/download/
   - Install with default settings
   - Remember your postgres user password

2. **Create database:**
   ```bash
   # Open terminal/command prompt
   psql -U postgres
   # Enter your password when prompted
   CREATE DATABASE listingads;
   \q
   ```

3. **Run migrations:**
   - We'll do this in Step 3

---

## Step 2: Backend Setup

1. **Open terminal in your project root:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   Wait for installation to complete (may take 1-2 minutes)

3. **Create environment file:**
   ```bash
   # Windows PowerShell
   Copy-Item env.example .env
   
   # Or manually create .env file
   ```

4. **Edit `.env` file** with your database credentials:

   **For Supabase:**
   ```env
   PORT=5000
   NODE_ENV=development
   
   # Supabase Database Connection
   DB_HOST=db.xxx.supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=your_supabase_password_here
   
   # JWT Secret (generate a random string)
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
   JWT_EXPIRES_IN=7d
   
   # Admin Payment Instructions
   ADMIN_BANK_NAME=Your Bank Name
   ADMIN_ACCOUNT_NUMBER=1234567890
   ADMIN_ACCOUNT_TITLE=Your Account Title
   ```

   **For Local PostgreSQL:**
   ```env
   PORT=5000
   NODE_ENV=development
   
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=listingads
   DB_USER=postgres
   DB_PASSWORD=your_local_postgres_password
   
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345
   JWT_EXPIRES_IN=7d
   
   ADMIN_BANK_NAME=Your Bank Name
   ADMIN_ACCOUNT_NUMBER=1234567890
   ADMIN_ACCOUNT_TITLE=Your Account Title
   ```

5. **Run database migrations:**
   ```bash
   npm run migrate
   ```
   
   This will:
   - Create all tables
   - Create default admin user (email: `admin@listingads.com`, password: `admin123`)
   - Create default categories
   
   You should see:
   ```
   Database migration completed successfully!
   Default admin user created (email: admin@listingads.com, password: admin123)
   Default categories created
   ```

6. **Start the backend server:**
   ```bash
   npm run dev
   ```
   
   You should see:
   ```
   Server running on port 5000
   ```
   
   ✅ **Backend is now running!** Keep this terminal open.

---

## Step 3: Frontend Setup

1. **Open a NEW terminal window** (keep backend running)

2. **Navigate to frontend:**
   ```bash
   cd frontend
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```
   Wait for installation (may take 2-3 minutes)

4. **Create environment file:**
   ```bash
   # Windows PowerShell
   Copy-Item env.example .env.local
   
   # Or manually create .env.local file
   ```

5. **Edit `.env.local` file:**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

6. **Start the frontend:**
   ```bash
   npm run dev
   ```
   
   You should see:
   ```
   ▲ Next.js 14.0.4
   - Local:        http://localhost:3000
   ```
   
   ✅ **Frontend is now running!**

---

## Step 4: Test the Application

1. **Open your browser:**
   - Go to: `http://localhost:3000`

2. **Register a test user:**
   - Click **"Register"**
   - Fill in:
     - Name: `Test User`
     - Email: `test@example.com`
     - Password: `test123`
   - Click **"Register"**
   - You should be logged in automatically

3. **Login as Admin:**
   - Click **"Logout"** (if logged in)
   - Click **"Login"**
   - Email: `admin@listingads.com`
   - Password: `admin123`
   - Click **"Login"**

4. **Test Admin Dashboard:**
   - You should see **"Admin"** link in navbar
   - Click it to go to `/admin`
   - You should see the admin dashboard with tabs

5. **Create a test ad (as regular user):**
   - Logout from admin
   - Register/login as regular user
   - Go to **"Seller Dashboard"**
   - Click **"Create Ad"** tab
   - Fill in:
     - Title: `Test iPhone`
     - Description: `This is a test ad`
     - Price: `500`
     - Category: Select any category
     - Package: `Standard` (to test payment flow)
   - Click **"Create Ad"**
   - You should be redirected to payment page

6. **Test Payment Submission:**
   - Fill in payment form:
     - Sender Name: `John Doe`
     - Bank/Service: `Easypaisa`
     - Transaction ID: `TXN123456`
   - Click **"Submit Payment"**
   - You should see success message

7. **Verify Payment as Admin:**
   - Login as admin again
   - Go to **Admin Dashboard**
   - Click **"Pending Payments"** tab
   - You should see your test payment in the table
   - Click **"Approve"** button
   - Confirm in modal
   - You should see toast notification
   - Payment should disappear from pending list

---

## Step 5: Verify Everything Works

✅ **Checklist:**

- [ ] Backend server running on port 5000
- [ ] Frontend running on port 3000
- [ ] Can register new user
- [ ] Can login as admin
- [ ] Can create ad
- [ ] Can submit payment
- [ ] Admin can see pending payments
- [ ] Admin can approve/reject payments
- [ ] Toast notifications appear
- [ ] Modals work correctly

---

## Troubleshooting

### Backend won't start:
- Check if port 5000 is already in use
- Verify `.env` file exists and has correct values
- Check database connection details

### Database connection error:
- Verify database credentials in `.env`
- For Supabase: Check if project is active
- For local: Make sure PostgreSQL service is running

### Frontend won't start:
- Make sure Node.js 18+ is installed
- Try deleting `node_modules` and running `npm install` again
- Check if port 3000 is available

### Can't login as admin:
- Run `npm run migrate` again in backend folder
- Check database for admin user:
  ```sql
  SELECT * FROM users WHERE email = 'admin@listingads.com';
  ```

### API errors:
- Make sure backend is running
- Check browser console for errors
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`

---

## Next Steps

Once everything is working:

1. **Change default admin password:**
   - Login as admin
   - (You may want to add a change password feature)

2. **Update payment instructions:**
   - Edit `ADMIN_BANK_NAME`, `ADMIN_ACCOUNT_NUMBER`, `ADMIN_ACCOUNT_TITLE` in backend `.env`

3. **Customize categories:**
   - Login as admin
   - Use admin panel to manage categories (when implemented)

4. **Deploy to production:**
   - Backend: Deploy to Render/Railway
   - Frontend: Deploy to Vercel
   - Database: Use Supabase production database

---

## Quick Commands Reference

```bash
# Backend
cd backend
npm install
npm run migrate    # Run once to setup database
npm run dev        # Start development server

# Frontend
cd frontend
npm install
npm run dev        # Start development server
```

---

## Need Help?

- Check the main `README.md` for more details
- Review `ADMIN_PAYMENT_VERIFICATION.md` for admin features
- Check browser console and terminal for error messages

