const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken, requireAdmin);

const SERIAL_REPORTER_THRESHOLD = 3;
const VALID_REPORT_STATUSES = ['Pending', 'Under Review', 'Resolved', 'Dismissed'];
const VALID_MODERATION_ACTIONS = ['warn', 'suspend', 'ban', 'dismiss'];

async function getComplaintStatusId(connection, statusName) {
  const [rows] = await connection.execute(
    'SELECT status_id FROM complaint_statuses WHERE status_name = ? LIMIT 1',
    [statusName]
  );
  return rows[0]?.status_id ?? null;
}

async function getNotificationTypeId(connection, typeName) {
  const [rows] = await connection.execute(
    'SELECT type_id FROM notification_types WHERE type_name = ? LIMIT 1',
    [typeName]
  );
  return rows[0]?.type_id ?? null;
}

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
        c.reporter_id,
        c.reported_id,
        c.description,
        c.created_at,
        t.type_name AS type,
        s.status_name AS status,
        reporter.email AS reporter_email,
        reported.email AS reported_email,
        reported.account_status AS reported_account_status
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

router.get('/reports/:id/context', async (req, res) => {
  try {
    const complaintId = Number(req.params.id);
    if (!Number.isInteger(complaintId) || complaintId <= 0) {
      return res.status(400).json({ error: 'Invalid report id.' });
    }

    const [reportRows] = await db.execute(
      `SELECT
        c.complaint_id AS id,
        c.reporter_id,
        c.reported_id,
        c.description,
        c.created_at,
        c.internal_note,
        t.type_name AS type,
        s.status_name AS status,
        reporter.email AS reporter_email,
        reported.email AS reported_email,
        reported.account_status AS reported_account_status,
        reported.suspended_until AS reported_suspended_until,
        reported.suspension_reason AS reported_suspension_reason,
        reported.created_at AS reported_created_at,
        p.first_name,
        p.last_name,
        p.bio
      FROM complaints c
      JOIN complaint_types t ON c.type_id = t.type_id
      JOIN complaint_statuses s ON c.status_id = s.status_id
      JOIN users reporter ON c.reporter_id = reporter.user_id
      JOIN users reported ON c.reported_id = reported.user_id
      LEFT JOIN profiles p ON p.user_id = reported.user_id
      WHERE c.complaint_id = ?
      LIMIT 1`,
      [complaintId]
    );

    if (reportRows.length === 0) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    const report = reportRows[0];

    const [[reporterStats]] = await db.execute(
      `SELECT
        COUNT(*) AS total_reports,
        SUM(CASE WHEN cs.status_name IN ('Pending', 'Under Review') THEN 1 ELSE 0 END) AS open_reports
      FROM complaints c
      JOIN complaint_statuses cs ON cs.status_id = c.status_id
      WHERE c.reporter_id = ?`,
      [report.reporter_id]
    );

    const [priorComplaints] = await db.execute(
      `SELECT
        c.complaint_id AS id,
        c.created_at,
        t.type_name AS type,
        s.status_name AS status,
        reporter.email AS reporter_email,
        c.description
      FROM complaints c
      JOIN complaint_types t ON c.type_id = t.type_id
      JOIN complaint_statuses s ON c.status_id = s.status_id
      JOIN users reporter ON c.reporter_id = reporter.user_id
      WHERE c.reported_id = ? AND c.complaint_id <> ?
      ORDER BY c.created_at DESC
      LIMIT 20`,
      [report.reported_id, complaintId]
    );

    const [priorActions] = await db.execute(
      `SELECT
        ma.action_id,
        ma.action_type,
        ma.previous_account_status,
        ma.new_account_status,
        ma.note,
        ma.created_at,
        admin.email AS admin_email
      FROM moderation_actions ma
      JOIN users admin ON admin.user_id = ma.admin_id
      WHERE ma.target_user_id = ?
      ORDER BY ma.created_at DESC
      LIMIT 20`,
      [report.reported_id]
    );

    const [photos] = await db.execute(
      `SELECT photo_url
       FROM user_photos
       WHERE user_id = ?
       ORDER BY display_order ASC, uploaded_at ASC
       LIMIT 6`,
      [report.reported_id]
    );

    res.json({
      report,
      reporterStats: {
        totalReports: reporterStats?.total_reports ?? 0,
        openReports: reporterStats?.open_reports ?? 0,
        isSerialReporter: (reporterStats?.total_reports ?? 0) >= SERIAL_REPORTER_THRESHOLD,
      },
      reportedUser: {
        id: report.reported_id,
        email: report.reported_email,
        fullName: [report.first_name, report.last_name].filter(Boolean).join(' ').trim() || null,
        bio: report.bio,
        accountStatus: report.reported_account_status,
        suspendedUntil: report.reported_suspended_until,
        suspensionReason: report.reported_suspension_reason,
        createdAt: report.reported_created_at,
        photos: photos.map((p) => p.photo_url),
      },
      priorComplaints,
      priorActions,
    });
  } catch (error) {
    console.error('Error fetching report context:', error);
    res.status(500).json({ error: 'Failed to load report context.' });
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

router.post('/reports/:id/moderate', async (req, res) => {
  const complaintId = Number(req.params.id);
  const action = String(req.body.action || '').toLowerCase();
  const requestedStatus = typeof req.body.statusName === 'string' ? req.body.statusName.trim() : '';
  const note = typeof req.body.note === 'string' ? req.body.note.trim() : '';
  const suspensionReason = typeof req.body.suspensionReason === 'string' ? req.body.suspensionReason.trim() : '';
  const suspendedUntilRaw = typeof req.body.suspendedUntil === 'string' ? req.body.suspendedUntil.trim() : '';

  if (!Number.isInteger(complaintId) || complaintId <= 0) {
    return res.status(400).json({ error: 'Invalid report id.' });
  }
  if (!VALID_MODERATION_ACTIONS.includes(action)) {
    return res.status(400).json({ error: 'Invalid moderation action.' });
  }
  if (note.length > 1000) {
    return res.status(400).json({ error: 'Note must be 1000 characters or fewer.' });
  }
  if (action === 'suspend' && !suspensionReason) {
    return res.status(400).json({ error: 'A suspension reason is required.' });
  }

  let suspendedUntil = null;
  if (action === 'suspend') {
    suspendedUntil = new Date(suspendedUntilRaw);
    if (!suspendedUntilRaw || Number.isNaN(suspendedUntil.getTime()) || suspendedUntil.getTime() <= Date.now()) {
      return res.status(400).json({ error: 'A future suspension end date is required.' });
    }
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [reportRows] = await connection.execute(
      `SELECT c.complaint_id, c.reported_id, c.status_id, u.account_status
       FROM complaints c
       JOIN users u ON u.user_id = c.reported_id
       WHERE c.complaint_id = ?
       LIMIT 1`,
      [complaintId]
    );

    if (reportRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Report not found.' });
    }

    if ([3, 4].includes(reportRows[0].status_id)) {
      await connection.rollback();
      return res.status(409).json({ error: 'This report is already closed and cannot be moderated again.' });
    }

    const report = reportRows[0];
    const previousAccountStatus = report.account_status;
    const nextAccountStatusByAction = {
      warn: previousAccountStatus,
      suspend: 'suspended',
      ban: 'banned',
      dismiss: previousAccountStatus,
    };
    const nextAccountStatus = nextAccountStatusByAction[action];
    const targetStatusName = VALID_REPORT_STATUSES.includes(requestedStatus)
      ? requestedStatus
      : (action === 'dismiss' ? 'Dismissed' : 'Resolved');
    const targetStatusId = await getComplaintStatusId(connection, targetStatusName);

    if (!targetStatusId) {
      await connection.rollback();
      return res.status(400).json({ error: 'Unknown complaint status.' });
    }

    const nextSuspendedUntil = action === 'suspend' ? suspendedUntil.toISOString().slice(0, 19).replace('T', ' ') : null;
    const nextSuspensionReason = action === 'suspend' ? suspensionReason : null;

    await connection.execute(
      `UPDATE users
       SET account_status = ?, suspended_until = ?, suspension_reason = ?
       WHERE user_id = ?`,
      [nextAccountStatus, nextSuspendedUntil, nextSuspensionReason, report.reported_id]
    );

    await connection.execute(
      `UPDATE complaints
       SET status_id = ?, internal_note = ?
       WHERE complaint_id = ?`,
      [targetStatusId, note || null, complaintId]
    );

    await connection.execute(
      `INSERT INTO moderation_actions
       (complaint_id, admin_id, target_user_id, action_type, previous_account_status, new_account_status, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [complaintId, req.userId, report.reported_id, action, previousAccountStatus, nextAccountStatus, note || null]
    );

    const adminWarningTypeId = await getNotificationTypeId(connection, 'admin_warning');
    if (adminWarningTypeId) {
      const actionLabel = action.charAt(0).toUpperCase() + action.slice(1);
      const message = action === 'dismiss'
        ? 'A report involving your account was reviewed and dismissed.'
        : `Admin action applied to your account: ${actionLabel}.`;

      await connection.execute(
        `INSERT INTO notifications (user_id, type_id, complaint_id, message)
         VALUES (?, ?, ?, ?)`,
        [report.reported_id, adminWarningTypeId, complaintId, message]
      );
    }

    await connection.commit();
    res.json({
      message: 'Moderation action applied.',
      action,
      accountStatus: nextAccountStatus,
      reportStatus: targetStatusName,
      notePersisted: true,
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error applying moderation action:', error);
    res.status(500).json({ error: 'Failed to apply moderation action.' });
  } finally {
    connection.release();
  }
});

router.get('/users/:id/profile', async (req, res) => {
  const targetId = Number(req.params.id);
  if (!Number.isInteger(targetId) || targetId <= 0) {
    return res.status(400).json({ error: 'Invalid user id.' });
  }

  try {
    const [profileRows] = await db.execute(
      `SELECT
         u.user_id,
         u.email,
         u.account_status,
         u.suspended_until,
         u.suspension_reason,
         u.last_active,
         u.created_at,
         pr.first_name,
         pr.bio,
         TIMESTAMPDIFF(YEAR, pr.birth_date, CURDATE()) AS age,
         c.city_name,
         co.country_name,
         rg.goal_name
       FROM users u
       LEFT JOIN profiles pr     ON pr.user_id    = u.user_id
       LEFT JOIN cities c        ON c.city_id      = pr.city_id
       LEFT JOIN countries co    ON co.country_id  = c.country_id
       LEFT JOIN preferences prf ON prf.user_id    = u.user_id
       LEFT JOIN relationship_goals rg ON rg.goal_id = prf.goal_id
       WHERE u.user_id = ?`,
      [targetId]
    );

    if (profileRows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = profileRows[0];

    const [photoRows] = await db.execute(
      `SELECT photo_url FROM user_photos WHERE user_id = ? ORDER BY display_order ASC, photo_id ASC`,
      [targetId]
    );

    const [sportRows] = await db.execute(
      `SELECT
         s.sport_name,
         sl.level_name,
         tf.frequency_label,
         us.years_experience
       FROM user_sports us
       JOIN sports s                ON s.sport_id        = us.sport_id
       JOIN skill_levels sl         ON sl.skill_level_id = us.skill_level_id
       JOIN training_frequencies tf ON tf.frequency_id   = us.frequency_id
       WHERE us.user_id = ?
       ORDER BY sl.sort_order DESC, us.sport_id ASC`,
      [targetId]
    );

    const [priorActions] = await db.execute(
      `SELECT
         ma.action_type,
         ma.previous_account_status,
         ma.new_account_status,
         ma.note,
         ma.created_at,
         admin.email AS admin_email
       FROM moderation_actions ma
       JOIN users admin ON admin.user_id = ma.admin_id
       WHERE ma.target_user_id = ?
       ORDER BY ma.created_at DESC
       LIMIT 20`,
      [targetId]
    );

    const { iconForSport } = require('../lib/sportIcons');
    const lastActiveMs = user.last_active ? new Date(user.last_active).getTime() : null;
    const isOnline = lastActiveMs !== null && (Date.now() - lastActiveMs) < 5 * 60 * 1000;

    const freqCounts = new Map();
    for (const s of sportRows) {
      freqCounts.set(s.frequency_label, (freqCounts.get(s.frequency_label) || 0) + 1);
    }
    const primaryFrequency = [...freqCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    res.json({
      id:               user.user_id,
      email:            user.email,
      accountStatus:    user.account_status,
      suspendedUntil:   user.suspended_until,
      suspensionReason: user.suspension_reason,
      createdAt:        user.created_at,
      lastActive:       user.last_active,
      isOnline,
      name:             user.first_name || null,
      age:              user.age || null,
      city:             user.city_name || null,
      country:          user.country_name || null,
      bio:              user.bio || null,
      goal:             user.goal_name || null,
      primaryFrequency,
      photos:           photoRows.map(p => p.photo_url),
      sports: sportRows.map(s => ({
        icon:            iconForSport(s.sport_name),
        name:            s.sport_name,
        level:           s.level_name,
        frequency:       s.frequency_label,
        yearsExperience: s.years_experience,
      })),
      priorActions,
    });
  } catch (error) {
    console.error('Error fetching admin user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

module.exports = router;
