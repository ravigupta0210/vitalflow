const passport = require('passport');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// JWT Authentication middleware
const authenticateJWT = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Authentication error'
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: info?.message || 'Unauthorized - Invalid or expired token'
      });
    }

    req.user = user;
    next();
  })(req, res, next);
};

// Optional JWT Authentication (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (user) {
      req.user = user;
    }
    next();
  })(req, res, next);
};

// Check if user has completed onboarding
const requireOnboarding = (req, res, next) => {
  if (!req.user.is_onboarded) {
    return res.status(403).json({
      success: false,
      message: 'Please complete onboarding first',
      onboarding_step: req.user.onboarding_step
    });
  }
  next();
};

// Generate JWT tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );

  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  // Store refresh token in database
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  db.prepare(`
    INSERT INTO refresh_tokens (id, user_id, token, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(
    require('uuid').v4(),
    userId,
    refreshToken,
    expiresAt.toISOString()
  );

  return { accessToken, refreshToken };
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    if (payload.type !== 'refresh') {
      return null;
    }

    // Check if token exists in database and is not expired
    const storedToken = db.prepare(`
      SELECT * FROM refresh_tokens
      WHERE token = ? AND expires_at > datetime('now')
    `).get(token);

    if (!storedToken) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
};

// Revoke refresh token
const revokeRefreshToken = (token) => {
  db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(token);
};

// Revoke all user tokens (for logout from all devices)
const revokeAllUserTokens = (userId) => {
  db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(userId);
};

module.exports = {
  authenticateJWT,
  optionalAuth,
  requireOnboarding,
  generateTokens,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens
};
