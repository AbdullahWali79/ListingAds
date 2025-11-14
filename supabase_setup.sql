-- ============================================
-- ListingAds Database Schema for Supabase
-- ============================================
-- Run this entire script in Supabase SQL Editor
-- Go to: Supabase Dashboard → SQL Editor → New Query → Paste this → Run

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. ADS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ads (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  image_urls TEXT[] DEFAULT '{}',
  video_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pending_admin_approval' CHECK (status IN ('pending_admin_approval', 'pending_verification', 'approved', 'rejected')),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  package VARCHAR(20) DEFAULT 'Free' CHECK (package IN ('Free', 'Standard', 'Premium')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  ad_id INTEGER REFERENCES ads(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  sender_name VARCHAR(255) NOT NULL,
  bank_name VARCHAR(255) NOT NULL,
  transaction_id VARCHAR(255) NOT NULL,
  screenshot_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  admin_note TEXT,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  target_id INTEGER,
  target_type VARCHAR(50),
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ads_user_id ON ads(user_id);
CREATE INDEX IF NOT EXISTS idx_ads_category_id ON ads(category_id);
CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);
CREATE INDEX IF NOT EXISTS idx_payments_ad_id ON payments(ad_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================
-- 7. DEFAULT CATEGORIES
-- ============================================
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

-- ============================================
-- 8. DEFAULT ADMIN USER
-- ============================================
-- Password: admin123 (hashed with bcrypt)
-- Email: admin@listingads.com
-- Role: admin
INSERT INTO users (name, email, password, role) 
VALUES (
  'Admin', 
  'admin@listingads.com', 
  '$2a$10$cQK3vzgNEW.O0XiL5OMIVeAR6K/UsngzFyWAeO80ElbEVFLMORMsK', 
  'admin'
)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES (Optional - Run to check)
-- ============================================
-- Check if tables were created:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check if categories were inserted:
-- SELECT * FROM categories;

-- Check if admin user was created:
-- SELECT id, name, email, role FROM users WHERE role = 'admin';

-- ============================================
-- DONE! ✅
-- ============================================
-- After running this script:
-- 1. Tables will be created
-- 2. Default categories will be inserted
-- 3. Admin user will be created (email: admin@listingads.com, password: admin123)
-- 
-- Next steps:
-- 1. Update backend/.env with your Supabase credentials
-- 2. Restart backend server
-- 3. Test the application!

