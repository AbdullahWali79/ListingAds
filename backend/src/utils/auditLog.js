import { pool } from '../db/connection.js';

export async function createAuditLog(action, actorId, targetId, targetType, details = {}) {
  try {
    await pool.query(
      'INSERT INTO audit_logs (action, actor_id, target_id, target_type, details) VALUES ($1, $2, $3, $4, $5)',
      [action, actorId, targetId, targetType, JSON.stringify(details)]
    );
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

