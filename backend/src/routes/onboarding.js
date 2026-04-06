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

// GET /api/sports
router.get('/sports', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT sport_id AS id, sport_name AS name FROM sports ORDER BY sport_name');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching sports:', error);
    res.status(500).json({ error: 'Failed to fetch sports' });
  }
});

// GET /api/skill-levels
router.get('/skill-levels', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT skill_level_id AS id, level_name AS name FROM skill_levels ORDER BY sort_order');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching skill levels:', error);
    res.status(500).json({ error: 'Failed to fetch skill levels' });
  }
});

// GET /api/frequencies
router.get('/frequencies', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT frequency_id AS id, frequency_label AS name FROM training_frequencies ORDER BY sort_order');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching frequencies:', error);
    res.status(500).json({ error: 'Failed to fetch frequencies' });
  }
});

// POST /api/onboarding/sports
router.post('/onboarding/sports', async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Authentication required.' });

    const sports = req.body;

    if (!Array.isArray(sports) || sports.length === 0) {
      return res.status(400).json({ error: 'At least one sport is required.' });
    }

    for (const s of sports) {
      const { sport_id, skill_level_id, years_experience, frequency_id } = s;
      if (!sport_id || !skill_level_id || !frequency_id) {
        return res.status(400).json({ error: 'sport_id, skill_level_id, and frequency_id are required for each sport.' });
      }
    }

    // Delete existing user_sports rows for this user, then re-insert
    await db.execute('DELETE FROM user_sports WHERE user_id = ?', [userId]);

    for (const s of sports) {
      const { sport_id, skill_level_id, years_experience, frequency_id } = s;
      await db.execute(
        `INSERT INTO user_sports (user_id, sport_id, skill_level_id, years_experience, frequency_id)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, sport_id, skill_level_id, years_experience ?? null, frequency_id]
      );
    }

    res.json({ message: 'Sports saved successfully.' });
  } catch (error) {
    console.error('Error saving sports:', error);
    res.status(500).json({ error: 'Failed to save sports.' });
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
