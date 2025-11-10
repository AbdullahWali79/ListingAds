# ListingAds - Full-Stack Classified Ads Platform

A complete classified ads website built with Next.js (TypeScript) frontend and Node.js (Express) + PostgreSQL backend.

## Features

### Authentication
- JWT-based authentication system
- User roles: `user` (seller/buyer) and `admin`
- Secure password hashing with bcrypt

### Ads Workflow
- **Seller creates ad** → Selects package (Free, Standard, Premium)
- **Free Package**: Ad status = `pending_admin_approval`
- **Paid Packages** (Standard/Premium): 
  - Shows admin payment instructions
  - Seller submits payment details (sender name, bank/service, transaction ID, screenshot URL)
  - Ad status = `pending_verification`
- **Admin verification**: Manual approval/rejection of payments
- **Approved ads**: Visible on public listing

### Admin Panel
- View all pending payments
- Approve or reject payments manually
- Manage categories
- View all ads and users
- Audit logs for all actions

### Database Schema
- `users` - User accounts with roles
- `categories` - Ad categories
- `ads` - Advertisements with status tracking
- `payments` - Payment submissions and verification
- `audit_logs` - System activity tracking

## Project Structure

```
ListingAds/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── connection.js
│   │   │   ├── schema.sql
│   │   │   └── migrate.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── ads.js
│   │   │   ├── payments.js
│   │   │   ├── admin.js
│   │   │   └── categories.js
│   │   ├── utils/
│   │   │   └── auditLog.js
│   │   └── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx (Home)
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── categories/
│   │   │   ├── ads/[id]/
│   │   │   ├── seller/
│   │   │   │   └── payment/[adId]/
│   │   │   └── admin/
│   │   ├── components/
│   │   │   └── Navbar.tsx
│   │   └── lib/
│   │       ├── api.ts
│   │       └── auth.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 12+
- Git

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your database credentials and JWT secret.

4. **Set up PostgreSQL database:**
   ```bash
   createdb listingads
   ```

5. **Run database migrations:**
   ```bash
   npm run migrate
   ```
   This creates all tables and a default admin user:
   - Email: `admin@listingads.com`
   - Password: `admin123`

6. **Start the server:**
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Update `NEXT_PUBLIC_API_URL` if your backend runs on a different port.

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Frontend runs on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create category (admin only)
- `PUT /api/categories/:id` - Update category (admin only)
- `DELETE /api/categories/:id` - Delete category (admin only)

### Ads
- `GET /api/ads` - Get all approved ads (public)
- `GET /api/ads/:id` - Get ad by ID (public)
- `POST /api/ads` - Create ad (authenticated)
- `GET /api/ads/user/my-ads` - Get user's ads (authenticated)
- `PUT /api/ads/:id` - Update ad (owner only)
- `DELETE /api/ads/:id` - Delete ad (owner only)

### Payments
- `GET /api/payments/instructions` - Get payment instructions (public)
- `POST /api/payments/submit` - Submit payment (authenticated)
- `GET /api/payments/my-payments` - Get user's payments (authenticated)
- `GET /api/payments/ad/:ad_id` - Get payment for ad (authenticated)

### Admin
- `GET /api/admin/payments/pending` - Get pending payments (admin)
- `POST /api/admin/payments/:id/approve` - Approve payment (admin)
- `POST /api/admin/payments/:id/reject` - Reject payment (admin)
- `GET /api/admin/ads` - Get all ads (admin)
- `POST /api/admin/ads/:id/approve` - Approve ad (admin)
- `POST /api/admin/ads/:id/reject` - Reject ad (admin)
- `GET /api/admin/users` - Get all users (admin)
- `GET /api/admin/audit-logs` - Get audit logs (admin)

## Frontend Pages

- **Home (`/`)** - Latest approved ads
- **Categories (`/categories`)** - Browse ads by category
- **Ad Detail (`/ads/:id`)** - View individual ad
- **Login (`/login`)** - User login
- **Register (`/register`)** - User registration
- **Seller Dashboard (`/seller`)** - Create ads, view my ads, payment history
- **Payment Submission (`/seller/payment/:adId`)** - Submit payment for paid ads
- **Admin Dashboard (`/admin`)** - Manage payments, ads, users

## Ad Status Flow

1. **Free Package:**
   - Created → `pending_admin_approval` → Admin approves → `approved`

2. **Paid Packages (Standard/Premium):**
   - Created → `pending_verification` → Payment submitted → Admin verifies → `approved` or `rejected`

## Payment Verification Process

1. Seller creates ad with paid package
2. System shows payment instructions (bank details from env)
3. Seller submits payment form with:
   - Sender name
   - Bank name/service (Easypaisa, JazzCash, etc.)
   - Transaction ID
   - Screenshot URL (optional)
4. Admin reviews pending payments
5. Admin approves → Ad becomes `approved` and visible
6. Admin rejects → Ad becomes `rejected` with reason

## Environment Variables

### Backend (.env)
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

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Deployment

### Backend (Render)
1. Connect your GitHub repository
2. Set build command: `cd backend && npm install`
3. Set start command: `cd backend && npm start`
4. Add environment variables in Render dashboard
5. Add PostgreSQL database in Render

### Frontend (Vercel)
1. Import project from GitHub
2. Set root directory to `frontend`
3. Add environment variable: `NEXT_PUBLIC_API_URL` (your Render backend URL)
4. Deploy

## Default Admin Credentials

After running migrations:
- **Email:** `admin@listingads.com`
- **Password:** `admin123`

**⚠️ Change these credentials in production!**

## Technologies Used

- **Frontend:** Next.js 14, TypeScript, React
- **Backend:** Node.js, Express, PostgreSQL
- **Authentication:** JWT, bcrypt
- **Database:** PostgreSQL with pg library

## License

MIT
