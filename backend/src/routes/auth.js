const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend');
const db = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Presence heartbeat (auth middleware updates last_active)
router.get('/presence/ping', auth, async (_req, res) => {
  res.json({ ok: true });
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.user_id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token,
      user: {
        id: user.user_id,
        email: user.email,
        role: user.role,
        onboardingComplete: !!user.onboarding_complete,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const [existing] = await db.execute('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user (profile is created during onboarding)
    const [userResult] = await db.execute(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [email, hashedPassword]
    );

    const userId = userResult.insertId;

    // Generate token
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      token,
      user: { id: userId, email, role: 'user', onboardingComplete: false },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Forgot Password
// TODO: Add rate limiting (e.g. express-rate-limit) to prevent abuse
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    if (!resend) {
      return res.status(503).json({ error: 'Password reset email service is not configured. Set RESEND_API_KEY in backend/.env.' });
    }

    const genericMessage = 'If an account with that email exists, a password reset link has been sent.';

    const [users] = await db.execute('SELECT user_id FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.json({ message: genericMessage });
    }

    const userId = users[0].user_id;

    // Delete any existing tokens for this user
    await db.execute('DELETE FROM password_reset_tokens WHERE user_id = ?', [userId]);

    // Generate token and hash before storing
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    await db.execute(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))',
      [userId, hashedToken]
    );

    const resetLink = `${FRONTEND_URL}/reset-password?token=${rawToken}`;

    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'SportSync <onboarding@resend.dev>',
      to: email,
      subject: 'Reset your SportSync password',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #2E1065;">Reset your password</h2>
          <p>We received a request to reset your SportSync password. Click the button below to choose a new one. This link expires in 1 hour.</p>
          <a href="${resetLink}" style="display: inline-block; background: #7C3AED; color: white; text-decoration: none; padding: 12px 24px; border-radius: 9999px; font-weight: bold; margin: 16px 0;">Reset Password</a>
          <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #999; font-size: 12px;">SportSync</p>
        </div>
      `,
    });

    console.log(`Password reset email sent to ${email}`);

    res.json({ message: genericMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Reset token is required.' });
    }

    if (!password || password.length < 8 || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/.test(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters with one uppercase letter, one lowercase letter, and one number.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const [rows] = await db.execute(
      'SELECT token_id, user_id FROM password_reset_tokens WHERE token = ? AND expires_at > NOW()',
      [hashedToken]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    const userId = rows[0].user_id;

    const passwordHash = await bcrypt.hash(password, 12);
    await db.execute('UPDATE users SET password_hash = ? WHERE user_id = ?', [passwordHash, userId]);

    // Delete all tokens for this user
    await db.execute('DELETE FROM password_reset_tokens WHERE user_id = ?', [userId]);

    res.json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;