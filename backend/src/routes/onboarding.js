const express = require('express');
const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');
const db      = require('../config/database');

const router = express.Router();

/* ─── Multer setup ─── */

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename:    (_req, file,  cb) => {
    const ext  = path.extname(file.originalname).toLowerCase() || '.jpg';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits:     { fileSize: 10 * 1024 * 1024 },          // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed.'));
  },
});

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
    const userId = req.userId || 1; // TODO: remove fallback once auth middleware is wired up
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

// POST /api/onboarding/photos
router.post('/onboarding/photos', upload.array('photos', 6), async (req, res) => {
  try {
    const userId = req.userId || 1; // TODO: remove fallback once auth middleware is wired up
    if (!userId) return res.status(401).json({ error: 'Authentication required.' });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded.' });
    }

    // Check how many photos the user already has
    const [[{ count }]] = await db.execute(
      'SELECT COUNT(*) AS count FROM user_photos WHERE user_id = ?', [userId]
    );
    if (count + req.files.length > 6) {
      return res.status(400).json({ error: 'Maximum 6 photos allowed.' });
    }

    const results = [];
    for (let i = 0; i < req.files.length; i++) {
      const file         = req.files[i];
      const photo_url    = `/uploads/${file.filename}`;
      const display_order = Number(req.body.display_order ?? count) + i;

      const [result] = await db.execute(
        'INSERT INTO user_photos (user_id, photo_url, display_order) VALUES (?, ?, ?)',
        [userId, photo_url, display_order]
      );
      results.push({ photo_id: result.insertId, photo_url, display_order });
    }

    res.json(results);
  } catch (error) {
    console.error('Error uploading photos:', error);
    res.status(500).json({ error: 'Failed to upload photos.' });
  }
});

// PUT /api/onboarding/photos/order
router.put('/onboarding/photos/order', async (req, res) => {
  try {
    const userId = req.userId || 1; // TODO: remove fallback once auth middleware is wired up
    if (!userId) return res.status(401).json({ error: 'Authentication required.' });

    const items = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order array is required.' });
    }

    for (const { photo_id, display_order } of items) {
      await db.execute(
        'UPDATE user_photos SET display_order = ? WHERE photo_id = ? AND user_id = ?',
        [display_order, photo_id, userId]
      );
    }

    res.json({ message: 'Order updated.' });
  } catch (error) {
    console.error('Error updating photo order:', error);
    res.status(500).json({ error: 'Failed to update order.' });
  }
});

// POST /api/onboarding/bio
router.post('/onboarding/bio', async (req, res) => {
  try {
    const userId = req.userId || 1; // TODO: remove fallback once auth middleware is wired up
    if (!userId) return res.status(401).json({ error: 'Authentication required.' });

    const { bio } = req.body;

    if (!bio || typeof bio !== 'string' || bio.trim().length < 20) {
      return res.status(400).json({ error: 'Bio must be at least 20 characters.' });
    }

    if (bio.trim().length > 250) {
      return res.status(400).json({ error: 'Bio must be 250 characters or fewer.' });
    }

    await db.execute(
      `UPDATE profiles SET bio = ? WHERE user_id = ?`,
      [bio.trim(), userId]
    );

    res.json({ message: 'Bio saved successfully.' });
  } catch (error) {
    console.error('Error saving bio:', error);
    res.status(500).json({ error: 'Failed to save bio.' });
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
    const userId = req.userId || 1; // TODO: remove fallback once auth middleware is wired up // set by auth middleware

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

// GET /api/goals
router.get('/goals', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT goal_id AS id, goal_name AS name FROM relationship_goals ORDER BY goal_id');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// POST /api/onboarding/preferences
router.post('/onboarding/preferences', async (req, res) => {
  try {
    const userId = req.userId || 1; // TODO: remove fallback once auth middleware is wired up
    if (!userId) return res.status(401).json({ error: 'Authentication required.' });

    const { gender_id, min_age, max_age, max_distance_km, goal_id, sports } = req.body;

    if (!gender_id || !goal_id) {
      return res.status(400).json({ error: 'Gender and relationship goal are required.' });
    }

    if (!Number.isInteger(min_age) || !Number.isInteger(max_age) || min_age >= max_age) {
      return res.status(400).json({ error: 'Invalid age range.' });
    }

    if (!Array.isArray(sports) || sports.length === 0) {
      return res.status(400).json({ error: 'At least one preferred sport is required.' });
    }

    // Upsert preferences
    await db.execute(
      `INSERT INTO preferences (user_id, gender_id, min_age, max_age, max_distance_km, goal_id)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE gender_id = VALUES(gender_id), min_age = VALUES(min_age),
         max_age = VALUES(max_age), max_distance_km = VALUES(max_distance_km), goal_id = VALUES(goal_id)`,
      [userId, gender_id, min_age, max_age, max_distance_km ?? null, goal_id]
    );

    // Replace preference_sports
    await db.execute('DELETE FROM preference_sports WHERE user_id = ?', [userId]);
    for (const sport_id of sports) {
      await db.execute(
        'INSERT INTO preference_sports (user_id, sport_id) VALUES (?, ?)',
        [userId, sport_id]
      );
    }

    res.json({ message: 'Preferences saved successfully.' });
  } catch (error) {
    console.error('Error saving preferences:', error);
    res.status(500).json({ error: 'Failed to save preferences.' });
  }
});

// PATCH /api/users/onboarding-complete
router.patch('/users/onboarding-complete', async (req, res) => {
  try {
    const userId = req.userId || 1; // TODO: remove fallback once auth middleware is wired up
    if (!userId) return res.status(401).json({ error: 'Authentication required.' });

    await db.execute(
      'UPDATE users SET onboarding_complete = TRUE WHERE user_id = ?',
      [userId]
    );

    res.json({ message: 'Onboarding marked as complete.' });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({ error: 'Failed to complete onboarding.' });
  }
});

module.exports = router;
