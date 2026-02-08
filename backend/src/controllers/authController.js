const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const {
  generateTokens,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens
} = require('../middleware/auth');
const { sendWelcomeEmail } = require('../services/emailService');
const { createWelcomeNotification } = require('../services/notificationService');

const SALT_ROUNDS = 12;

// Register new user
const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validate input
    if (!email || !password || !firstName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and first name are required'
      });
    }

    // Check if email already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const userId = uuidv4();
    db.prepare(`
      INSERT INTO users (id, email, password, first_name, last_name, role, is_onboarded, onboarding_step)
      VALUES (?, ?, ?, ?, ?, 'user', 0, 0)
    `).run(userId, email.toLowerCase(), hashedPassword, firstName, lastName || null);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(userId);

    // Get created user
    const user = db.prepare(`
      SELECT id, email, first_name, last_name, avatar, role, is_onboarded, onboarding_step
      FROM users WHERE id = ?
    `).get(userId);

    // Send welcome email and create welcome notification (async, don't block response)
    sendWelcomeEmail({ email: user.email, first_name: user.first_name }).catch(err =>
      console.error('Failed to send welcome email:', err)
    );
    createWelcomeNotification(userId, user.first_name).catch(err =>
      console.error('Failed to create welcome notification:', err)
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          avatar: user.avatar,
          role: user.role,
          isOnboarded: Boolean(user.is_onboarded),
          onboardingStep: user.onboarding_step
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user has a password (not OAuth-only user)
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: 'Please login with Google'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    db.prepare('UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          avatar: user.avatar,
          role: user.role,
          isOnboarded: Boolean(user.is_onboarded),
          onboardingStep: user.onboarding_step
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

// Refresh token
const refreshToken = (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const payload = verifyRefreshToken(token);
    if (!payload) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }

    // Revoke old refresh token
    revokeRefreshToken(token);

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(payload.userId);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed'
    });
  }
};

// Logout
const logout = (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (token) {
      revokeRefreshToken(token);
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

// Logout from all devices
const logoutAll = (req, res) => {
  try {
    revokeAllUserTokens(req.user.id);

    res.json({
      success: true,
      message: 'Logged out from all devices'
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

// Get current user
const getMe = (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, email, first_name, last_name, avatar, role, is_onboarded, onboarding_step, mobile_number, mobile_verified, created_at
      FROM users WHERE id = ?
    `).get(req.user.id);

    // Get user profile if exists
    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(req.user.id);

    // Get health goals
    const goals = db.prepare('SELECT * FROM health_goals WHERE user_id = ?').all(req.user.id);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          avatar: user.avatar,
          role: user.role,
          isOnboarded: Boolean(user.is_onboarded),
          onboardingStep: user.onboarding_step,
          mobileNumber: user.mobile_number,
          mobileVerified: Boolean(user.mobile_verified),
          createdAt: user.created_at
        },
        profile: profile ? {
          age: profile.age,
          gender: profile.gender,
          heightCm: profile.height_cm,
          weightKg: profile.weight_kg,
          dietType: profile.diet_type,
          activityLevel: profile.activity_level,
          sleepHours: profile.sleep_hours,
          workType: profile.work_type,
          stressLevel: profile.stress_level,
          waterIntake: profile.water_intake_liters,
          bmi: profile.bmi,
          bmr: profile.bmr,
          tdee: profile.tdee,
          targetCalories: profile.target_calories
        } : null,
        goals: goals.map(g => ({
          id: g.id,
          goalType: g.goal_type,
          priority: g.priority,
          progress: g.progress_percentage,
          status: g.status
        }))
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user data'
    });
  }
};

// Google OAuth callback handler
const googleCallback = (req, res) => {
  try {
    const user = req.user;

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Redirect to frontend with tokens
    const redirectUrl = new URL(`${process.env.FRONTEND_URL}/auth/callback`);
    redirectUrl.searchParams.set('accessToken', accessToken);
    redirectUrl.searchParams.set('refreshToken', refreshToken);
    redirectUrl.searchParams.set('isOnboarded', user.is_onboarded ? 'true' : 'false');

    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    // Get user with password
    const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id);

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change password for OAuth accounts'
      });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(hashedPassword, req.user.id);

    // Revoke all refresh tokens
    revokeAllUserTokens(req.user.id);

    // Generate new tokens
    const { accessToken, refreshToken } = generateTokens(req.user.id);

    res.json({
      success: true,
      message: 'Password changed successfully',
      data: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};

// Delete account
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    // Get user
    const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id);

    // If user has password, verify it
    if (user.password) {
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password is required to delete account'
        });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Incorrect password'
        });
      }
    }

    // Delete user (cascade will handle related data)
    db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account'
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  getMe,
  googleCallback,
  changePassword,
  deleteAccount
};
