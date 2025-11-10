import express from 'express';
import { pool } from '../db/connection.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { createAuditLog } from '../utils/auditLog.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

// Get all pending payments
router.get('/payments/pending', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, a.title as ad_title, a.package, u.name as user_name, u.email as user_email
       FROM payments p
       LEFT JOIN ads a ON p.ad_id = a.id
       LEFT JOIN users u ON p.user_id = u.id
       WHERE p.status = 'pending'
       ORDER BY p.created_at ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch pending payments' });
  }
});

// Approve payment
router.post('/payments/:id/approve', async (req, res) => {
  try {
    const { admin_note } = req.body;

    // Get payment and ad info
    const paymentResult = await pool.query(
      'SELECT * FROM payments WHERE id = $1',
      [req.params.id]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = paymentResult.rows[0];

    if (payment.status !== 'pending') {
      return res.status(400).json({ error: 'Payment is not pending' });
    }

    // Update payment status to 'verified'
    await pool.query(
      `UPDATE payments 
       SET status = 'verified', verified_at = CURRENT_TIMESTAMP, admin_note = $1
       WHERE id = $2`,
      [admin_note || null, req.params.id]
    );

    // Update ad status to 'approved'
    await pool.query("UPDATE ads SET status = 'approved' WHERE id = $1", [payment.ad_id]);

    await createAuditLog('payment_approved', req.user.id, req.params.id, 'payment', {
      ad_id: payment.ad_id,
    });

    res.json({ message: 'Payment approved and ad activated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to approve payment' });
  }
});

// Reject payment
router.post('/payments/:id/reject', async (req, res) => {
  try {
    const { admin_note } = req.body;

    if (!admin_note) {
      return res.status(400).json({ error: 'Admin note (rejection reason) is required' });
    }

    const paymentResult = await pool.query(
      'SELECT * FROM payments WHERE id = $1',
      [req.params.id]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = paymentResult.rows[0];

    if (payment.status !== 'pending') {
      return res.status(400).json({ error: 'Payment is not pending' });
    }

    // Update payment status
    await pool.query(
      `UPDATE payments 
       SET status = 'rejected', admin_note = $1
       WHERE id = $2`,
      [admin_note, req.params.id]
    );

    // Update ad status to rejected
    await pool.query(
      `UPDATE ads 
       SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [payment.ad_id]
    );

    await createAuditLog('payment_rejected', req.user.id, req.params.id, 'payment', {
      ad_id: payment.ad_id,
      reason: admin_note,
    });

    res.json({ message: 'Payment rejected' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to reject payment' });
  }
});

// Get all ads (admin view)
router.get('/ads', async (req, res) => {
  try {
    const { status, limit = 100, offset = 0 } = req.query;
    let query = `
      SELECT a.*, u.name as seller_name, u.email as seller_email, c.name as category_name
      FROM ads a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
    `;
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` WHERE a.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += ` ORDER BY a.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch ads' });
  }
});

// Approve ad directly (for free ads)
router.post('/ads/:id/approve', async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE ads SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    await createAuditLog('ad_approved', req.user.id, req.params.id, 'ad');

    res.json({ message: 'Ad approved', ad: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to approve ad' });
  }
});

// Reject ad directly
router.post('/ads/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;

    const result = await pool.query(
      `UPDATE ads 
       SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    await createAuditLog('ad_rejected', req.user.id, req.params.id, 'ad', { reason });

    res.json({ message: 'Ad rejected', ad: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to reject ad' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get audit logs
router.get('/audit-logs', async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const result = await pool.query(
      `SELECT al.*, u.name as actor_name
       FROM audit_logs al
       LEFT JOIN users u ON al.actor_id = u.id
       ORDER BY al.created_at DESC
       LIMIT $1 OFFSET $2`,
      [parseInt(limit), parseInt(offset)]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    // Total users
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(usersResult.rows[0].count);
    
    // Users this month
    const usersThisMonthResult = await pool.query(
      `SELECT COUNT(*) as count FROM users 
       WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)`
    );
    const usersThisMonth = parseInt(usersThisMonthResult.rows[0].count);
    const usersLastMonthResult = await pool.query(
      `SELECT COUNT(*) as count FROM users 
       WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
       AND created_at < DATE_TRUNC('month', CURRENT_DATE)`
    );
    const usersLastMonth = parseInt(usersLastMonthResult.rows[0].count);
    const usersChange = usersLastMonth > 0 
      ? ((usersThisMonth - usersLastMonth) / usersLastMonth * 100).toFixed(1)
      : '0.0';

    // Total ads
    const adsResult = await pool.query('SELECT COUNT(*) as count FROM ads');
    const totalAds = parseInt(adsResult.rows[0].count);
    
    // Ads this month
    const adsThisMonthResult = await pool.query(
      `SELECT COUNT(*) as count FROM ads 
       WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)`
    );
    const adsThisMonth = parseInt(adsThisMonthResult.rows[0].count);
    const adsLastMonthResult = await pool.query(
      `SELECT COUNT(*) as count FROM ads 
       WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
       AND created_at < DATE_TRUNC('month', CURRENT_DATE)`
    );
    const adsLastMonth = parseInt(adsLastMonthResult.rows[0].count);
    const adsChange = adsLastMonth > 0 
      ? ((adsThisMonth - adsLastMonth) / adsLastMonth * 100).toFixed(1)
      : '0.0';

    // Pending payments
    const pendingPaymentsResult = await pool.query(
      `SELECT COUNT(*) as count FROM payments WHERE status = 'pending'`
    );
    const pendingPayments = parseInt(pendingPaymentsResult.rows[0].count);
    
    // Pending payments this week
    const pendingThisWeekResult = await pool.query(
      `SELECT COUNT(*) as count FROM payments 
       WHERE status = 'pending' AND created_at >= CURRENT_DATE - INTERVAL '7 days'`
    );
    const pendingThisWeek = parseInt(pendingThisWeekResult.rows[0].count);
    const pendingLastWeekResult = await pool.query(
      `SELECT COUNT(*) as count FROM payments 
       WHERE status = 'pending' 
       AND created_at >= CURRENT_DATE - INTERVAL '14 days'
       AND created_at < CURRENT_DATE - INTERVAL '7 days'`
    );
    const pendingLastWeek = parseInt(pendingLastWeekResult.rows[0].count);
    const pendingChange = pendingLastWeek > 0 
      ? ((pendingThisWeek - pendingLastWeek) / pendingLastWeek * 100).toFixed(1)
      : '0.0';

    // Approved ads
    const approvedAdsResult = await pool.query(
      `SELECT COUNT(*) as count FROM ads WHERE status = 'approved'`
    );
    const approvedAds = parseInt(approvedAdsResult.rows[0].count);
    
    // Approved ads this month
    const approvedThisMonthResult = await pool.query(
      `SELECT COUNT(*) as count FROM ads 
       WHERE status = 'approved' 
       AND updated_at >= DATE_TRUNC('month', CURRENT_DATE)`
    );
    const approvedThisMonth = parseInt(approvedThisMonthResult.rows[0].count);
    const approvedLastMonthResult = await pool.query(
      `SELECT COUNT(*) as count FROM ads 
       WHERE status = 'approved' 
       AND updated_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
       AND updated_at < DATE_TRUNC('month', CURRENT_DATE)`
    );
    const approvedLastMonth = parseInt(approvedLastMonthResult.rows[0].count);
    const approvedChange = approvedLastMonth > 0 
      ? ((approvedThisMonth - approvedLastMonth) / approvedLastMonth * 100).toFixed(1)
      : '0.0';

    res.json({
      totalUsers: {
        value: totalUsers,
        change: usersChange,
        period: 'this month'
      },
      totalAds: {
        value: totalAds,
        change: adsChange,
        period: 'this month'
      },
      pendingPayments: {
        value: pendingPayments,
        change: pendingChange,
        period: 'this week'
      },
      approvedAds: {
        value: approvedAds,
        change: approvedChange,
        period: 'this month'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;

