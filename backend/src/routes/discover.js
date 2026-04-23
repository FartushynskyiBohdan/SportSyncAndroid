const express = require('express');
const db      = require('../config/database');
const auth    = require('../middleware/auth');
const { iconForSport } = require('../lib/sportIcons');
const notificationService = require('../lib/notificationService');

const router = express.Router();

/* ─── Tag helper ─── */

function getTag(createdAt, lastActive) {
  const now = new Date();
  const created = new Date(createdAt);

  // "New today" if account was created today
  if (created.toDateString() === now.toDateString()) return 'New today';

  // "Recently active" if last_active within 24 hours
  if (lastActive) {
    const diff = now - new Date(lastActive);
    if (diff < 24 * 60 * 60 * 1000) return 'Recently active';
  }

  return null;
}

/* ─── GET /api/discover ─── */

router.get('/discover', auth, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Authentication required.' });

    // 1. Load user's preferences
    const [prefRows] = await db.execute(
      `SELECT gender_id, min_age, max_age, max_distance_km,
              min_skill_level_id, preferred_frequency_id, min_photos, show_out_of_range
       FROM preferences WHERE user_id = ?`,
      [userId]
    );

    if (prefRows.length === 0) {
      return res.status(400).json({ error: 'Please complete your preferences first.' });
    }

    const pref = prefRows[0];

    // Load preferred sports
    const [prefSportRows] = await db.execute(
      'SELECT sport_id FROM preference_sports WHERE user_id = ?',
      [userId]
    );
    const prefSportIds = prefSportRows.map(r => r.sport_id);

    // 2. Build the discovery query
    let sql = `
      SELECT
        pr.user_id,
        pr.first_name,
        TIMESTAMPDIFF(YEAR, pr.birth_date, CURDATE()) AS age,
        c.city_name,
        pr.bio,
        u.last_active,
        u.created_at,
        rg.goal_name
      FROM profiles pr
      JOIN users u ON u.user_id = pr.user_id
      JOIN cities c ON c.city_id = pr.city_id
      LEFT JOIN preferences prf ON prf.user_id = pr.user_id
      LEFT JOIN relationship_goals rg ON rg.goal_id = prf.goal_id
      WHERE pr.user_id != ?
        AND u.account_status = 'active'
        AND u.onboarding_complete = TRUE
        AND pr.gender_id = ?
        AND TIMESTAMPDIFF(YEAR, pr.birth_date, CURDATE()) BETWEEN ? AND ?
        AND pr.user_id NOT IN (SELECT liked_id  FROM likes         WHERE liker_id   = ?)
        AND pr.user_id NOT IN (SELECT passed_id FROM passes        WHERE passer_id  = ?)
        AND pr.user_id NOT IN (SELECT blocked_id FROM blocked_users WHERE blocker_id = ?)
        AND pr.user_id NOT IN (SELECT blocker_id FROM blocked_users WHERE blocked_id = ?)
    `;

    const params = [
      userId,
      pref.gender_id,
      pref.min_age,
      pref.max_age,
      userId, // likes
      userId, // passes
      userId, // blocked (as blocker)
      userId, // blocked (as blocked)
    ];

    // Sports overlap filter
    if (prefSportIds.length > 0) {
      const placeholders = prefSportIds.map(() => '?').join(',');
      sql += ` AND pr.user_id IN (SELECT us.user_id FROM user_sports us WHERE us.sport_id IN (${placeholders}))`;
      params.push(...prefSportIds);
    }

    // Minimum skill level filter
    if (pref.min_skill_level_id) {
      sql += ` AND pr.user_id IN (SELECT us.user_id FROM user_sports us WHERE us.skill_level_id >= ?)`;
      params.push(pref.min_skill_level_id);
    }

    // Preferred frequency filter
    if (pref.preferred_frequency_id) {
      sql += ` AND pr.user_id IN (SELECT us.user_id FROM user_sports us WHERE us.frequency_id >= ?)`;
      params.push(pref.preferred_frequency_id);
    }

    // Minimum photos filter
    if (pref.min_photos && pref.min_photos > 0) {
      sql += ` AND (SELECT COUNT(*) FROM user_photos up WHERE up.user_id = pr.user_id) >= ?`;
      params.push(pref.min_photos);
    }

    sql += ` ORDER BY u.last_active DESC LIMIT 50`;

    const [profiles] = await db.execute(sql, params);

    if (profiles.length === 0) {
      return res.json([]);
    }

    // 3. Batch-fetch sports and photos for all matched profiles
    const userIds = profiles.map(p => p.user_id);
    const idPlaceholders = userIds.map(() => '?').join(',');

    const [sportsRows] = await db.execute(
      `SELECT us.user_id, s.sport_name, sl.level_name, tf.frequency_label
       FROM user_sports us
       JOIN sports s ON s.sport_id = us.sport_id
       JOIN skill_levels sl ON sl.skill_level_id = us.skill_level_id
       JOIN training_frequencies tf ON tf.frequency_id = us.frequency_id
       WHERE us.user_id IN (${idPlaceholders})`,
      userIds
    );

    const [photosRows] = await db.execute(
      `SELECT user_id, photo_url, display_order
       FROM user_photos
       WHERE user_id IN (${idPlaceholders})
       ORDER BY display_order ASC`,
      userIds
    );

    // Group by user_id
    const sportsByUser = {};
    for (const row of sportsRows) {
      if (!sportsByUser[row.user_id]) sportsByUser[row.user_id] = [];
      sportsByUser[row.user_id].push(row);
    }

    const photosByUser = {};
    for (const row of photosRows) {
      if (!photosByUser[row.user_id]) photosByUser[row.user_id] = [];
      photosByUser[row.user_id].push(row);
    }

    // 4. Shape the response
    const results = profiles.map(p => {
      const userSports = sportsByUser[p.user_id] || [];
      const userPhotos = photosByUser[p.user_id] || [];

      return {
        id:        p.user_id,
        name:      p.first_name,
        age:       p.age,
        distance:  'Nearby',  // placeholder until distance calculation is implemented
        image:     userPhotos[0]?.photo_url || '',
        sports:    userSports.map(s => ({
          icon:  iconForSport(s.sport_name),
          name:  s.sport_name,
          level: s.level_name,
        })),
        frequency: userSports[0]?.frequency_label || '',
        goal:      p.goal_name || '',
        tag:       getTag(p.created_at, p.last_active),
        photos:    userPhotos.map(ph => ph.photo_url),
      };
    });

    res.json(results);
  } catch (error) {
    console.error('Error fetching discovery profiles:', error);
    res.status(500).json({ error: 'Failed to fetch profiles.' });
  }
});

/* ─── POST /api/discover/like/:id ─── */

router.post('/discover/like/:id', auth, async (req, res) => {
  const userId = req.userId;
  const likedId = Number(req.params.id);

  if (!userId) return res.status(401).json({ error: 'Authentication required.' });
  if (!Number.isInteger(likedId) || likedId <= 0) {
    return res.status(400).json({ error: 'Invalid user id.' });
  }
  if (likedId === userId) {
    return res.status(400).json({ error: 'Cannot like yourself.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Verify target exists and is active
    const [targetRows] = await conn.execute(
      `SELECT user_id FROM users
       WHERE user_id = ? AND account_status = 'active'`,
      [likedId]
    );
    if (targetRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'User not found.' });
    }

    // Remove any prior pass on this user so the like takes precedence
    await conn.execute(
      'DELETE FROM passes WHERE passer_id = ? AND passed_id = ?',
      [userId, likedId]
    );

    // Insert the like (idempotent via IGNORE on the unique constraint)
    await conn.execute(
      'INSERT IGNORE INTO likes (liker_id, liked_id) VALUES (?, ?)',
      [userId, likedId]
    );

    // Check for reciprocal like
    const [reciprocal] = await conn.execute(
      'SELECT 1 FROM likes WHERE liker_id = ? AND liked_id = ?',
      [likedId, userId]
    );

    let matched = false;
    let matchId = null;
    let viewerNotificationId = null;
    let peerNotificationId = null;

    if (reciprocal.length > 0) {
      // Normalize so user1_id < user2_id to satisfy uq_matches
      const [user1, user2] = userId < likedId ? [userId, likedId] : [likedId, userId];

      await conn.execute(
        'INSERT IGNORE INTO matches (user1_id, user2_id) VALUES (?, ?)',
        [user1, user2]
      );

      const [matchRows] = await conn.execute(
        'SELECT match_id FROM matches WHERE user1_id = ? AND user2_id = ?',
        [user1, user2]
      );
      matched = true;
      matchId = matchRows[0]?.match_id ?? null;

      if (matchId) {
        // One notification per user — each gets a row referencing the new match.
        viewerNotificationId = await notificationService.createNotification(conn, {
          userId,
          typeName: 'new_match',
          matchId,
          message: 'You have a new match!',
        });
        peerNotificationId = await notificationService.createNotification(conn, {
          userId: likedId,
          typeName: 'new_match',
          matchId,
          message: 'You have a new match!',
        });
      }
    }

    await conn.commit();

    // Broadcast after commit so the payload reflects committed state.
    if (viewerNotificationId) await notificationService.broadcast(viewerNotificationId);
    if (peerNotificationId) await notificationService.broadcast(peerNotificationId);

    res.json({ matched, matchId });
  } catch (error) {
    await conn.rollback();
    console.error('Error recording like:', error);
    res.status(500).json({ error: 'Failed to record like.' });
  } finally {
    conn.release();
  }
});

/* ─── POST /api/discover/pass/:id ─── */

router.post('/discover/pass/:id', auth, async (req, res) => {
  const userId = req.userId;
  const passedId = Number(req.params.id);

  if (!userId) return res.status(401).json({ error: 'Authentication required.' });
  if (!Number.isInteger(passedId) || passedId <= 0) {
    return res.status(400).json({ error: 'Invalid user id.' });
  }
  if (passedId === userId) {
    return res.status(400).json({ error: 'Cannot pass on yourself.' });
  }

  try {
    const [targetRows] = await db.execute(
      `SELECT user_id FROM users
       WHERE user_id = ? AND account_status = 'active'`,
      [passedId]
    );
    if (targetRows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await db.execute(
      'INSERT IGNORE INTO passes (passer_id, passed_id) VALUES (?, ?)',
      [userId, passedId]
    );

    res.json({ ok: true });
  } catch (error) {
    console.error('Error recording pass:', error);
    res.status(500).json({ error: 'Failed to record pass.' });
  }
});

module.exports = router;
