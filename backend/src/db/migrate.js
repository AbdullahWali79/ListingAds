import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pool } from './connection.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrate() {
  try {
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('Database migration completed successfully!');
    
    // Create default admin user (password: admin123)
    const adminPassword = await import('bcryptjs').then(m => m.default.hash('admin123', 10));
    await pool.query(
      `INSERT INTO users (name, email, password, role) 
       VALUES ('Admin', 'admin@listingads.com', $1, 'admin')
       ON CONFLICT (email) DO NOTHING`,
      [adminPassword]
    );
    console.log('Default admin user created (email: admin@listingads.com, password: admin123)');
    
    // Create default categories
    await pool.query(
      `INSERT INTO categories (name, slug) VALUES
       ('Electronics', 'electronics'),
       ('Vehicles', 'vehicles'),
       ('Real Estate', 'real-estate'),
       ('Jobs', 'jobs'),
       ('Services', 'services'),
       ('Fashion', 'fashion'),
       ('Home & Garden', 'home-garden'),
       ('Other', 'other')
       ON CONFLICT (slug) DO NOTHING`
    );
    console.log('Default categories created');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();

