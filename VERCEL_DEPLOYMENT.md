# 🚀 Vercel Deployment Guide - Complete Setup

## Overview
Yeh guide aapko Vercel par complete project deploy karne me help karega.

---

## Step 1: Project Structure Setup

Project structure ab ready hai:
```
ListingAds/
├── api/
│   └── index.js          # Vercel serverless function
├── backend/              # Backend code (shared)
├── frontend/             # Next.js frontend
├── vercel.json           # Vercel configuration
└── package.json          # Root package.json
```

---

## Step 2: Install Dependencies

### Root Level:
```bash
npm install
```

### Backend:
```bash
cd backend
npm install
```

### Frontend:
```bash
cd frontend
npm install
```

---

## Step 3: Environment Variables Setup

### Vercel Dashboard me Environment Variables add karein:

1. **Vercel Dashboard** me jao: https://vercel.com
2. Apna project select karo
3. **Settings** → **Environment Variables**
4. Ye variables add karo:

#### Database Variables:
```
DB_HOST=db.ayptygxyzrcvjdhnsdrt.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_supabase_password_here
```

#### JWT Variables:
```
JWT_SECRET=your_super_secret_jwt_key_use_random_string_here
JWT_EXPIRES_IN=7d
```

#### Payment Instructions:
```
ADMIN_BANK_NAME=Your Bank Name
ADMIN_ACCOUNT_NUMBER=1234567890
ADMIN_ACCOUNT_TITLE=Your Account Title
```

#### Frontend URL (optional):
```
FRONTEND_URL=https://your-project.vercel.app
NEXT_PUBLIC_API_URL=/api
```

**Important:** 
- `NEXT_PUBLIC_API_URL` ko `/api` set karo (same domain par hai)
- Sabhi environments me add karo (Production, Preview, Development)

---

## Step 4: Database Setup

### Supabase me Schema Run karein:

1. **Supabase Dashboard** me jao
2. **SQL Editor** → **New query**
3. `backend/src/db/schema.sql` file open karo
4. Saara SQL code copy karo
5. Supabase SQL Editor me paste karo
6. **Run** button click karo

### Default Data Create karein:

Migration run karne ke liye, local me run karo:
```bash
cd backend
npm run migrate
```

Ya phir Supabase SQL Editor me manually run karo:
```sql
-- Create admin user (password: admin123)
INSERT INTO users (name, email, password, role) 
VALUES ('Admin', 'admin@listingads.com', '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Create default categories
INSERT INTO categories (name, slug) VALUES
('Electronics', 'electronics'),
('Vehicles', 'vehicles'),
('Real Estate', 'real-estate'),
('Jobs', 'jobs'),
('Services', 'services'),
('Fashion', 'fashion'),
('Home & Garden', 'home-garden'),
('Other', 'other')
ON CONFLICT (slug) DO NOTHING;
```

---

## Step 5: Vercel Deployment

### Method 1: Vercel Dashboard (Recommended)

1. **Vercel Dashboard** me jao: https://vercel.com
2. **Add New Project** click karo
3. GitHub repository connect karo
4. **Import Project**:
   - Repository select karo: `ListingAds`
   - **Framework Preset:** Next.js (auto-detect)
   - **Root Directory:** `.` (root)
   - **Build Command:** `cd frontend && npm run build`
   - **Output Directory:** `frontend/.next`
   - **Install Command:** `npm install && cd backend && npm install && cd ../frontend && npm install`

5. **Environment Variables** add karo (Step 3 se)

6. **Deploy** click karo

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Production deploy
vercel --prod
```

---

## Step 6: Post-Deployment

### 1. Database Migrations Run karein

Agar migrations nahi chali, to Vercel Functions me run karo:

**Option A: Vercel Function banao (temporary)**

Create `api/migrate.js`:
```js
import { pool } from '../backend/src/db/connection.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Add secret key check for security
  if (req.headers.authorization !== `Bearer ${process.env.MIGRATE_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const schema = readFileSync(join(__dirname, '../backend/src/db/schema.sql'), 'utf8');
    await pool.query(schema);
    
    // Create admin user
    const bcrypt = await import('bcryptjs');
    const adminPassword = await bcrypt.default.hash('admin123', 10);
    await pool.query(
      `INSERT INTO users (name, email, password, role) 
       VALUES ('Admin', 'admin@listingads.com', $1, 'admin')
       ON CONFLICT (email) DO NOTHING`,
      [adminPassword]
    );
    
    res.json({ message: 'Migration completed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

Phir call karo:
```bash
curl -X POST https://your-project.vercel.app/api/migrate \
  -H "Authorization: Bearer YOUR_MIGRATE_SECRET"
```

**Option B: Local se run karo (easier)**
```bash
# .env file me Supabase credentials add karo
cd backend
npm run migrate
```

---

## Step 7: Testing

### 1. Health Check:
```
https://your-project.vercel.app/api/health
```
Should return: `{"status":"ok","database":"connected"}`

### 2. Frontend Test:
- Visit: `https://your-project.vercel.app`
- Register new user
- Login as admin: `admin@listingads.com` / `admin123`

### 3. Full Flow Test:
- Create ad
- Submit payment
- Admin approve payment

---

## Important Configuration Files

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "api/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/$1"
    }
  ]
}
```

### Frontend API Configuration
`frontend/src/lib/api.ts` me:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
```

---

## Troubleshooting

### Error: "Cannot find module"
- Make sure sab dependencies install ho chuki hain
- Check `package.json` files

### Database Connection Error:
- Verify Supabase credentials in Vercel environment variables
- Check if Supabase project is active
- Test connection: `https://your-project.vercel.app/api/health`

### CORS Errors:
- `vercel.json` me CORS settings check karo
- Environment variable `FRONTEND_URL` set karo

### 404 on API Routes:
- Check `vercel.json` routes configuration
- Verify `api/index.js` file exists

### Build Fails:
- Check build logs in Vercel dashboard
- Verify all dependencies in `package.json`
- Make sure Node.js version compatible hai

---

## Environment Variables Checklist

✅ `DB_HOST` - Supabase database host  
✅ `DB_PORT` - 5432  
✅ `DB_NAME` - postgres  
✅ `DB_USER` - postgres  
✅ `DB_PASSWORD` - Your Supabase password  
✅ `JWT_SECRET` - Random secret key  
✅ `JWT_EXPIRES_IN` - 7d  
✅ `ADMIN_BANK_NAME` - Your bank name  
✅ `ADMIN_ACCOUNT_NUMBER` - Your account number  
✅ `ADMIN_ACCOUNT_TITLE` - Account title  
✅ `NEXT_PUBLIC_API_URL` - `/api` (same domain)  

---

## Quick Deploy Commands

```bash
# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install

# Test locally
npm run dev

# Deploy to Vercel
vercel

# Production deploy
vercel --prod
```

---

## Cost

- **Vercel Free Tier:**
  - 100GB bandwidth/month
  - Unlimited serverless function executions
  - Perfect for this project

---

## Support

Agar koi problem aaye:
1. Vercel deployment logs check karo
2. Browser console check karo
3. API health endpoint test karo: `/api/health`

---

## Next Steps After Deployment

1. ✅ Custom domain add karo (optional)
2. ✅ SSL automatically enabled hai
3. ✅ Admin password change karo
4. ✅ Payment instructions update karo
5. ✅ Analytics setup karo (optional)

