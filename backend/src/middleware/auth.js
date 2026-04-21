const jwt = require('jsonwebtoken');
const db = require('../config/database');

async function loadUserAccess(userId) {
  const [rows] = await db.execute(
    'SELECT role, account_status, suspended_until, suspension_reason FROM users WHERE user_id = ?',
    [userId]
  );

  if (rows.length === 0) {
    return null;
  }

  const user = rows[0];
  if (user.account_status === 'suspended' && user.suspended_until) {
    const suspendedUntil = new Date(user.suspended_until);
    if (!Number.isNaN(suspendedUntil.getTime()) && suspendedUntil.getTime() <= Date.now()) {
      await db.execute(
        `UPDATE users
         SET account_status = 'active', suspended_until = NULL, suspension_reason = NULL
         WHERE user_id = ?`,
        [userId]
      );

      return {
        ...user,
        account_status: 'active',
        suspended_until: null,
        suspension_reason: null,
      };
    }
  }

  return user;
}

function rejectForAccountStatus(res, user) {
  if (user.account_status === 'banned') {
    return res.status(403).json({
      reason: 'banned',
      error: 'This account has been permanently disabled for violating our terms.',
    });
  }

  if (user.account_status === 'suspended') {
    return res.status(403).json({
      reason: 'suspended',
      error: 'This account is temporarily suspended.',
      until: user.suspended_until,
      suspensionReason: user.suspension_reason || 'Your account is temporarily unavailable while we review a moderation action.',
    });
  }

  return null;
}

async function touchLastActive(userId) {
  try {
    await db.execute(
      `UPDATE users
       SET last_active = NOW()
       WHERE user_id = ?
         AND (last_active IS NULL OR last_active < DATE_SUB(NOW(), INTERVAL 1 MINUTE))`,
      [userId]
    );
  } catch {
    // Presence is best-effort; auth should not fail if this update fails.
  }
}

async function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    const user = await loadUserAccess(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }
    const statusResponse = rejectForAccountStatus(res, user);
    if (statusResponse) {
      return statusResponse;
    }
    await touchLastActive(decoded.userId);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

async function authenticateToken(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    const user = await loadUserAccess(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }
    const statusResponse = rejectForAccountStatus(res, user);
    if (statusResponse) {
      return statusResponse;
    }
    await touchLastActive(decoded.userId);
    req.userRole = user.role;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

function requireAdmin(req, res, next) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

module.exports = auth;
module.exports.authenticateToken = authenticateToken;
module.exports.requireAdmin = requireAdmin;
