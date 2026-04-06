const express = require('express');
const db = require('../config/database');

const router = express.Router();

// GET /api/genders
router.get('/genders', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT gender_id AS id, gender_name AS name FROM genders ORDER BY gender_name');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching genders:', error);
    res.status(500).json({ error: 'Failed to fetch genders' });
  }
});

// GET /api/countries
router.get('/countries', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT country_id AS id, country_name AS name FROM countries ORDER BY country_name');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ error: 'Failed to fetch countries' });
  }
});

// GET /api/countries/:countryId/cities
router.get('/countries/:countryId/cities', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT city_id AS id, city_name AS name FROM cities WHERE country_id = ? ORDER BY city_name',
      [req.params.countryId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

// POST /api/onboarding/profile
router.post('/onboarding/profile', async (req, res) => {
  try {
    const { first_name, last_name, birth_date, gender_id, city_id } = req.body;

    if (!first_name || !last_name || !birth_date || !gender_id || !city_id) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Age check (must be >= 18)
    const dob = new Date(birth_date);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear()
      - (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
    if (age < 18) {
      return res.status(400).json({ error: 'You must be at least 18 years old.' });
    }

    // TODO: Extract user_id from JWT auth middleware
    // For now, expect user_id in the request (or from auth middleware later)
    const userId = req.userId; // set by auth middleware

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Upsert profile
    await db.execute(
      `INSERT INTO profiles (user_id, first_name, last_name, birth_date, gender_id, city_id)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE first_name = VALUES(first_name), last_name = VALUES(last_name),
         birth_date = VALUES(birth_date), gender_id = VALUES(gender_id), city_id = VALUES(city_id)`,
      [userId, first_name, last_name, birth_date, gender_id, city_id]
    );

    res.json({ message: 'Profile saved successfully.' });
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).json({ error: 'Failed to save profile.' });
  }
});

module.exports = router;
