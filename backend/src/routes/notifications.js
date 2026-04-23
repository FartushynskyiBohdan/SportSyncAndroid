const express = require('express');
const db = require('../config/database');
const auth = require('../middleware/auth');
const { authFromQuery } = require('../middleware/auth');
const sseHub = require('../lib/sseHub');
const { shape } = require('../lib/notificationService');

const router = express.Router();

const LIST_LIMIT = 50;

// Same hydration query as notificationService, but for many rows.
const LIST_SQL = `
  SELECT
    n.notification_id,
    n.user_id,
    n.message,
    n.is_read,
    n.created_at,
    n.match_id,
    n.message_id,
    n.complaint_id,
    nt.type_name,
    peer.user_id    AS peer_id,
    peer_profile.first_name AS peer_name,
    peer_photo.photo_url    AS peer_photo
  FROM notifications n
  JOIN notification_types nt ON nt.type_id = n.type_id
  LEFT JOIN matches m
    ON m.match_id = n.match_id
  LEFT JOIN messages msg
    ON msg.message_id = n.message_id
  LEFT JOIN users peer
    ON peer.user_id = CASE
      WHEN n.match_id IS NOT NULL
        THEN IF(m.user1_id = n.user_id, m.user2_id, m.user1_id)
      WHEN n.message_id IS NOT NULL
        THEN msg.sender_id
      ELSE NULL
    END
  LEFT JOIN profiles peer_profile ON peer_profile.user_id = peer.user_id
  LEFT JOIN (
    SELECT up.user_id, up.photo_url
    FROM user_photos up
    INNER JOIN (
      SELECT user_id, MIN(display_order) AS min_order
      FROM user_photos
      GROUP BY user_id
    ) first_photo
      ON first_photo.user_id = up.user_id
     AND first_photo.min_order = up.display_order
  ) peer_photo ON peer_photo.user_id = peer.user_id
  WHERE n.user_id = ?
  ORDER BY n.created_at DESC, n.notification_id DESC
  LIMIT ${LIST_LIMIT}
`;

router.get('/notifications', auth, async (req, res) => {
  try {
    const [rows] = await db.execute(LIST_SQL, [req.userId]);
    res.json(rows.map(shape));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

router.get('/notifications/stream', authFromQuery, (req, res) => {
  sseHub.subscribe(req.userId, res);
});

router.patch('/notifications/:id/read', auth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid notification id.' });
  }

  try {
    const [result] = await db.execute(
      'UPDATE notifications SET is_read = TRUE WHERE notification_id = ? AND user_id = ?',
      [id, req.userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Notification not found.' });
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ error: 'Failed to mark notification read.' });
  }
});

router.patch('/notifications/read-all', auth, async (req, res) => {
  try {
    await db.execute(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [req.userId]
    );
    res.json({ ok: true });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    res.status(500).json({ error: 'Failed to mark notifications read.' });
  }
});

module.exports = router;
