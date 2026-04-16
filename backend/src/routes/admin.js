const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken, requireAdmin);

router.get('/overview', async (_req, res) => {
  try {
    const [[{ totalUsers }]] = await db.execute('SELECT COUNT(*) AS totalUsers FROM users');
    const [[{ activeUsers }]] = await db.execute(
      "SELECT COUNT(*) AS activeUsers FROM users WHERE last_active >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
    );
    const [[{ totalMatches }]] = await db.execute('SELECT COUNT(*) AS totalMatches FROM matches');
    const [[{ openReports }]] = await db.execute(
      "SELECT COUNT(*) AS openReports FROM complaints WHERE status_id IN (1, 2)"
    );

    res.json({ totalUsers, activeUsers, totalMatches, openReports });
  } catch (error) {
    console.error('Error fetching admin overview:', error);
    res.status(500).json({ error: 'Failed to load admin overview.' });
  }
});

router.get('/users', async (_req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT user_id AS id, email, role, account_status, last_active, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ error: 'Failed to load users.' });
  }
});

router.patch('/users/:id/role', async (req, res) => {
  try {
    const targetRole = req.body.role;
    if (!['user', 'admin'].includes(targetRole)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }

    await db.execute('UPDATE users SET role = ? WHERE user_id = ?', [targetRole, req.params.id]);
    res.json({ message: 'User role updated.' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role.' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    await db.execute('DELETE FROM notifications WHERE user_id = ? OR match_id IN (SELECT match_id FROM matches WHERE user1_id = ? OR user2_id = ?) OR message_id IN (SELECT message_id FROM messages WHERE sender_id = ?) OR complaint_id IN (SELECT complaint_id FROM complaints WHERE reporter_id = ? OR reported_id = ?)', [userId, userId, userId, userId, userId, userId]);
    await db.execute('DELETE FROM messages WHERE sender_id = ? OR match_id IN (SELECT match_id FROM matches WHERE user1_id = ? OR user2_id = ?)', [userId, userId, userId]);
    await db.execute('DELETE FROM matches WHERE user1_id = ? OR user2_id = ?', [userId, userId]);
    await db.execute('DELETE FROM complaints WHERE reporter_id = ? OR reported_id = ?', [userId, userId]);
    await db.execute('DELETE FROM likes WHERE liker_id = ? OR liked_id = ?', [userId, userId]);
    await db.execute('DELETE FROM passes WHERE passer_id = ? OR passed_id = ?', [userId, userId]);
    await db.execute('DELETE FROM preference_sports WHERE user_id = ?', [userId]);
    await db.execute('DELETE FROM preferences WHERE user_id = ?', [userId]);
    await db.execute('DELETE FROM user_sports WHERE user_id = ?', [userId]);
    await db.execute('DELETE FROM user_photos WHERE user_id = ?', [userId]);
    await db.execute('DELETE FROM profiles WHERE user_id = ?', [userId]);
    await db.execute('DELETE FROM users WHERE user_id = ?', [userId]);

    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

router.get('/reports', async (_req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT
        c.complaint_id AS id,
        c.description,
        c.created_at,
        t.type_name AS type,
        s.status_name AS status,
        reporter.email AS reporter_email,
        reported.email AS reported_email
      FROM complaints c
      JOIN complaint_types t ON c.type_id = t.type_id
      JOIN complaint_statuses s ON c.status_id = s.status_id
      JOIN users reporter ON c.reporter_id = reporter.user_id
      JOIN users reported ON c.reported_id = reported.user_id
      ORDER BY c.created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching admin reports:', error);
    res.status(500).json({ error: 'Failed to load reports.' });
  }
});

router.patch('/reports/:id/status', async (req, res) => {
  try {
    const { statusId } = req.body;
    if (!statusId || typeof statusId !== 'number') {
      return res.status(400).json({ error: 'statusId is required.' });
    }

    await db.execute('UPDATE complaints SET status_id = ? WHERE complaint_id = ?', [statusId, req.params.id]);
    res.json({ message: 'Report status updated.' });
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({ error: 'Failed to update report status.' });
  }
});

module.exports = router;
