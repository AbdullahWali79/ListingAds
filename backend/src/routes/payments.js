import express from 'express';
import { pool } from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { createAuditLog } from '../utils/auditLog.js';

const router = express.Router();

// Get payment instructions (public)
router.get('/instructions', (req, res) => {
  res.json({
    bank_name: process.env.ADMIN_BANK_NAME || 'Your Bank Name',
    account_number: process.env.ADMIN_ACCOUNT_NUMBER || '1234567890',
    account_title: process.env.ADMIN_ACCOUNT_TITLE || 'Your Account Title',
  });
});

// Submit payment (POST /api/payments)
router.post('/', authenticate, async (req, res) => {
  try {
    const { ad_id, sender_name, bank_name, transaction_id, screenshot_url } = req.body;

    // Validate required fields
    if (!ad_id || !sender_name || !bank_name || !transaction_id) {
      return res.status(400).json({
        error: 'Ad ID, sender name, bank name, and transaction ID are required',
      });
    }

    // Verify ad belongs to user and is pending verification
    const adCheck = await pool.query('SELECT * FROM ads WHERE id = $1 AND user_id = $2', [
      ad_id,
      req.user.id,
    ]);

    if (adCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Ad not found or not owned by you' });
    }

    if (adCheck.rows[0].status !== 'pending_verification') {
      return res.status(400).json({
        error: 'Ad is not in pending verification status',
      });
    }

    // Check if payment already exists
    const existingPayment = await pool.query(
      'SELECT id FROM payments WHERE ad_id = $1 AND status = $2',
      [ad_id, 'pending']
    );

    if (existingPayment.rows.length > 0) {
      return res.status(400).json({ error: 'Payment already submitted for this ad' });
    }

    // Create payment record with status='pending' (default)
    const result = await pool.query(
      `INSERT INTO payments (ad_id, user_id, sender_name, bank_name, transaction_id, screenshot_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [ad_id, req.user.id, sender_name, bank_name, transaction_id, screenshot_url || null]
    );

    await createAuditLog('payment_submitted', req.user.id, result.rows[0].id, 'payment', {
      ad_id,
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit payment' });
  }
});

// Submit payment (POST /api/payments/submit) - kept for backward compatibility
router.post('/submit', authenticate, async (req, res) => {
  try {
    const { ad_id, sender_name, bank_name, transaction_id, screenshot_url } = req.body;

    if (!ad_id || !sender_name || !bank_name || !transaction_id) {
      return res.status(400).json({
        error: 'Ad ID, sender name, bank name, and transaction ID are required',
      });
    }

    // Verify ad belongs to user and is pending verification
    const adCheck = await pool.query('SELECT * FROM ads WHERE id = $1 AND user_id = $2', [
      ad_id,
      req.user.id,
    ]);

    if (adCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Ad not found or not owned by you' });
    }

    if (adCheck.rows[0].status !== 'pending_verification') {
      return res.status(400).json({
        error: 'Ad is not in pending verification status',
      });
    }

    // Check if payment already exists
    const existingPayment = await pool.query(
      'SELECT id FROM payments WHERE ad_id = $1 AND status = $2',
      [ad_id, 'pending']
    );

    if (existingPayment.rows.length > 0) {
      return res.status(400).json({ error: 'Payment already submitted for this ad' });
    }

    // Create payment record
    const result = await pool.query(
      `INSERT INTO payments (ad_id, user_id, sender_name, bank_name, transaction_id, screenshot_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [ad_id, req.user.id, sender_name, bank_name, transaction_id, screenshot_url || null]
    );

    await createAuditLog('payment_submitted', req.user.id, result.rows[0].id, 'payment', {
      ad_id,
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit payment' });
  }
});

// Get user's payment history
router.get('/my-payments', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, a.title as ad_title, a.status as ad_status
       FROM payments p
       LEFT JOIN ads a ON p.ad_id = a.id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Get payment for specific ad
router.get('/ad/:ad_id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, a.title as ad_title
       FROM payments p
       LEFT JOIN ads a ON p.ad_id = a.id
       WHERE p.ad_id = $1 AND p.user_id = $2
       ORDER BY p.created_at DESC
       LIMIT 1`,
      [req.params.ad_id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
});

export default router;

