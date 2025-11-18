# 🚀 Vercel Deployment Guide - Classified Ads App

## Step 1: Prepare Your Code

### 1.1 Push to GitHub
1. Open terminal in your project folder
2. Initialize git (if not already done):
```bash
git init
git add .
git commit -m "Initial commit"
```

3. Create a new repository on GitHub:
   - Go to: https://github.com/new
   - Repository name: `listing-ads` (or any name)
   - Make it **Public** or **Private** (your choice)
   - Click "Create repository"

4. Push your code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/listing-ads.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel

### 2.1 Create Vercel Account
1. Go to: https://vercel.com/
2. Click **"Sign Up"**
3. Sign up with GitHub (recommended) or email

### 2.2 Import Project
1. After login, click **"Add New..."** → **"Project"**
2. Click **"Import Git Repository"**
3. Select your GitHub repository (`listing-ads`)
4. Click **"Import"**

### 2.3 Configure Project
Vercel will auto-detect Vite settings, but verify:

**Framework Preset:** Vite  
**Root Directory:** `./` (default)  
**Build Command:** `npm run build` (auto-detected)  
**Output Directory:** `dist` (auto-detected)  
**Install Command:** `npm install` (auto-detected)

### 2.4 Environment Variables (Optional)
If you have any environment variables, add them in Vercel:
- Go to **Settings** → **Environment Variables**
- Add any variables if needed (Firebase config is already in code)

### 2.5 Deploy
1. Click **"Deploy"** button
2. Wait 2-3 minutes for build to complete
3. Your app will be live! 🎉

## Step 3: Custom Domain (Optional)

### 3.1 Add Custom Domain
1. Go to your project in Vercel
2. Click **Settings** → **Domains**
3. Add your domain (e.g., `classifiedads.com`)
4. Follow DNS configuration instructions

## Step 4: Post-Deployment Checklist

### ✅ Verify These Work:
- [ ] Public page loads categories
- [ ] Public page loads ads
- [ ] User registration works
- [ ] User login works
- [ ] Admin login works
- [ ] Seller dashboard works
- [ ] Ad posting works
- [ ] Image URLs work correctly

### 🔧 Important Notes:

1. **Firebase Config**: Your Firebase config is already in `src/firebase.ts` - no changes needed

2. **Firestore Rules**: Make sure you've updated Firestore security rules (see `FIRESTORE_RULES_UPDATE_GUIDE.md`)

3. **Build Settings**: Vercel auto-detects Vite, so no special config needed

4. **Automatic Deployments**: 
   - Every push to `main` branch = automatic deployment
   - Preview deployments for pull requests

5. **Environment**: Production environment is automatically set

## Step 5: Update Firebase Allowed Domains

After deployment, add your Vercel domain to Firebase:

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select project: `classified-ads-app-4f856`
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Add your Vercel domain (e.g., `your-app.vercel.app`)
5. If using custom domain, add that too

## Troubleshooting

### Build Fails?
- Check build logs in Vercel dashboard
- Make sure all dependencies are in `package.json`
- Check for TypeScript errors: `npm run build` locally

### App Works Locally But Not on Vercel?
- Check browser console for errors
- Verify Firestore rules allow public read
- Check Firebase authorized domains

### Images Not Loading?
- Make sure image URLs are absolute (https://)
- Check CORS settings if using external image hosting

## Quick Deploy Commands

If you prefer CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

## Your Live URL
After deployment, you'll get a URL like:
- `https://listing-ads-xyz123.vercel.app`

This URL will be shown in your Vercel dashboard after successful deployment.

---

**Need Help?** Check Vercel docs: https://vercel.com/docs

