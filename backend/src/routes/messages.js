const express = require('express');
const db = require('../config/database');
const auth = require('../middleware/auth');
const notificationService = require('../lib/notificationService');
const sseHub = require('../lib/sseHub');

const router = express.Router();

function parseMatchId(value) {
  const matchId = Number(value);
  if (!Number.isInteger(matchId) || matchId <= 0) {
    return null;
  }
  return matchId;
}

async function getMatchForUser(connection, matchId, userId) {
  const [rows] = await connection.execute(
    `SELECT match_id, user1_id, user2_id
     FROM matches
     WHERE match_id = ?
       AND (user1_id = ? OR user2_id = ?)`,
    [matchId, userId, userId]
  );

  if (rows.length === 0) {
    return null;
  }

  const match = rows[0];
  return {
    matchId: match.match_id,
    otherUserId: match.user1_id === userId ? match.user2_id : match.user1_id,
  };
}

// GET /api/messages/conversations
router.get('/messages/conversations', auth, async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const [rows] = await db.execute(
      `SELECT
         m.match_id,
         m.matched_at,
         other_user.user_id AS user_id,
         p.first_name,
         TIMESTAMPDIFF(YEAR, p.birth_date, CURDATE()) AS age,
         c.city_name,
         other_user.last_active,
         photo.photo_url,
         last_msg.message_text AS last_message_text,
         last_msg.sent_at AS last_message_sent_at,
         last_msg.sender_id AS last_message_sender_id,
         COALESCE(unread.unread_count, 0) AS unread_count
       FROM matches m
       JOIN users other_user
         ON other_user.user_id = IF(m.user1_id = ?, m.user2_id, m.user1_id)
       JOIN profiles p ON p.user_id = other_user.user_id
       JOIN cities c ON c.city_id = p.city_id
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
       ) photo ON photo.user_id = other_user.user_id
       LEFT JOIN (
         SELECT msg.match_id, msg.message_text, msg.sent_at, msg.sender_id
         FROM messages msg
         INNER JOIN (
           SELECT match_id, MAX(message_id) AS max_message_id
           FROM messages
           GROUP BY match_id
         ) latest ON latest.max_message_id = msg.message_id
       ) last_msg ON last_msg.match_id = m.match_id
       LEFT JOIN (
         SELECT match_id, COUNT(*) AS unread_count
         FROM messages
         WHERE sender_id != ? AND read_at IS NULL
         GROUP BY match_id
       ) unread ON unread.match_id = m.match_id
       WHERE (m.user1_id = ? OR m.user2_id = ?)
         AND other_user.account_status = 'active'
       ORDER BY COALESCE(last_msg.sent_at, m.matched_at) DESC`,
      [userId, userId, userId, userId]
    );

    const now = Date.now();
    const onlineWindowMs = 5 * 60 * 1000;

    const conversations = rows.map((row) => {
      const lastActiveMs = row.last_active ? new Date(row.last_active).getTime() : null;
      return {
        matchId: row.match_id,
        matchedAt: row.matched_at,
        user: {
          id: row.user_id,
          name: row.first_name,
          age: row.age,
          city: row.city_name,
          image: row.photo_url || '',
          isOnline: lastActiveMs !== null && (now - lastActiveMs) < onlineWindowMs,
          lastActive: row.last_active,
        },
        lastMessage: row.last_message_text,
        lastMessageSentAt: row.last_message_sent_at,
        lastMessageSenderId: row.last_message_sender_id,
        unreadCount: Number(row.unread_count),
      };
    });

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations.' });
  }
});

// GET /api/messages/:matchId
router.get('/messages/:matchId', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const matchId = parseMatchId(req.params.matchId);

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!matchId) {
      return res.status(400).json({ error: 'Invalid match id.' });
    }

    const match = await getMatchForUser(db, matchId, userId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found.' });
    }

    const [peerRows] = await db.execute(
      `SELECT
         u.user_id,
         p.first_name,
         TIMESTAMPDIFF(YEAR, p.birth_date, CURDATE()) AS age,
         c.city_name,
         u.last_active,
         photo.photo_url
       FROM users u
       JOIN profiles p ON p.user_id = u.user_id
       JOIN cities c ON c.city_id = p.city_id
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
       ) photo ON photo.user_id = u.user_id
       WHERE u.user_id = ?`,
      [match.otherUserId]
    );

    const peer = peerRows[0] || null;

    const [messageRows] = await db.execute(
      `SELECT message_id, sender_id, message_text, sent_at, read_at
       FROM messages
       WHERE match_id = ?
       ORDER BY sent_at ASC, message_id ASC`,
      [matchId]
    );

    await db.execute(
      `UPDATE messages
       SET read_at = NOW()
       WHERE match_id = ? AND sender_id != ? AND read_at IS NULL`,
      [matchId, userId]
    );

    const messages = messageRows.map((row) => ({
      id: row.message_id,
      senderId: row.sender_id,
      text: row.message_text,
      sentAt: row.sent_at,
      readAt: row.read_at,
    }));

    res.json({
      matchId,
      peer,
      messages,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// POST /api/messages/:matchId
router.post('/messages/:matchId', auth, async (req, res) => {
  const userId = req.userId;
  const matchId = parseMatchId(req.params.matchId);
  const text = String(req.body?.text || '').trim();

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (!matchId) {
    return res.status(400).json({ error: 'Invalid match id.' });
  }
  if (!text) {
    return res.status(400).json({ error: 'Message text is required.' });
  }
  if (text.length > 2000) {
    return res.status(400).json({ error: 'Message is too long (max 2000 chars).' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const match = await getMatchForUser(connection, matchId, userId);
    if (!match) {
      await connection.rollback();
      return res.status(404).json({ error: 'Match not found.' });
    }

    const [insertResult] = await connection.execute(
      'INSERT INTO messages (match_id, sender_id, message_text) VALUES (?, ?, ?)',
      [matchId, userId, text]
    );

    const messageId = insertResult.insertId;

    const notificationId = await notificationService.createNotification(connection, {
      userId: match.otherUserId,
      typeName: 'new_message',
      messageId,
      message: 'You have a new message.',
    });

    await connection.commit();

    const [rows] = await db.execute(
      `SELECT message_id, sender_id, message_text, sent_at, read_at
       FROM messages
       WHERE message_id = ?`,
      [messageId]
    );

    const message = rows[0];
    const payload = {
      id: message.message_id,
      senderId: message.sender_id,
      text: message.message_text,
      sentAt: message.sent_at,
      readAt: message.read_at,
    };

    if (notificationId) {
      notificationService.broadcast(notificationId).catch((err) => {
        console.error('Error broadcasting message notification:', err);
      });
    }

    sseHub.publish(match.otherUserId, 'message', { matchId, message: payload });

    res.status(201).json(payload);
  } catch (error) {
    await connection.rollback();
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message.' });
  } finally {
    connection.release();
  }
});

// PATCH /api/messages/:matchId/read
router.patch('/messages/:matchId/read', auth, async (req, res) => {
  const userId = req.userId;
  const matchId = parseMatchId(req.params.matchId);

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (!matchId) {
    return res.status(400).json({ error: 'Invalid match id.' });
  }

  try {
    const match = await getMatchForUser(db, matchId, userId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found.' });
    }

    await db.execute(
      `UPDATE messages
       SET read_at = NOW()
       WHERE match_id = ? AND sender_id != ? AND read_at IS NULL`,
      [matchId, userId]
    );

    res.json({ ok: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read.' });
  }
});

// DELETE /api/messages/:matchId
router.delete('/messages/:matchId', auth, async (req, res) => {
  const userId = req.userId;
  const matchId = parseMatchId(req.params.matchId);

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (!matchId) {
    return res.status(400).json({ error: 'Invalid match id.' });
  }

  try {
    const match = await getMatchForUser(db, matchId, userId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found.' });
    }

    await db.execute('DELETE FROM messages WHERE match_id = ?', [matchId]);

    // Realtime sync for both participants (including other open tabs of initiator).
    const payload = { matchId };
    sseHub.publish(userId, 'chat_cleared', payload);
    sseHub.publish(match.otherUserId, 'chat_cleared', payload);

    res.json({ ok: true });
  } catch (error) {
    console.error('Error clearing chat messages:', error);
    res.status(500).json({ error: 'Failed to clear chat.' });
  }
});

module.exports = router;
