# 🚀 Deployment Guide - Vercel (Frontend) + Render (Backend)

## Overview
- **Frontend (Next.js)**: Deploy to Vercel
- **Backend (Express)**: Deploy to Render
- **Database**: Supabase (already set up)

---

## Part 1: Deploy Backend to Render

### Step 1: Prepare Backend for Deployment

1. **Create `render.yaml` (optional but recommended):**
   ```yaml
   services:
     - type: web
       name: listingads-backend
       env: node
       buildCommand: cd backend && npm install
       startCommand: cd backend && npm start
       envVars:
         - key: NODE_ENV
           value: production
         - key: PORT
           value: 5000
   ```

2. **Update `package.json` scripts:**
   Make sure backend has:
   ```json
   "scripts": {
     "start": "node src/server.js",
     "dev": "nodemon src/server.js"
   }
   ```

### Step 2: Deploy to Render

1. **Go to Render Dashboard:**
   - Visit: https://render.com
   - Sign up/Login with GitHub

2. **Create New Web Service:**
   - Click **"New +"** → **"Web Service"**
   - Connect your GitHub repository
   - Select the `ListingAds` repository

3. **Configure Service:**
   - **Name:** `listingads-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

4. **Add Environment Variables:**
   - Go to **Environment** tab
   - Click **"Add Environment Variable"**
   - Add each variable from `RENDER_ENV.txt`:
     ```
     PORT=5000
     NODE_ENV=production
     DB_HOST=db.ayptygxyzrcvjdhnsdrt.supabase.co
     DB_PORT=5432
     DB_NAME=postgres
     DB_USER=postgres
     DB_PASSWORD=your_actual_password
     JWT_SECRET=your_random_secret_key
     JWT_EXPIRES_IN=7d
     ADMIN_BANK_NAME=Your Bank Name
     ADMIN_ACCOUNT_NUMBER=1234567890
     ADMIN_ACCOUNT_TITLE=Your Account Title
     ```

5. **Deploy:**
   - Click **"Create Web Service"**
   - Wait for deployment (5-10 minutes)
   - Copy your service URL (e.g., `https://listingads-backend.onrender.com`)

### Step 3: Run Database Migrations

After backend is deployed, you need to run migrations:

**Option A: Via Render Shell (Recommended)**
1. Go to your Render service
2. Click **"Shell"** tab
3. Run:
   ```bash
   cd backend
   npm run migrate
   ```

**Option B: Run Locally (if you have .env set up)**
```bash
cd backend
npm run migrate
```

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Prepare Frontend

1. **Make sure `next.config.js` is correct:**
   ```js
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     reactStrictMode: true,
   }
   
   module.exports = nextConfig
   ```

2. **Create `.vercelignore` (optional):**
   ```
   backend/
   node_modules/
   .env.local
   ```

### Step 2: Deploy to Vercel

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com
   - Sign up/Login with GitHub

2. **Import Project:**
   - Click **"Add New..."** → **"Project"**
   - Import your GitHub repository
   - Select `ListingAds` repository

3. **Configure Project:**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)

4. **Add Environment Variables:**
   - Go to **Settings** → **Environment Variables**
   - Click **"Add New"**
   - Add:
     ```
     Name: NEXT_PUBLIC_API_URL
     Value: https://your-backend-url.onrender.com/api
     ```
   - Replace `your-backend-url.onrender.com` with your actual Render backend URL
   - Select all environments (Production, Preview, Development)

5. **Deploy:**
   - Click **"Deploy"**
   - Wait for deployment (2-5 minutes)
   - Your site will be live at: `https://your-project.vercel.app`

---

## Part 3: Final Steps

### 1. Update CORS in Backend (if needed)

If you get CORS errors, update `backend/src/server.js`:

```js
app.use(cors({
  origin: [
    'https://your-frontend.vercel.app',
    'http://localhost:3000' // for local development
  ],
  credentials: true
}));
```

### 2. Test Your Deployment

1. **Test Frontend:**
   - Visit your Vercel URL
   - Try registering a user
   - Try logging in

2. **Test Backend:**
   - Visit: `https://your-backend.onrender.com/api/health`
   - Should return: `{"status":"ok","database":"connected"}`

3. **Test Full Flow:**
   - Register user
   - Create ad
   - Submit payment
   - Login as admin
   - Approve payment

---

## Environment Variables Summary

### Vercel (Frontend)
```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

### Render (Backend)
```
PORT=5000
NODE_ENV=production
DB_HOST=db.ayptygxyzrcvjdhnsdrt.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
ADMIN_BANK_NAME=Your Bank Name
ADMIN_ACCOUNT_NUMBER=1234567890
ADMIN_ACCOUNT_TITLE=Your Account Title
```

---

## Troubleshooting

### Backend won't start on Render:
- Check environment variables are set correctly
- Check build logs for errors
- Make sure `package.json` has `"start": "node src/server.js"`

### Frontend can't connect to backend:
- Verify `NEXT_PUBLIC_API_URL` is correct in Vercel
- Check CORS settings in backend
- Verify backend is running (check Render logs)

### Database connection errors:
- Verify Supabase credentials in Render environment variables
- Check if Supabase project is active
- Test connection locally first

### 404 errors:
- Make sure root directory is set correctly (frontend for Vercel, backend for Render)
- Check build output in deployment logs

---

## Quick Commands

### Local Testing Before Deployment:
```bash
# Backend
cd backend
npm install
npm run migrate
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### After Deployment:
- Backend URL: `https://your-backend.onrender.com`
- Frontend URL: `https://your-project.vercel.app`
- Admin Login: `admin@listingads.com` / `admin123`

---

## Cost Estimate

- **Vercel:** Free tier (Hobby plan) - sufficient for most projects
- **Render:** Free tier available, but backend sleeps after 15 min inactivity
- **Supabase:** Free tier - 500MB database, 2GB bandwidth

For production, consider:
- Render paid plan ($7/month) - keeps backend always running
- Or use Railway, Fly.io, or DigitalOcean

---

## Next Steps After Deployment

1. ✅ Change default admin password
2. ✅ Update payment instructions in environment variables
3. ✅ Set up custom domain (optional)
4. ✅ Enable SSL/HTTPS (automatic on Vercel/Render)
5. ✅ Set up monitoring and error tracking
6. ✅ Configure backups for database

