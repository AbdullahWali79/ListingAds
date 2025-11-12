# Local Run Karne Ke Steps (Quick Guide)

## ✅ Step 1: Backend Environment Setup

Backend ke liye `.env` file check karein:

```bash
# Backend directory mein jayein
cd backend

# .env file check karein
# Agar nahi hai, to env.example se copy karein
```

**Required Environment Variables:**
- Database connection (PostgreSQL ya Supabase)
- JWT_SECRET
- Admin payment details

---

## ✅ Step 2: Frontend Environment Setup

Frontend ke liye `.env.local` file check karein:

```bash
# Frontend directory mein jayein
cd frontend

# .env.local file check karein
# Agar nahi hai, to manually create karein
```

**Required:**
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 🚀 Step 3: Backend Start Karein

**Terminal 1 mein:**
```bash
cd backend
npm run dev
```

Backend `http://localhost:5000` par chalega.

---

## 🚀 Step 4: Frontend Start Karein

**Terminal 2 mein (naya terminal kholen):**
```bash
cd frontend
npm run dev
```

Frontend `http://localhost:3000` par chalega.

---

## 🌐 Step 5: Browser Mein Open Karein

Browser mein jayein: **http://localhost:3000**

---

## ⚠️ Important Notes

1. **Backend pehle start karein** - Frontend backend se connect karta hai
2. **Database running hona chahiye** - PostgreSQL ya Supabase
3. **Donon terminals open rakhein** - Backend aur Frontend dono ke liye

---

## 🔧 Quick Commands

```bash
# Backend start
cd backend
npm run dev

# Frontend start (naya terminal)
cd frontend
npm run dev
```

---

## ❌ Agar Error Aaye

1. **Port already in use:**
   - Port 3000 ya 5000 already use ho raha hai
   - Process kill karein ya different port use karein

2. **Database connection error:**
   - Database credentials check karein
   - Database running hai ya nahi verify karein

3. **Module not found:**
   - `npm install` dobara run karein

