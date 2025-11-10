// Vercel Serverless Function - Express Backend
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from '../backend/src/db/connection.js';
import authRoutes from '../backend/src/routes/auth.js';
import adRoutes from '../backend/src/routes/ads.js';
import paymentRoutes from '../backend/src/routes/payments.js';
import adminRoutes from '../backend/src/routes/admin.js';
import categoryRoutes from '../backend/src/routes/categories.js';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Health check - improved error handling
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const result = await pool.query('SELECT 1 as test');
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected', 
      error: error.message,
      details: process.env.DB_HOST ? 'DB config exists' : 'DB config missing'
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ads', adRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// Export for Vercel serverless
export default app;

