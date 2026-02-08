const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { sendOTPEmail } = require('./emailService');
const { sendOTPSMS } = require('./smsService');

const OTP_LENGTH = 6;
const MAX_ATTEMPTS = 5;
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;

// Generate a random OTP
function generateOTP() {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

// Create and store OTP
async function createOTP(identifier, identifierType, purpose, userId = null) {
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  // Invalidate any existing unused OTPs for this identifier/purpose
  const invalidateStmt = db.prepare(`
    UPDATE otp_tokens
    SET is_used = 1
    WHERE identifier = ? AND identifier_type = ? AND purpose = ? AND is_used = 0
  `);
  invalidateStmt.run(identifier, identifierType, purpose);

  // Create new OTP
  const id = uuidv4();
  const insertStmt = db.prepare(`
    INSERT INTO otp_tokens (id, user_id, identifier, identifier_type, otp_code, purpose, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertStmt.run(id, userId, identifier, identifierType, otp, purpose, expiresAt);

  return { otp, expiresAt, id };
}

// Verify OTP
function verifyOTP(identifier, identifierType, otp, purpose) {
  // Find the OTP
  const findStmt = db.prepare(`
    SELECT * FROM otp_tokens
    WHERE identifier = ? AND identifier_type = ? AND purpose = ? AND is_used = 0
    ORDER BY created_at DESC LIMIT 1
  `);
  const otpRecord = findStmt.get(identifier, identifierType, purpose);

  if (!otpRecord) {
    return { valid: false, error: 'No OTP found. Please request a new one.' };
  }

  // Check expiry
  if (new Date(otpRecord.expires_at) < new Date()) {
    // Mark as used (expired)
    db.prepare(`UPDATE otp_tokens SET is_used = 1 WHERE id = ?`).run(otpRecord.id);
    return { valid: false, error: 'OTP has expired. Please request a new one.' };
  }

  // Check attempts
  if (otpRecord.attempts >= MAX_ATTEMPTS) {
    db.prepare(`UPDATE otp_tokens SET is_used = 1 WHERE id = ?`).run(otpRecord.id);
    return { valid: false, error: 'Too many failed attempts. Please request a new OTP.' };
  }

  // Verify OTP
  if (otpRecord.otp_code !== otp) {
    // Increment attempts
    db.prepare(`UPDATE otp_tokens SET attempts = attempts + 1 WHERE id = ?`).run(otpRecord.id);
    const remainingAttempts = MAX_ATTEMPTS - otpRecord.attempts - 1;
    return {
      valid: false,
      error: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`
    };
  }

  // OTP is valid - mark as used
  db.prepare(`UPDATE otp_tokens SET is_used = 1 WHERE id = ?`).run(otpRecord.id);

  return { valid: true, userId: otpRecord.user_id };
}

// Send OTP via email
async function sendEmailOTP(email, purpose = 'login') {
  // Check if user exists (for login purpose)
  if (purpose === 'login') {
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (!user) {
      return { success: false, error: 'No account found with this email.' };
    }
  }

  const { otp, expiresAt } = await createOTP(email, 'email', purpose);
  const result = await sendOTPEmail(email, otp, purpose);

  if (result.success) {
    return {
      success: true,
      message: 'OTP sent to your email.',
      expiresAt
    };
  }

  return {
    success: false,
    error: result.reason || 'Failed to send OTP. Please try again.'
  };
}

// Send OTP via SMS
async function sendSMSOTP(phoneNumber, purpose = 'login', userId = null) {
  // For login, find user by phone
  if (purpose === 'login') {
    const user = db.prepare('SELECT id FROM users WHERE mobile_number = ?').get(phoneNumber);
    if (!user) {
      return { success: false, error: 'No account found with this phone number.' };
    }
    userId = user.id;
  }

  const { otp, expiresAt } = await createOTP(phoneNumber, 'phone', purpose, userId);
  const result = await sendOTPSMS(phoneNumber, otp, purpose);

  if (result.success) {
    return {
      success: true,
      message: 'OTP sent to your phone.',
      expiresAt
    };
  }

  // Fallback: Always try email if SMS fails and user exists
  if (userId) {
    const user = db.prepare('SELECT email FROM users WHERE id = ?').get(userId);
    if (user?.email) {
      console.log(`📧 SMS unavailable. Sending OTP to email instead: ${user.email}`);
      const emailResult = await sendOTPEmail(user.email, otp, purpose);
      if (emailResult.success) {
        const maskedEmail = user.email.substring(0, 3) + '***@' + user.email.split('@')[1];
        return {
          success: true,
          message: `SMS is a premium feature. OTP sent to your email (${maskedEmail}) instead.`,
          expiresAt,
          fallbackUsed: 'email'
        };
      }
    }
  }

  return {
    success: false,
    error: result.reason || 'Failed to send OTP. Please try again.'
  };
}

// Clean up expired OTPs (call periodically)
function cleanupExpiredOTPs() {
  const stmt = db.prepare(`
    DELETE FROM otp_tokens
    WHERE expires_at < datetime('now') OR is_used = 1
  `);
  const result = stmt.run();
  if (result.changes > 0) {
    console.log(`🧹 Cleaned up ${result.changes} expired/used OTPs`);
  }
}

// Run cleanup every hour
setInterval(cleanupExpiredOTPs, 60 * 60 * 1000);

module.exports = {
  generateOTP,
  createOTP,
  verifyOTP,
  sendEmailOTP,
  sendSMSOTP,
  cleanupExpiredOTPs
};
