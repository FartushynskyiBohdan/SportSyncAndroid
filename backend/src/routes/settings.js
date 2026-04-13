const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

function calculateAge(birthDate) {
  const dob = new Date(birthDate);
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

router.post('/settings/verify-password', auth, async (req, res) => {
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

    if (!normalizedFirstName || !normalizedLastName) {
      return res.status(400).json({ error: 'First name and last name are required.' });
    }

    if (!Number.isInteger(parsedGenderId) || !Number.isInteger(parsedCityId)) {
      return res.status(400).json({ error: 'Gender and city must be valid selections.' });
    }

    if (calculateAge(birth_date) < 18) {
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

router.put('/settings/password', auth, async (req, res) => {
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

module.exports = router;
