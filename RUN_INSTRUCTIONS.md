# Website Run Karne Ke Liye Step-by-Step Guide

## 🚀 Local Development (Test Karne Ke Liye)

### Step 1: Backend Start Karein

```bash
# Terminal 1 mein
cd backend
npm install
npm start
```

Backend `http://localhost:5000` par chalega.

### Step 2: Frontend Start Karein

```bash
# Terminal 2 mein (naya terminal kholen)
cd frontend
npm install
npm run dev
```

Frontend `http://localhost:3000` par chalega.

### Step 3: Browser Mein Open Karein

Browser mein jayein: `http://localhost:3000`

## 📋 Prerequisites Check

### Backend Environment Variables

`backend/.env` file check karein:
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=listingads
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
ADMIN_BANK_NAME=Your Bank Name
ADMIN_ACCOUNT_NUMBER=1234567890
ADMIN_ACCOUNT_TITLE=Your Account Title
```

### Frontend Environment Variables

`frontend/.env.local` file check karein:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 🔧 Agar Koi Issue Aaye

### Issue 1: Port Already in Use

**Solution:**
```bash
# Backend ke liye different port use karein
PORT=5001 npm start

# Ya process kill karein
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:5000 | xargs kill
```

### Issue 2: Database Connection Error

**Solution:**
1. PostgreSQL running hai check karein
2. Database credentials sahi hain verify karein
3. Database create karein:
```bash
createdb listingads
```

### Issue 3: npm install Errors

**Solution:**
```bash
# Node modules delete karein
rm -rf node_modules
rm package-lock.json

# Phir install karein
npm install
```

## 🏗️ Build Test (Production Build)

### Step 1: Frontend Build

```bash
cd frontend
npm run build
```

Agar build successful ho, to production ready hai!

### Step 2: Production Server (Optional)

```bash
cd frontend
npm start
```

## 🌐 Vercel Par Deploy Karna

### Method 1: Automatic (GitHub Se)

1. **Code Push Karein:**
```bash
git add .
git commit -m "Website updates"
git push origin main
```

2. **Vercel Automatically Deploy Karega**
   - Vercel dashboard mein jayein
   - Latest deployment check karein

### Method 2: Vercel CLI Se

1. **Vercel CLI Install:**
```bash
npm i -g vercel
```

2. **Login:**
```bash
vercel login
```

3. **Deploy:**
```bash
cd frontend
vercel --prod
```

## 📝 Quick Commands Reference

```bash
# Backend start
cd backend && npm start

# Frontend start (development)
cd frontend && npm run dev

# Frontend build (production)
cd frontend && npm run build

# Both terminals mein run karein
# Terminal 1: Backend
# Terminal 2: Frontend
```

## ✅ Checklist Before Deploying

- [ ] Backend locally chal raha hai
- [ ] Frontend locally chal raha hai
- [ ] Database connected hai
- [ ] `npm run build` successful hai
- [ ] Environment variables set hain
- [ ] No console errors
- [ ] All pages working

## 🎯 Testing Steps

1. **Homepage Check:**
   - `http://localhost:3000` open karein
   - Hero section dikhna chahiye
   - Categories aur latest ads dikhne chahiye

2. **Login/Register:**
   - `/login` page check karein
   - Tabs working hain
   - Form submit ho raha hai

3. **Admin Dashboard:**
   - Admin account se login karein
   - Sidebar working hai
   - Stats cards dikh rahe hain

4. **Seller Dashboard:**
   - Seller account se login karein
   - Create ad form working hai
   - My ads list dikh raha hai

5. **Buyer Dashboard:**
   - `/buyer` page check karein
   - Search aur filters working hain
   - Wishlist working hai

6. **Product Detail:**
   - Kisi ad par click karein
   - Image gallery working hai
   - WhatsApp button working hai

## 🆘 Common Issues Solutions

### Backend Not Starting
```bash
# Check Node version
node -v  # Should be 16+ or 18+

# Check if port available
# Reinstall dependencies
cd backend
rm -rf node_modules
npm install
```

### Frontend Build Fails
```bash
# Clear Next.js cache
cd frontend
rm -rf .next
npm run build
```

### Database Issues
```bash
# Check PostgreSQL running
# Windows: Services check karein
# Mac: brew services list
# Linux: sudo systemctl status postgresql

# Create database if not exists
createdb listingads
```

## 📞 Support

Agar koi issue aaye:
1. Error message check karein
2. Console logs dekhein
3. Database connection verify karein
4. Environment variables check karein

---

**Sab kuch ready hai! Ab run karein aur enjoy karein! 🎉**

