# Backend .env File Update Karein

## ✅ Database Already Integrated Hai!

Aapke paas Supabase database already setup hai:
- **Host:** `db.ayptygxyzrcvjdhnsdrt.supabase.co`

## 🔧 Ab Kya Karna Hai:

### Step 1: Backend .env File Update Karein

`backend/.env` file open karein aur yeh values update karein:

```env
# Server
PORT=5000
NODE_ENV=development

# Database - Supabase (YEH UPDATE KAREIN)
DB_HOST=db.ayptygxyzrcvjdhnsdrt.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=YOUR_SUPABASE_PASSWORD_HERE

# JWT
JWT_SECRET=listingads_super_secret_jwt_key_2024_change_in_production_use_random_string
JWT_EXPIRES_IN=7d

# Admin Payment Instructions
ADMIN_BANK_NAME=Your Bank Name
ADMIN_ACCOUNT_NUMBER=1234567890
ADMIN_ACCOUNT_TITLE=Your Account Title
```

**Important:** 
- `DB_PASSWORD` mein apna Supabase database password dalen (jo aapne project create karte waqt set kiya tha)
- Agar password yaad nahi hai, to Supabase dashboard → Settings → Database se reset kar sakte hain

---

### Step 2: Migration Run Karein

```bash
cd backend
npm run migrate
```

Yeh command:
- Database tables create karega
- Default admin user create karega (email: `admin@listingads.com`, password: `admin123`)
- Default categories create karega

---

### Step 3: Backend Server Restart Karein

Migration ke baad backend server restart karein (agar already running hai to stop karein aur phir start karein):

```bash
cd backend
npm run dev
```

---

### Step 4: Test Karein

1. **Health Check:**
   ```bash
   curl http://localhost:5000/api/health
   ```
   
   Expected response:
   ```json
   {"status":"ok","database":"connected"}
   ```

2. **Registration Test:**
   - Browser: `http://localhost:3000/login`
   - "Create Account" tab
   - Form fill karein aur test karein

3. **Admin Login:**
   - Email: `admin@listingads.com`
   - Password: `admin123`

---

## 🎯 Summary

1. `backend/.env` file mein Supabase credentials update karein
2. `npm run migrate` run karein
3. Backend server restart karein
4. Test karein!

---

**Note:** Agar Supabase password yaad nahi hai, to Supabase dashboard se reset karein ya naya password set karein.

