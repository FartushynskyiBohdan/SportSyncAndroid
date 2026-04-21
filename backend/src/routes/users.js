const express = require('express');
const db      = require('../config/database');
const auth    = require('../middleware/auth');
const { iconForSport } = require('../lib/sportIcons');

const router = express.Router();

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

/* ─── Compatibility scoring helpers ─── */

// Jaccard similarity between two arrays of ids, as a percentage (0–100).
function sharedSportsPct(viewerSportIds, targetSportIds) {
  if (viewerSportIds.length === 0 || targetSportIds.length === 0) return 0;
  const a = new Set(viewerSportIds);
  const b = new Set(targetSportIds);
  const intersection = [...a].filter(id => b.has(id)).length;
  const unionSize = new Set([...a, ...b]).size;
  return Math.round((intersection / unionSize) * 100);
}

// Closer sort_order on training_frequencies = higher score. Missing data → 0.
function frequencyCompatPct(viewerOrder, targetOrder) {
  if (viewerOrder == null || targetOrder == null) return 0;
  const delta = Math.abs(viewerOrder - targetOrder);
  if (delta === 0) return 100;
  if (delta === 1) return 75;
  if (delta === 2) return 50;
  return 25;
}

// Same goal = 100; "soft" overlaps (Casual/Friendship) = 60; opposing = 30.
function goalAlignmentPct(viewerGoal, targetGoal) {
  if (!viewerGoal || !targetGoal) return 0;
  if (viewerGoal === targetGoal) return 100;

  const soft = new Set(['Casual', 'Friendship', 'Not sure']);
  if (soft.has(viewerGoal) && soft.has(targetGoal)) return 60;

  // One side "Serious" vs anything else → harder to align.
  return 30;
}

/* ─── GET /api/users/me ─── */
// declared before /users/:id so that express doesn't accidentally 
// match "me" as an :id

router.get('/users/me', auth, async (req, res) => {
  const userId = req.userId;

  try {
    const [profileRows] = await db.execute(
      `SELECT
         pr.user_id,
         pr.first_name,
         pr.bio,
         TIMESTAMPDIFF(YEAR, pr.birth_date, CURDATE()) AS age,
         c.city_name,
         co.country_name,
         u.last_active,
         rg.goal_name
       FROM profiles pr
       JOIN users u        ON u.user_id     = pr.user_id
       JOIN cities c       ON c.city_id     = pr.city_id
       JOIN countries co   ON co.country_id = c.country_id
       LEFT JOIN preferences prf       ON prf.user_id = pr.user_id
       LEFT JOIN relationship_goals rg ON rg.goal_id  = prf.goal_id
       WHERE pr.user_id = ?
         AND u.account_status = 'active'`,
      [userId]
    );

    if (profileRows.length === 0) {
      return res.status(404).json({ error: 'Profile not found.' });
    }
    const profile = profileRows[0];

    const [photoRows] = await db.execute(
      `SELECT photo_url
       FROM user_photos
       WHERE user_id = ?
       ORDER BY display_order ASC, photo_id ASC`,
      [userId]
    );

    const [sportRows] = await db.execute(
      `SELECT
         s.sport_name,
         sl.level_name,
         tf.frequency_label,
         tf.sort_order AS frequency_sort,
         us.years_experience
       FROM user_sports us
       JOIN sports s                ON s.sport_id         = us.sport_id
       JOIN skill_levels sl         ON sl.skill_level_id  = us.skill_level_id
       JOIN training_frequencies tf ON tf.frequency_id    = us.frequency_id
       WHERE us.user_id = ?
       ORDER BY sl.sort_order DESC, us.sport_id ASC`,
      [userId]
    );

    const freqCounts = new Map();
    for (const s of sportRows) {
      freqCounts.set(s.frequency_label, (freqCounts.get(s.frequency_label) || 0) + 1);
    }
    const primaryFrequency = [...freqCounts.entries()]
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    const lastActiveMs = profile.last_active
      ? new Date(profile.last_active).getTime()
      : null;
    const isOnline = lastActiveMs !== null && (Date.now() - lastActiveMs) < (5 * 60 * 1000);

    res.json({
      id:               profile.user_id,
      name:             profile.first_name,
      age:              profile.age,
      city:             profile.city_name,
      country:          profile.country_name,
      bio:              profile.bio,
      goal:             profile.goal_name,
      lastActive:       profile.last_active,
      isOnline,
      photos:           photoRows.map(p => p.photo_url),
      primaryFrequency,
      sports: sportRows.map(s => ({
        icon:            iconForSport(s.sport_name),
        name:            s.sport_name,
        level:           s.level_name,
        frequency:       s.frequency_label,
        yearsExperience: s.years_experience,
      })),
    });
  } catch (error) {
    console.error('Error fetching own profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

/* ─── GET /api/users/:id ─── */

router.get('/users/:id', auth, async (req, res) => {
  const viewerId = req.userId;
  const targetId = Number(req.params.id);

  if (!Number.isInteger(targetId) || targetId <= 0) {
    return res.status(400).json({ error: 'Invalid user id.' });
  }

  // Viewing your own route at /users/:id → tell the client to bounce to /profile.
  if (targetId === viewerId) {
    return res.status(409).json({ error: 'Self profile.', redirect: '/profile' });
  }

  try {
    // 1. Refuse to leak existence if the target has blocked the viewer.
    const [blockedByRows] = await db.execute(
      'SELECT 1 FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?',
      [targetId, viewerId]
    );
    if (blockedByRows.length > 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // 2. Core profile row (must be active + onboarded).
    const [profileRows] = await db.execute(
      `SELECT
         pr.user_id,
         pr.first_name,
         pr.bio,
         TIMESTAMPDIFF(YEAR, pr.birth_date, CURDATE()) AS age,
         c.city_name,
         co.country_name,
         u.last_active,
         rg.goal_name
       FROM profiles pr
       JOIN users u        ON u.user_id   = pr.user_id
       JOIN cities c       ON c.city_id   = pr.city_id
       JOIN countries co   ON co.country_id = c.country_id
       LEFT JOIN preferences prf      ON prf.user_id = pr.user_id
       LEFT JOIN relationship_goals rg ON rg.goal_id = prf.goal_id
       WHERE pr.user_id = ?
         AND u.account_status = 'active'
         AND u.onboarding_complete = TRUE`,
      [targetId]
    );

    if (profileRows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const profile = profileRows[0];

    // 3. Photos, ordered.
    const [photoRows] = await db.execute(
      `SELECT photo_url
       FROM user_photos
       WHERE user_id = ?
       ORDER BY display_order ASC, photo_id ASC`,
      [targetId]
    );

    // 4. Target's sports with skill + frequency labels.
    const [targetSportRows] = await db.execute(
      `SELECT
         us.sport_id,
         s.sport_name,
         sl.level_name,
         sl.sort_order   AS skill_sort,
         tf.frequency_id,
         tf.frequency_label,
         tf.sort_order   AS frequency_sort,
         us.years_experience
       FROM user_sports us
       JOIN sports s                ON s.sport_id         = us.sport_id
       JOIN skill_levels sl         ON sl.skill_level_id  = us.skill_level_id
       JOIN training_frequencies tf ON tf.frequency_id    = us.frequency_id
       WHERE us.user_id = ?
       ORDER BY sl.sort_order DESC, us.sport_id ASC`,
      [targetId]
    );

    // 5. Viewer's sports (ids + frequency) for compatibility math.
    const [viewerSportRows] = await db.execute(
      `SELECT us.sport_id, tf.sort_order AS frequency_sort
       FROM user_sports us
       JOIN training_frequencies tf ON tf.frequency_id = us.frequency_id
       WHERE us.user_id = ?`,
      [viewerId]
    );

    // 6. Viewer's goal for alignment comparison.
    const [viewerGoalRows] = await db.execute(
      `SELECT rg.goal_name
       FROM preferences prf
       JOIN relationship_goals rg ON rg.goal_id = prf.goal_id
       WHERE prf.user_id = ?`,
      [viewerId]
    );
    const viewerGoal = viewerGoalRows[0]?.goal_name ?? null;

    // 7. Relationship flags: already liked / passed / matched / blocked.
    const [[likeRow], [passRow], [matchRow], [blockRow]] = await Promise.all([
      db.execute(
        'SELECT 1 FROM likes WHERE liker_id = ? AND liked_id = ? LIMIT 1',
        [viewerId, targetId]
      ),
      db.execute(
        'SELECT 1 FROM passes WHERE passer_id = ? AND passed_id = ? LIMIT 1',
        [viewerId, targetId]
      ),
      db.execute(
        `SELECT match_id FROM matches
         WHERE (user1_id = ? AND user2_id = ?)
            OR (user1_id = ? AND user2_id = ?)
         LIMIT 1`,
        [
          Math.min(viewerId, targetId), Math.max(viewerId, targetId),
          Math.max(viewerId, targetId), Math.min(viewerId, targetId),
        ]
      ),
      db.execute(
        'SELECT 1 FROM blocked_users WHERE blocker_id = ? AND blocked_id = ? LIMIT 1',
        [viewerId, targetId]
      ),
    ]);

    // 8. Compose compatibility.
    const viewerSportIds = viewerSportRows.map(r => r.sport_id);
    const targetSportIds = targetSportRows.map(r => r.sport_id);
    const sharedIds = new Set(viewerSportIds.filter(id => targetSportIds.includes(id)));
    const sharedSportNames = targetSportRows
      .filter(s => sharedIds.has(s.sport_id))
      .map(s => s.sport_name);

    const viewerAvgFreq = viewerSportRows.length
      ? viewerSportRows.reduce((sum, r) => sum + r.frequency_sort, 0) / viewerSportRows.length
      : null;
    const targetAvgFreq = targetSportRows.length
      ? targetSportRows.reduce((sum, r) => sum + r.frequency_sort, 0) / targetSportRows.length
      : null;

    const sharedPct  = sharedSportsPct(viewerSportIds, targetSportIds);
    const freqPct    = frequencyCompatPct(viewerAvgFreq, targetAvgFreq);
    const goalPct    = goalAlignmentPct(viewerGoal, profile.goal_name);

    // 9. Primary frequency label (most common among target's sports).
    const freqCounts = new Map();
    for (const s of targetSportRows) {
      freqCounts.set(s.frequency_label, (freqCounts.get(s.frequency_label) || 0) + 1);
    }
    const primaryFrequency = [...freqCounts.entries()]
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    // 10. Shape response.
    const lastActiveMs = profile.last_active
      ? new Date(profile.last_active).getTime()
      : null;
    const isOnline = lastActiveMs !== null && (Date.now() - lastActiveMs) < ONLINE_WINDOW_MS;

    res.json({
      id:         profile.user_id,
      name:       profile.first_name,
      age:        profile.age,
      city:       profile.city_name,
      country:    profile.country_name,
      bio:        profile.bio,
      goal:       profile.goal_name,
      lastActive: profile.last_active,
      isOnline,
      photos:     photoRows.map(p => p.photo_url),
      primaryFrequency,
      sports: targetSportRows.map(s => ({
        icon:            iconForSport(s.sport_name),
        name:            s.sport_name,
        level:           s.level_name,
        frequency:       s.frequency_label,
        yearsExperience: s.years_experience,
      })),
      compatibility: {
        sharedSports: {
          pct:    sharedPct,
          detail: sharedSportNames.length > 0
            ? sharedSportNames.join(', ')
            : 'None in common',
        },
        trainingFrequency: {
          pct:    freqPct,
          detail: freqPct >= 75 ? 'Very close'
                : freqPct >= 50 ? 'Close match'
                : freqPct >  0  ? 'Some difference'
                :                 'Unknown',
        },
        goalAlignment: {
          pct:    goalPct,
          detail: profile.goal_name || 'Not specified',
        },
      },
      relation: {
        isSelf:       false,
        alreadyLiked: likeRow.length > 0,
        alreadyPassed: passRow.length > 0,
        matched:      matchRow.length > 0,
        matchId:      matchRow[0]?.match_id ?? null,
        blockedByMe:  blockRow.length > 0,
      },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

/* ─── GET /api/complaint-types ─── */

router.get('/complaint-types', auth, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT type_id AS id, type_name AS name FROM complaint_types');
    res.json({ types: rows });
  } catch (error) {
    console.error('Error fetching complaint types:', error);
    res.status(500).json({ error: 'Failed to fetch complaint types.' });
  }
});

/* ─── POST /api/users/:id/report ─── */

router.post('/users/:id/report', auth, async (req, res) => {
  const reporterId = req.userId;
  const reportedId = Number(req.params.id);
  const { typeId, description } = req.body;

  if (!Number.isInteger(reportedId) || reportedId <= 0) {
    return res.status(400).json({ error: 'Invalid user id.' });
  }
  if (reportedId === reporterId) {
    return res.status(400).json({ error: 'You cannot report yourself.' });
  }
  if (!Number.isInteger(typeId)) {
    return res.status(400).json({ error: 'typeId is required and must be an integer.' });
  }
  if (description && typeof description === 'string' && description.length > 500) {
    return res.status(400).json({ error: 'Description must be 500 characters or fewer.' });
  }

  try {
    // Validate typeId exists
    const [typeRows] = await db.execute('SELECT 1 FROM complaint_types WHERE type_id = ?', [typeId]);
    if (typeRows.length === 0) {
      return res.status(400).json({ error: 'Invalid complaint type.' });
    }

    // Validate target user exists
    const [userRows] = await db.execute('SELECT 1 FROM users WHERE user_id = ? AND account_status = "active"', [reportedId]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Check for duplicate unresolved complaint
    const [dupRows] = await db.execute(
      `SELECT 1 FROM complaints c
       JOIN complaint_statuses cs ON cs.status_id = c.status_id
       WHERE c.reporter_id = ? AND c.reported_id = ?
         AND cs.status_name IN ('Pending', 'Under Review')
       LIMIT 1`,
      [reporterId, reportedId]
    );
    if (dupRows.length > 0) {
      return res.status(409).json({ error: 'You have already reported this user.' });
    }

    // Look up Pending status_id
    const [statusRows] = await db.execute(
      "SELECT status_id FROM complaint_statuses WHERE status_name = 'Pending' LIMIT 1"
    );
    const pendingStatusId = statusRows[0].status_id;

    // Insert complaint
    const [result] = await db.execute(
      `INSERT INTO complaints (reporter_id, reported_id, type_id, description, status_id, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [reporterId, reportedId, typeId, description || null, pendingStatusId]
    );

    res.status(201).json({ message: 'Report submitted.', complaintId: result.insertId });
  } catch (error) {
    console.error('Error submitting report:', error);
    res.status(500).json({ error: 'Failed to submit report.' });
  }
});

/* ─── POST /api/users/:id/block ─── */

router.post('/users/:id/block', auth, async (req, res) => {
  const blockerId = req.userId;
  const blockedId = Number(req.params.id);

  if (!Number.isInteger(blockedId) || blockedId <= 0) {
    return res.status(400).json({ error: 'Invalid user id.' });
  }
  if (blockedId === blockerId) {
    return res.status(400).json({ error: 'You cannot block yourself.' });
  }

  try {
    // Validate target user exists
    const [userRows] = await db.execute('SELECT 1 FROM users WHERE user_id = ?', [blockedId]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Check if already blocked
    const [existingRows] = await db.execute(
      'SELECT 1 FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?',
      [blockerId, blockedId]
    );
    if (existingRows.length > 0) {
      return res.status(409).json({ error: 'User is already blocked.' });
    }

    // Insert block
    await db.execute(
      'INSERT INTO blocked_users (blocker_id, blocked_id, created_at) VALUES (?, ?, NOW())',
      [blockerId, blockedId]
    );

    // Side effects: clean up matches, likes, passes between the two users
    const minId = Math.min(blockerId, blockedId);
    const maxId = Math.max(blockerId, blockedId);

    await Promise.all([
      db.execute(
        'DELETE FROM matches WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)',
        [minId, maxId, maxId, minId]
      ),
      db.execute(
        'DELETE FROM likes WHERE (liker_id = ? AND liked_id = ?) OR (liker_id = ? AND liked_id = ?)',
        [blockerId, blockedId, blockedId, blockerId]
      ),
      db.execute(
        'DELETE FROM passes WHERE (passer_id = ? AND passed_id = ?) OR (passer_id = ? AND passed_id = ?)',
        [blockerId, blockedId, blockedId, blockerId]
      ),
    ]);

    res.status(201).json({ message: 'User blocked.' });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ error: 'Failed to block user.' });
  }
});

/* ─── DELETE /api/users/:id/block ─── */

router.delete('/users/:id/block', auth, async (req, res) => {
  const blockerId = req.userId;
  const blockedId = Number(req.params.id);

  if (!Number.isInteger(blockedId) || blockedId <= 0) {
    return res.status(400).json({ error: 'Invalid user id.' });
  }

  try {
    const [result] = await db.execute(
      'DELETE FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?',
      [blockerId, blockedId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Block not found.' });
    }
    res.json({ message: 'User unblocked.' });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ error: 'Failed to unblock user.' });
  }
});

/* ─── GET /api/blocked-users ─── */

router.get('/blocked-users', auth, async (req, res) => {
  const userId = req.userId;

  try {
    const [rows] = await db.execute(
      `SELECT
         bu.blocked_id   AS userId,
         pr.first_name   AS name,
         ci.city_name    AS city,
         co.country_name AS country,
         (SELECT up.photo_url
          FROM user_photos up
          WHERE up.user_id = bu.blocked_id
          ORDER BY up.display_order ASC, up.photo_id ASC
          LIMIT 1)       AS photo,
         bu.created_at   AS blockedAt
       FROM blocked_users bu
       JOIN profiles pr  ON pr.user_id    = bu.blocked_id
       JOIN cities ci    ON ci.city_id    = pr.city_id
       JOIN countries co ON co.country_id = ci.country_id
       WHERE bu.blocker_id = ?
       ORDER BY bu.created_at DESC`,
      [userId]
    );

    res.json({ blockedUsers: rows });
  } catch (error) {
    console.error('Error fetching blocked users:', error);
    res.status(500).json({ error: 'Failed to fetch blocked users.' });
  }
});

module.exports = router;
