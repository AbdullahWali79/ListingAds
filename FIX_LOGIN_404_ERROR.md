# Login 404 Error Fix

## 🔴 Problem:
Login karte waqt "Request failed with status code 404" error aa raha hai.

## ✅ Solution:

### Issue:
Frontend server ko `.env.local` file ke changes pick karne ke liye **restart** karna hoga.

### Steps:

1. **Frontend Server Restart Karein:**
   - Terminal mein frontend server stop karein (Ctrl+C)
   - Phir dobara start karein:
   ```bash
   cd frontend
   npm run dev
   ```

2. **Browser Refresh Karein:**
   - Browser mein hard refresh karein (Ctrl+Shift+R ya Ctrl+F5)
   - Ya browser close karke dobara open karein

3. **Login Test Karein:**
   - `http://localhost:3000/login` par jayein
   - Admin credentials se login karein:
     - Email: `admin@listingads.com`
     - Password: `admin123`

---

## ✅ Verification:

`.env.local` file check karein:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Yeh file `frontend/.env.local` mein honi chahiye.

---

## 🔧 Alternative: Manual Restart

Agar automatic restart nahi ho raha:

1. **All Node Processes Stop Karein:**
   ```powershell
   Get-Process -Name node | Stop-Process -Force
   ```

2. **Frontend Start Karein:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Backend Start Karein (agar stopped hai):**
   ```bash
   cd backend
   npm run dev
   ```

---

## 📝 Note:

Next.js environment variables sirf server start ke waqt load hoti hain. Agar aap `.env.local` file create/update karte hain, to server restart karna zaroori hai.

