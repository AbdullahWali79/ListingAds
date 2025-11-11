# Vercel Par Update Karne Ke Steps (Quick Guide)

## 🚀 Method 1: Automatic Deployment (Sabse Aasan)

### Step 1: Code Changes Commit Karein
```bash
# Sabhi changes add karein
git add .

# Commit message ke saath commit karein
git commit -m "Update: [aapki changes ka description]"

# GitHub par push karein
git push origin main
```

### Step 2: Vercel Automatically Deploy Karega
- Vercel automatically detect karega ke aapne `main` branch par push kiya hai
- Build process automatically start hoga
- 2-5 minutes mein deployment complete ho jayega

### Step 3: Deployment Status Check Karein
1. [Vercel Dashboard](https://vercel.com/dashboard) mein jayein
2. Aapke project par click karein
3. "Deployments" tab mein latest deployment dekh sakte hain
4. Green tick ✅ aane par deployment successful hai

---

## 🔧 Method 2: Manual Deployment (CLI Se)

### Step 1: Vercel CLI Install Karein (agar nahi hai)
```bash
npm install -g vercel
```

### Step 2: Login Karein
```bash
vercel login
```
- Browser khul jayega, Vercel account se login karein

### Step 3: Project Root Se Deploy Karein
```bash
# Project root directory mein
vercel --prod
```

---

## ⚙️ Environment Variables Update Karna

Agar aapko environment variables update karni hain:

### Steps:
1. [Vercel Dashboard](https://vercel.com/dashboard) mein jayein
2. Aapke project par click karein
3. **Settings** → **Environment Variables** par jayein
4. Variables add/edit karein:
   - `NEXT_PUBLIC_API_URL` - Backend API URL
   - `DATABASE_URL` - Database connection string
   - Aur bhi jo zaroorat ho
5. **Save** karein
6. **Redeploy** karein (Settings → General → Redeploy)

---

## 🗄️ Database Changes Apply Karna

**Important:** Database changes Vercel par nahi hoti, aapko directly database server par apply karni hongi.

### Steps:
1. Database server par connect karein (psql, MySQL client, etc.)
2. Migration scripts run karein
3. Ya manually SQL commands run karein

---

## ✅ Pre-Deployment Checklist

Deploy karne se pehle yeh check karein:

- [ ] Code locally test ho chuka hai
- [ ] `npm run build` successfully complete ho raha hai
- [ ] Environment variables sahi hain
- [ ] Database migrations apply ho chuki hain (agar koi hain)
- [ ] Backend server running hai aur accessible hai
- [ ] No console errors

---

## 🧪 Local Build Test Karna

Deploy karne se pehle local mein build test karein:

```bash
# Frontend directory mein jayein
cd frontend

# Build test karein
npm run build

# Agar build successful hai, to deploy karein
```

---

## 🔍 Common Issues Aur Solutions

### Issue 1: Build Fail Ho Raha Hai
**Solution:**
```bash
cd frontend
npm run build
# Errors dekh kar fix karein
```

### Issue 2: API Calls Fail Ho Rahe Hain
**Solution:**
- `NEXT_PUBLIC_API_URL` environment variable check karein
- Backend server running hai ya nahi check karein
- CORS settings verify karein

### Issue 3: Environment Variables Kaam Nahi Kar Rahi
**Solution:**
- Vercel dashboard mein variables check karein
- Variables ke baad redeploy karein
- Variable names sahi hain ya nahi check karein (NEXT_PUBLIC_ prefix zaroori hai client-side ke liye)

---

## 🔄 Rollback Kaise Karein

Agar koi problem aaye:

1. **Vercel Dashboard Se:**
   - Deployments section mein jayein
   - Previous successful deployment select karein
   - "Promote to Production" button click karein

2. **Git Se:**
   ```bash
   git revert HEAD
   git push origin main
   ```

---

## 📋 Quick Commands Reference

```bash
# Local development
cd frontend
npm run dev

# Build test
cd frontend
npm run build

# Deploy to Vercel (automatic)
git add .
git commit -m "Your message"
git push origin main

# Deploy manually
vercel --prod

# Check deployments
vercel ls

# View logs
vercel logs
```

---

## 🎯 Summary (TL;DR)

1. **Code changes karein**
2. **Git commit aur push karein:**
   ```bash
   git add .
   git commit -m "Update description"
   git push origin main
   ```
3. **Vercel automatically deploy karega** (2-5 minutes)
4. **Dashboard mein check karein** deployment successful hai ya nahi

**That's it!** 🎉

---

## 📞 Help

Agar koi issue aaye:
1. Vercel dashboard → Deployments → Latest deployment → Logs check karein
2. Browser console mein errors check karein
3. Network tab mein API calls verify karein

