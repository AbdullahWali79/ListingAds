# Vercel Par Update Kaise Karein

Yeh guide aapko batayegi ke Vercel par website ko kaise update karein jab aap code changes ya database changes karte hain.

## Prerequisites

1. GitHub repository connected hai Vercel se
2. Vercel account aur project setup ho chuka hai
3. Environment variables properly set hain

## Method 1: Automatic Deployment (Recommended)

### Steps:

1. **Code Changes Commit Karein:**
   ```bash
   git add .
   git commit -m "Update website design and features"
   git push origin main
   ```

2. **Vercel Automatically Deploy Karega:**
   - Vercel automatically detect karega new commits
   - Build process start hoga
   - Deployment complete hone par notification aayega

3. **Check Deployment Status:**
   - Vercel dashboard mein jayein
   - Latest deployment check karein
   - Build logs dekh kar errors check karein

## Method 2: Manual Deployment

### Steps:

1. **Vercel CLI Install Karein (agar nahi hai):**
   ```bash
   npm i -g vercel
   ```

2. **Login Karein:**
   ```bash
   vercel login
   ```

3. **Deploy Karein:**
   ```bash
   cd frontend
   vercel --prod
   ```

## Database Changes Apply Karne Ke Liye

### Important: Database Changes Vercel Par Nahi Hote

Database changes aapko **directly database server par** apply karni hongi. Vercel sirf frontend deploy karta hai.

### Steps:

1. **Database Server Par Connect Karein:**
   ```bash
   # PostgreSQL ke liye
   psql -h your_database_host -U your_username -d your_database_name
   ```

2. **Migration Script Run Karein:**
   ```sql
   -- Optional fields add karne ke liye (agar chahiye)
   ALTER TABLE users 
   ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
   ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20),
   ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
   ADD COLUMN IF NOT EXISTS location VARCHAR(255);
   
   ALTER TABLE ads 
   ADD COLUMN IF NOT EXISTS location VARCHAR(255);
   ```

3. **Ya Migration File Run Karein:**
   ```bash
   psql -h your_host -U your_user -d your_database < migration.sql
   ```

## Environment Variables Update Karna

### Steps:

1. **Vercel Dashboard Mein Jayein:**
   - Project select karein
   - Settings → Environment Variables

2. **New Variables Add Karein (agar zaroorat ho):**
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
   ```

3. **Redeploy Karein:**
   - Settings → General → Redeploy
   - Ya automatic redeploy ho jayega

## Common Issues Aur Solutions

### Issue 1: Build Fail Ho Raha Hai

**Solution:**
```bash
# Local mein test karein
cd frontend
npm run build

# Errors fix karein
# Phir commit aur push karein
```

### Issue 2: API Calls Fail Ho Rahe Hain

**Solution:**
- Check karein `NEXT_PUBLIC_API_URL` environment variable sahi set hai
- Backend server running hai
- CORS settings sahi hain

### Issue 3: Database Connection Issues

**Solution:**
- Database server accessible hai
- Connection string sahi hai
- Firewall rules allow kar rahe hain

## Deployment Checklist

Before deploying, ensure:

- [ ] Code changes tested locally
- [ ] `npm run build` successfully completes
- [ ] Environment variables updated (if needed)
- [ ] Database migrations applied (if any)
- [ ] Backend server running and accessible
- [ ] No console errors in browser

## Rollback Kaise Karein

Agar koi issue aaye:

1. **Vercel Dashboard Mein:**
   - Deployments section mein jayein
   - Previous successful deployment select karein
   - "Promote to Production" click karein

2. **Ya Git Se:**
   ```bash
   git revert HEAD
   git push origin main
   ```

## Best Practices

1. **Always Test Locally First:**
   ```bash
   npm run dev
   npm run build
   ```

2. **Use Feature Branches:**
   ```bash
   git checkout -b feature/new-feature
   # Make changes
   git push origin feature/new-feature
   # Create PR, test, then merge
   ```

3. **Monitor Deployments:**
   - Vercel dashboard mein logs check karein
   - Errors immediately fix karein

4. **Database Backups:**
   - Database changes se pehle backup lein
   - Production par test karein

## Quick Reference Commands

```bash
# Local development
cd frontend
npm run dev

# Build test
npm run build

# Deploy to Vercel
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs
```

## Support

Agar koi issue aaye:
1. Vercel dashboard mein deployment logs check karein
2. Browser console mein errors check karein
3. Network tab mein API calls check karein
4. Database connection verify karein

## Important Notes

- **Vercel automatically deploys** jab aap `main` branch par push karte hain
- **Database changes manually** apply karni hoti hain
- **Environment variables** Vercel dashboard se update karein
- **Always backup** database before migrations

