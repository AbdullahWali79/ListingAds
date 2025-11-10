import express from 'express';
import { pool } from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { createAuditLog } from '../utils/auditLog.js';

const router = express.Router();

// Get all approved ads (public)
router.get('/', async (req, res) => {
  try {
    const { category_id, search, limit = 50, offset = 0 } = req.query;
    let query = `
      SELECT a.*, u.name as seller_name, c.name as category_name, c.slug as category_slug
      FROM ads a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.status = 'approved'
    `;
    const params = [];
    let paramCount = 1;

    if (category_id) {
      query += ` AND a.category_id = $${paramCount}`;
      params.push(category_id);
      paramCount++;
    }

    if (search) {
      query += ` AND (a.title ILIKE $${paramCount} OR a.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
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

// Get single ad (public)
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, u.name as seller_name, u.email as seller_email, c.name as category_name, c.slug as category_slug
       FROM ads a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN categories c ON a.category_id = c.id
       WHERE a.id = $1 AND a.status = 'approved'`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch ad' });
  }
});

// Create ad
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, price, image_urls, video_url, category_id, package: pkg } =
      req.body;

    if (!title || !category_id) {
      return res.status(400).json({ error: 'Title and category are required' });
    }

    // Determine initial status based on package
    const initialStatus = pkg === 'Free' ? 'pending_admin_approval' : 'pending_verification';

    const result = await pool.query(
      `INSERT INTO ads (title, description, price, image_urls, video_url, category_id, user_id, package, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        title,
        description,
        price || null,
        image_urls || [],
        video_url || null,
        category_id,
        req.user.id,
        pkg || 'Free',
        initialStatus,
      ]
    );

    await createAuditLog('ad_created', req.user.id, result.rows[0].id, 'ad', {
      title: result.rows[0].title,
      package: result.rows[0].package,
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create ad' });
  }
});

// Get user's own ads
router.get('/user/my-ads', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, c.name as category_name, c.slug as category_slug
       FROM ads a
       LEFT JOIN categories c ON a.category_id = c.id
       WHERE a.user_id = $1
       ORDER BY a.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch ads' });
  }
});

// Update ad (owner only)
router.put('/:id', authenticate, async (req, res) => {
  try {
    // Check ownership
    const adCheck = await pool.query('SELECT user_id, status FROM ads WHERE id = $1', [
      req.params.id,
    ]);

    if (adCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    if (adCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { title, description, price, image_urls, video_url, category_id } = req.body;

    const result = await pool.query(
      `UPDATE ads 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           image_urls = COALESCE($4, image_urls),
           video_url = COALESCE($5, video_url),
           category_id = COALESCE($6, category_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [title, description, price, image_urls, video_url, category_id, req.params.id]
    );

    await createAuditLog('ad_updated', req.user.id, req.params.id, 'ad');

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update ad' });
  }
});

// Delete ad (owner only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // Check ownership
    const adCheck = await pool.query('SELECT user_id FROM ads WHERE id = $1', [req.params.id]);

    if (adCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    if (adCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await pool.query('DELETE FROM ads WHERE id = $1', [req.params.id]);
    await createAuditLog('ad_deleted', req.user.id, req.params.id, 'ad');

    res.json({ message: 'Ad deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete ad' });
  }
});

export default router;

