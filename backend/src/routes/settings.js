const express = require('express');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const isEmail = require('validator/lib/isEmail');
const db = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();
const sensitiveSettingsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.userId ?? req.ip),
  message: { error: 'Too many password-protected settings attempts. Please try again later.' },
});

function calculateAge(birthDate) {
  const dob = new Date(birthDate);

  if (Number.isNaN(dob.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age;
}

async function getAccountDetails(userId) {
  const [rows] = await db.execute(
    `SELECT
       u.user_id AS id,
       u.email,
       p.first_name,
       p.last_name,
       p.birth_date,
       p.gender_id,
       p.city_id,
       c.city_name,
       c.country_id
     FROM users u
     LEFT JOIN profiles p ON p.user_id = u.user_id
     LEFT JOIN cities c ON c.city_id = p.city_id
     WHERE u.user_id = ?`,
    [userId]
  );

  return rows[0] ?? null;
}

router.get('/settings/account', auth, async (req, res) => {
  try {
    const account = await getAccountDetails(req.userId);

    if (!account) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    res.json(account);
  } catch (error) {
    console.error('Error fetching settings account:', error);
    res.status(500).json({ error: 'Failed to fetch account settings.' });
  }
});

router.post('/settings/verify-password', auth, sensitiveSettingsLimiter, async (req, res) => {
  try {
    const { current_password } = req.body;

    if (!current_password) {
      return res.status(400).json({ error: 'Current password is required.' });
    }

    const [users] = await db.execute(
      'SELECT password_hash FROM users WHERE user_id = ?',
      [req.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    const isValidPassword = await bcrypt.compare(current_password, users[0].password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    res.json({ message: 'Password verified.' });
  } catch (error) {
    console.error('Error verifying settings password:', error);
    res.status(500).json({ error: 'Failed to verify password.' });
  }
});

router.put('/settings/account', auth, async (req, res) => {
  const connection = await db.getConnection();
  let transactionStarted = false;

  try {
    const {
      current_password,
      email,
      first_name,
      last_name,
      birth_date,
      gender_id,
      city_id,
    } = req.body;

    if (!current_password) {
      return res.status(400).json({ error: 'Current password is required.' });
    }

    if (!email || !first_name || !last_name || !birth_date || !gender_id || !city_id) {
      return res.status(400).json({ error: 'All account fields are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedFirstName = String(first_name).trim();
    const normalizedLastName = String(last_name).trim();
    const parsedGenderId = Number(gender_id);
    const parsedCityId = Number(city_id);

    if (!normalizedEmail) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    if (!isEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    if (!normalizedFirstName || !normalizedLastName) {
      return res.status(400).json({ error: 'First name and last name are required.' });
    }

    if (!Number.isInteger(parsedGenderId) || !Number.isInteger(parsedCityId)) {
      return res.status(400).json({ error: 'Gender and city must be valid selections.' });
    }

    const age = calculateAge(birth_date);
    if (age === null) {
      return res.status(400).json({ error: 'Birth date must be a valid date.' });
    }

    if (age < 18) {
      return res.status(400).json({ error: 'You must be at least 18 years old.' });
    }

    const [users] = await connection.execute(
      'SELECT password_hash FROM users WHERE user_id = ?',
      [req.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    const isValidPassword = await bcrypt.compare(current_password, users[0].password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const [emailRows] = await connection.execute(
      'SELECT user_id FROM users WHERE email = ? AND user_id <> ?',
      [normalizedEmail, req.userId]
    );

    if (emailRows.length > 0) {
      return res.status(400).json({ error: 'That email address is already in use.' });
    }

    const [genderRows] = await connection.execute(
      'SELECT gender_id FROM genders WHERE gender_id = ?',
      [parsedGenderId]
    );

    if (genderRows.length === 0) {
      return res.status(400).json({ error: 'Selected gender does not exist.' });
    }

    const [cityRows] = await connection.execute(
      'SELECT city_id FROM cities WHERE city_id = ?',
      [parsedCityId]
    );

    if (cityRows.length === 0) {
      return res.status(400).json({ error: 'Selected city does not exist.' });
    }

    await connection.beginTransaction();
    transactionStarted = true;

    await connection.execute(
      'UPDATE users SET email = ? WHERE user_id = ?',
      [normalizedEmail, req.userId]
    );

    await connection.execute(
      `INSERT INTO profiles (user_id, first_name, last_name, birth_date, gender_id, city_id)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         first_name = VALUES(first_name),
         last_name = VALUES(last_name),
         birth_date = VALUES(birth_date),
         gender_id = VALUES(gender_id),
         city_id = VALUES(city_id)`,
      [
        req.userId,
        normalizedFirstName,
        normalizedLastName,
        birth_date,
        parsedGenderId,
        parsedCityId,
      ]
    );

    await connection.commit();

    const account = await getAccountDetails(req.userId);
    res.json({
      message: 'Account updated successfully.',
      user: {
        id: req.userId,
        email: normalizedEmail,
      },
      account,
    });
  } catch (error) {
    if (transactionStarted) {
      await connection.rollback();
    }
    console.error('Error updating settings account:', error);
    res.status(500).json({ error: 'Failed to update account settings.' });
  } finally {
    connection.release();
  }
});

router.put('/settings/password', auth, sensitiveSettingsLimiter, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    if (String(new_password).length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }

    const [users] = await db.execute(
      'SELECT password_hash FROM users WHERE user_id = ?',
      [req.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    const isValidPassword = await bcrypt.compare(current_password, users[0].password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const isSamePassword = await bcrypt.compare(new_password, users[0].password_hash);
    if (isSamePassword) {
      return res.status(400).json({ error: 'New password must be different from the current password.' });
    }

    const nextPasswordHash = await bcrypt.hash(new_password, 10);
    await db.execute(
      'UPDATE users SET password_hash = ? WHERE user_id = ?',
      [nextPasswordHash, req.userId]
    );

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Error updating settings password:', error);
    res.status(500).json({ error: 'Failed to update password.' });
  }
});

router.delete('/settings/account', auth, sensitiveSettingsLimiter, async (req, res) => {
  const connection = await db.getConnection();
  let transactionStarted = false;

  try {
    const { current_password, confirmation } = req.body;

    if (!current_password) {
      return res.status(400).json({ error: 'Current password is required.' });
    }

    if (confirmation !== 'DELETE') {
      return res.status(400).json({ error: 'Type DELETE to confirm account deletion.' });
    }

    const [users] = await connection.execute(
      'SELECT email, password_hash FROM users WHERE user_id = ?',
      [req.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    const isValidPassword = await bcrypt.compare(current_password, users[0].password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const [matchRows] = await connection.execute(
      'SELECT match_id FROM matches WHERE user1_id = ? OR user2_id = ?',
      [req.userId, req.userId]
    );
    const matchIds = matchRows.map((row) => row.match_id);

    const [messageRows] = await connection.execute(
      matchIds.length > 0
        ? `SELECT message_id FROM messages WHERE sender_id = ? OR match_id IN (${matchIds.map(() => '?').join(', ')})`
        : 'SELECT message_id FROM messages WHERE sender_id = ?',
      matchIds.length > 0 ? [req.userId, ...matchIds] : [req.userId]
    );
    const messageIds = messageRows.map((row) => row.message_id);

    const [complaintRows] = await connection.execute(
      'SELECT complaint_id FROM complaints WHERE reporter_id = ? OR reported_id = ?',
      [req.userId, req.userId]
    );
    const complaintIds = complaintRows.map((row) => row.complaint_id);

    await connection.beginTransaction();
    transactionStarted = true;

    if (complaintIds.length > 0) {
      await connection.execute(
        `DELETE FROM notifications WHERE complaint_id IN (${complaintIds.map(() => '?').join(', ')})`,
        complaintIds
      );
    }

    if (messageIds.length > 0) {
      await connection.execute(
        `DELETE FROM notifications WHERE message_id IN (${messageIds.map(() => '?').join(', ')})`,
        messageIds
      );
    }

    if (matchIds.length > 0) {
      await connection.execute(
        `DELETE FROM notifications WHERE match_id IN (${matchIds.map(() => '?').join(', ')})`,
        matchIds
      );
    }

    await connection.execute(
      'DELETE FROM notifications WHERE user_id = ?',
      [req.userId]
    );

    await connection.execute(
      'DELETE FROM password_reset_tokens WHERE user_id = ?',
      [req.userId]
    );
    await connection.execute(
      'DELETE FROM blocked_users WHERE blocker_id = ? OR blocked_id = ?',
      [req.userId, req.userId]
    );
    await connection.execute(
      'DELETE FROM likes WHERE liker_id = ? OR liked_id = ?',
      [req.userId, req.userId]
    );
    await connection.execute(
      'DELETE FROM passes WHERE passer_id = ? OR passed_id = ?',
      [req.userId, req.userId]
    );

    if (complaintIds.length > 0) {
      await connection.execute(
        'DELETE FROM complaints WHERE reporter_id = ? OR reported_id = ?',
        [req.userId, req.userId]
      );
    }

    if (messageIds.length > 0) {
      await connection.execute(
        matchIds.length > 0
          ? `DELETE FROM messages WHERE sender_id = ? OR match_id IN (${matchIds.map(() => '?').join(', ')})`
          : 'DELETE FROM messages WHERE sender_id = ?',
        matchIds.length > 0 ? [req.userId, ...matchIds] : [req.userId]
      );
    }

    if (matchIds.length > 0) {
      await connection.execute(
        'DELETE FROM matches WHERE user1_id = ? OR user2_id = ?',
        [req.userId, req.userId]
      );
    }

    await connection.execute(
      'DELETE FROM preference_sports WHERE user_id = ?',
      [req.userId]
    );
    await connection.execute(
      'DELETE FROM preferences WHERE user_id = ?',
      [req.userId]
    );
    await connection.execute(
      'DELETE FROM user_sports WHERE user_id = ?',
      [req.userId]
    );
    await connection.execute(
      'DELETE FROM user_photos WHERE user_id = ?',
      [req.userId]
    );
    await connection.execute(
      'DELETE FROM profiles WHERE user_id = ?',
      [req.userId]
    );
    await connection.execute(
      'DELETE FROM users WHERE user_id = ?',
      [req.userId]
    );

    await connection.commit();

    res.json({ message: 'Account deleted successfully.' });
  } catch (error) {
    if (transactionStarted) {
      await connection.rollback();
    }
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account.' });
  } finally {
    connection.release();
  }
});

module.exports = router;
