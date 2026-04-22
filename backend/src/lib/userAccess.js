// reusable logic for both auth.js login and middleware sections

const db = require('../config/database');

// Loads the user's access-relevant fields, auto-lifting an expired suspension in-place.
async function loadUserAccess(userId) {
  const [rows] = await db.execute(
    'SELECT role, account_status, suspended_until, suspension_reason FROM users WHERE user_id = ?',
    [userId]
  );

  if (rows.length === 0) return null;

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
      return { ...user, account_status: 'active', suspended_until: null, suspension_reason: null };
    }
  }

  return user;
}

// Returns a 403 response for banned/suspended accounts, or null if the account is active.
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
      suspensionReason:
        user.suspension_reason ||
        'Your account is temporarily unavailable while we review a moderation action.',
    });
  }

  return null;
}

module.exports = { loadUserAccess, rejectForAccountStatus };
