const jwt = require('jsonwebtoken');
const db  = require('../config/database');
const { loadUserAccess, rejectForAccountStatus } = require('../lib/userAccess');

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
    if (!user) return res.status(401).json({ error: 'User not found.' });

    const rejected = rejectForAccountStatus(res, user);
    if (rejected) return rejected;

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
    if (!user) return res.status(401).json({ error: 'User not found.' });

    const rejected = rejectForAccountStatus(res, user);
    if (rejected) return rejected;

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
