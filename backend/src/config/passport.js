const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./database');
const { v4: uuidv4 } = require('uuid');
const { sendWelcomeEmail } = require('../services/emailService');
const { createWelcomeNotification } = require('../services/notificationService');

// JWT Strategy Options
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
  algorithms: ['HS256']
};

// JWT Strategy
passport.use(new JwtStrategy(jwtOptions, (payload, done) => {
  try {
    const user = db.prepare(`
      SELECT id, email, first_name, last_name, avatar, role, is_onboarded, onboarding_step
      FROM users
      WHERE id = ?
    `).get(payload.userId);

    if (!user) {
      return done(null, false, { message: 'User not found' });
    }

    return done(null, user);
  } catch (error) {
    return done(error, false);
  }
}));

// Google OAuth Strategy (only if credentials are configured)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id') {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    scope: ['profile', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists with this Google ID
      let user = db.prepare(`
        SELECT * FROM users WHERE google_id = ?
      `).get(profile.id);

      if (user) {
        // Update last login
        db.prepare(`
          UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).run(user.id);
        return done(null, user);
      }

      // Check if user exists with this email
      user = db.prepare(`
        SELECT * FROM users WHERE email = ?
      `).get(profile.emails[0].value);

      if (user) {
        // Link Google account to existing user
        db.prepare(`
          UPDATE users SET google_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).run(profile.id, user.id);
        user.google_id = profile.id;
        return done(null, user);
      }

      // Create new user
      const userId = uuidv4();
      const newUser = {
        id: userId,
        email: profile.emails[0].value,
        google_id: profile.id,
        first_name: profile.name.givenName || profile.displayName,
        last_name: profile.name.familyName || '',
        avatar: profile.photos[0]?.value || null,
        role: 'user',
        is_onboarded: 0,
        onboarding_step: 0
      };

      db.prepare(`
        INSERT INTO users (id, email, google_id, first_name, last_name, avatar, role, is_onboarded, onboarding_step)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newUser.id,
        newUser.email,
        newUser.google_id,
        newUser.first_name,
        newUser.last_name,
        newUser.avatar,
        newUser.role,
        newUser.is_onboarded,
        newUser.onboarding_step
      );

      // Send welcome email and create welcome notification for new users (async, don't block)
      sendWelcomeEmail(newUser).catch(err =>
        console.error('Failed to send welcome email:', err)
      );
      createWelcomeNotification(newUser.id, newUser.first_name).catch(err =>
        console.error('Failed to create welcome notification:', err)
      );

      return done(null, newUser);
    } catch (error) {
      return done(error, false);
    }
  }));

  console.log('✅ Google OAuth strategy configured');
} else {
  console.log('⚠️  Google OAuth not configured - set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
}

module.exports = passport;
