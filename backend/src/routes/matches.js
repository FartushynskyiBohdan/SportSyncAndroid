const express = require('express');
const db      = require('../config/database');
const auth    = require('../middleware/auth');

const router = express.Router();

/* ─── Sport emoji map (mirrors discover.js) ─── */

const SPORT_ICONS = {
  Football:        '⚽',
  Basketball:      '🏀',
  Rugby:           '🏉',
  Volleyball:      '🏐',
  Hockey:          '🏒',
  Boxing:          '🥊',
  MMA:             '🥋',
  CrossFit:        '🏋️',
  Swimming:        '🏊',
  Surfing:         '🏄',
  Rowing:          '🚣',
  Running:         '🏃',
  'Trail Running': '🥾',
  Cycling:         '🚴',
  Triathlon:       '🏅',
  Skiing:          '⛷️',
  Tennis:          '🎾',
  Golf:            '⛳',
  Gymnastics:      '🤸',
  Yoga:            '🧘',
  'Rock Climbing': '🧗',
  Hiking:          '🥾',
};

// Online window: a user is "online" if last_active is within 5 minutes
const ONLINE_WINDOW_MS = 5 * 60 * 1000;

/* ─── GET /api/matches ─── */

router.get('/matches', auth, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Authentication required.' });

    // 1. Load all matches the user is part of, picking out the "other" user_id
    const [matchRows] = await db.execute(
      `SELECT
         m.match_id,
         m.matched_at,
         IF(m.user1_id = ?, m.user2_id, m.user1_id) AS other_user_id
       FROM matches m
       WHERE (m.user1_id = ? OR m.user2_id = ?)
         AND EXISTS (
           SELECT 1 FROM users u
           WHERE u.user_id = IF(m.user1_id = ?, m.user2_id, m.user1_id)
             AND u.account_status = 'active'
         )
       ORDER BY m.matched_at DESC`,
      [userId, userId, userId, userId]
    );

    if (matchRows.length === 0) {
      return res.json([]);
    }

    const otherUserIds = matchRows.map(r => r.other_user_id);
    const idPlaceholders = otherUserIds.map(() => '?').join(',');

    // 2. Batch-fetch profile + last_active for every other user
    const [profileRows] = await db.execute(
      `SELECT
         pr.user_id,
         pr.first_name,
         TIMESTAMPDIFF(YEAR, pr.birth_date, CURDATE()) AS age,
         c.city_name,
         u.last_active
       FROM profiles pr
       JOIN users u  ON u.user_id  = pr.user_id
       JOIN cities c ON c.city_id  = pr.city_id
       WHERE pr.user_id IN (${idPlaceholders})`,
      otherUserIds
    );
    const profileById = Object.fromEntries(profileRows.map(p => [p.user_id, p]));

    // 3. Batch-fetch primary photo (lowest display_order) per user
    const [photoRows] = await db.execute(
      `SELECT up.user_id, up.photo_url
       FROM user_photos up
       INNER JOIN (
         SELECT user_id, MIN(display_order) AS min_order
         FROM user_photos
         WHERE user_id IN (${idPlaceholders})
         GROUP BY user_id
       ) first ON first.user_id = up.user_id AND first.min_order = up.display_order`,
      otherUserIds
    );
    const photoByUser = Object.fromEntries(photoRows.map(p => [p.user_id, p.photo_url]));

    // 4. Batch-fetch primary sport (lowest sport_id) per user
    const [sportRows] = await db.execute(
      `SELECT us.user_id, s.sport_name
       FROM user_sports us
       JOIN sports s ON s.sport_id = us.sport_id
       INNER JOIN (
         SELECT user_id, MIN(sport_id) AS min_sport
         FROM user_sports
         WHERE user_id IN (${idPlaceholders})
         GROUP BY user_id
       ) first ON first.user_id = us.user_id AND first.min_sport = us.sport_id`,
      otherUserIds
    );
    const primarySportByUser = Object.fromEntries(sportRows.map(s => [s.user_id, s.sport_name]));

    // 5. Compute shared-sports count per other user (single grouped query)
    const [sharedRows] = await db.execute(
      `SELECT us2.user_id AS other_user_id, COUNT(DISTINCT us1.sport_id) AS shared_count
       FROM user_sports us1
       INNER JOIN user_sports us2 ON us2.sport_id = us1.sport_id
       WHERE us1.user_id = ?
         AND us2.user_id IN (${idPlaceholders})
       GROUP BY us2.user_id`,
      [userId, ...otherUserIds]
    );
    const sharedByUser = Object.fromEntries(sharedRows.map(s => [s.other_user_id, Number(s.shared_count)]));

    // 6. Shape the response
    const now = Date.now();
    const results = matchRows
      .map(m => {
        const profile = profileById[m.other_user_id];
        if (!profile) return null; // defensive — profile may have been deleted between queries

        const sportName = primarySportByUser[m.other_user_id] || null;
        const lastActiveMs = profile.last_active ? new Date(profile.last_active).getTime() : null;

        return {
          matchId:      m.match_id,
          matchedAt:    m.matched_at,
          userId:       profile.user_id,
          name:         profile.first_name,
          age:          profile.age,
          city:         profile.city_name,
          lastActive:   profile.last_active, // ISO timestamp; client formats for display
          isOnline:     lastActiveMs !== null && (now - lastActiveMs) < ONLINE_WINDOW_MS,
          sport: sportName
            ? { icon: SPORT_ICONS[sportName] || '🏅', name: sportName }
            : null,
          image:        photoByUser[m.other_user_id] || '',
          sharedSports: sharedByUser[m.other_user_id] || 0,
        };
      })
      .filter(Boolean);

    res.json(results);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches.' });
  }
});

module.exports = router;
