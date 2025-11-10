# Database Changes Documentation

## Overview
Yeh document database mein zaroori changes aur optional enhancements ko document karta hai.

## Current Schema Status
Current database schema sabhi basic features ke liye kaafi hai. Kuch optional fields add kiye ja sakte hain better UX ke liye.

## Optional Enhancements (Recommended)

### 1. Users Table - Additional Fields
Agar aap seller phone number, WhatsApp number, aur verified status store karna chahte hain:

```sql
-- Add phone and verified fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20),
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- Create index for verified sellers
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified);
```

### 2. Ads Table - Location Field
Agar aap ads ke liye location store karna chahte hain:

```sql
-- Add location field to ads table
ALTER TABLE ads 
ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- Create index for location-based searches
CREATE INDEX IF NOT EXISTS idx_ads_location ON ads(location);
```

### 3. Wishlist Table (Optional)
Agar aap server-side wishlist store karna chahte hain (currently localStorage use ho raha hai):

```sql
-- Create wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  ad_id INTEGER REFERENCES ads(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, ad_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_ad_id ON wishlist(ad_id);
```

### 4. Reviews/Ratings Table (Optional)
Agar aap reviews aur ratings store karna chahte hain:

```sql
-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  ad_id INTEGER REFERENCES ads(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, ad_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reviews_ad_id ON reviews(ad_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
```

## Migration Instructions

### Production Database Par Changes Apply Karne Ke Liye:

1. **Backup Database:**
   ```bash
   pg_dump -h your_host -U your_user -d your_database > backup.sql
   ```

2. **Migration Script Run Karein:**
   ```bash
   # Connect to your database
   psql -h your_host -U your_user -d your_database
   
   # Run the SQL commands from above
   ```

3. **Ya Migration File Create Karein:**
   ```sql
   -- migration_optional_fields.sql
   -- Run this file on your database
   ```

## Current Implementation Notes

1. **Location:** Currently frontend mein hardcoded/default values use ho rahe hain. Database field add karne se better search/filter functionality milegi.

2. **Phone/WhatsApp:** Currently UI mein show ho raha hai lekin database mein store nahi ho raha. Optional fields add karne se sellers apna contact info store kar sakte hain.

3. **Verified Seller:** Currently sab sellers ko "Verified" dikhaya ja raha hai. `is_verified` field add karne se admin verified sellers ko mark kar sakta hai.

4. **Wishlist:** Currently localStorage use ho raha hai. Server-side wishlist table add karne se cross-device sync hoga.

## Important Notes

- **Current schema kaafi hai** basic functionality ke liye
- Optional fields add karne se better features milenge
- Migration run karne se pehle **always backup** lein
- Production database par changes test environment mein pehle test karein

## No Breaking Changes Required

**Good News:** Current database schema sabhi new UI features ke saath kaam kar raha hai. Optional enhancements sirf better functionality ke liye hain, zaroori nahi hain.

