const db = require('../config/database');
const sseHub = require('./sseHub');

// Build the shaped payload the frontend consumes (same shape for SSE + list API).
async function hydrateNotification(conn, notificationId) {
  const [rows] = await conn.execute(
    `SELECT
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
     WHERE n.notification_id = ?`,
    [notificationId]
  );

  if (rows.length === 0) return null;
  return shape(rows[0]);
}

function shape(row) {
  const peer = row.peer_id
    ? { id: row.peer_id, name: row.peer_name || null, photoUrl: row.peer_photo || null }
    : null;
  return {
    id: row.notification_id,
    userId: row.user_id,
    type: row.type_name,
    message: row.message,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at,
    matchId: row.match_id,
    messageId: row.message_id,
    complaintId: row.complaint_id,
    peer,
  };
}

// Insert a notification row inside the caller's transaction (conn).
// Returns the new notification_id. Callers should commit, then call broadcast().
async function createNotification(conn, { userId, typeName, matchId = null, messageId = null, complaintId = null, message }) {
  const [typeRows] = await conn.execute(
    'SELECT type_id FROM notification_types WHERE type_name = ? LIMIT 1',
    [typeName]
  );
  const typeId = typeRows[0]?.type_id;
  if (!typeId) return null;

  const [result] = await conn.execute(
    `INSERT INTO notifications (user_id, type_id, match_id, message_id, complaint_id, message)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, typeId, matchId, messageId, complaintId, message]
  );
  return result.insertId;
}

// Fetch the hydrated payload and push it over SSE. Safe to call after commit.
async function broadcast(notificationId) {
  if (!notificationId) return null;
  const payload = await hydrateNotification(db, notificationId);
  if (payload) {
    sseHub.publish(payload.userId, 'notification', payload);
  }
  return payload;
}

module.exports = { createNotification, broadcast, hydrateNotification, shape };
