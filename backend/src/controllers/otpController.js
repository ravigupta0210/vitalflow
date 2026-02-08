const db = require('../config/database');
const { sendEmailOTP, sendSMSOTP, verifyOTP } = require('../services/otpService');
const { generateTokens } = require('../middleware/auth');

// Send OTP to email
const sendEmailOTPController = async (req, res) => {
  try {
    const { email, purpose = 'login' } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    const result = await sendEmailOTP(email, purpose);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: result.message,
      expiresAt: result.expiresAt
    });
  } catch (error) {
    console.error('Send email OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP'
    });
  }
};

// Send OTP to phone
const sendSMSOTPController = async (req, res) => {
  try {
    const { phone, purpose = 'login' } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    // Basic phone validation
    const phoneRegex = /^[+]?[\d\s-]{10,}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format'
      });
    }

    const result = await sendSMSOTP(phone, purpose);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: result.message,
      expiresAt: result.expiresAt
    });
  } catch (error) {
    console.error('Send SMS OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP'
    });
  }
};

// Verify OTP and login
const verifyOTPAndLogin = async (req, res) => {
  try {
    const { identifier, otp, type = 'email' } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Identifier and OTP are required'
      });
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        error: 'OTP must be 6 digits'
      });
    }

    const identifierType = type === 'phone' ? 'phone' : 'email';
    const result = verifyOTP(identifier, identifierType, otp, 'login');

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    // Find user
    let user;
    if (identifierType === 'email') {
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(identifier);
    } else {
      user = db.prepare('SELECT * FROM users WHERE mobile_number = ?').get(identifier);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Generate tokens (generateTokens already stores the refresh token)
    const tokens = generateTokens(user.id);

    // Get user profile
    const profile = db.prepare(`
      SELECT * FROM user_profiles WHERE user_id = ?
    `).get(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        avatar: user.avatar,
        isOnboarded: Boolean(user.is_onboarded),
        profile: profile || null
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify OTP'
    });
  }
};

// Verify phone number (for profile)
const verifyPhoneNumber = async (req, res) => {
  try {
    const userId = req.user.id;
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and OTP are required'
      });
    }

    const result = verifyOTP(phone, 'phone', otp, 'phone_verify');

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    // Update user's mobile number and mark as verified
    db.prepare(`
      UPDATE users
      SET mobile_number = ?, mobile_verified = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(phone, userId);

    res.json({
      success: true,
      message: 'Phone number verified successfully'
    });
  } catch (error) {
    console.error('Verify phone error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify phone number'
    });
  }
};

// Send OTP for phone verification (when adding phone to profile)
const sendPhoneVerificationOTP = async (req, res) => {
  try {
    const userId = req.user.id;
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    // Basic phone validation
    const phoneRegex = /^[+]?[\d\s-]{10,}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format'
      });
    }

    // Check if phone is already used by another user
    const existingUser = db.prepare(`
      SELECT id FROM users WHERE mobile_number = ? AND id != ?
    `).get(phone, userId);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'This phone number is already registered with another account'
      });
    }

    const result = await sendSMSOTP(phone, 'phone_verify', userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: result.message,
      expiresAt: result.expiresAt,
      fallbackUsed: result.fallbackUsed || null
    });
  } catch (error) {
    console.error('Send phone verification OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send verification OTP'
    });
  }
};

module.exports = {
  sendEmailOTPController,
  sendSMSOTPController,
  verifyOTPAndLogin,
  verifyPhoneNumber,
  sendPhoneVerificationOTP
};
