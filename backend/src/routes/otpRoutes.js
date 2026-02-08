const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const {
  sendEmailOTPController,
  sendSMSOTPController,
  verifyOTPAndLogin,
  verifyPhoneNumber,
  sendPhoneVerificationOTP
} = require('../controllers/otpController');

// Public OTP routes (for login)
// POST /api/auth/otp/send-email - Send OTP to email
router.post('/send-email', sendEmailOTPController);

// POST /api/auth/otp/send-sms - Send OTP to phone
router.post('/send-sms', sendSMSOTPController);

// POST /api/auth/otp/verify - Verify OTP and login
router.post('/verify', verifyOTPAndLogin);

// Protected routes (require authentication)
// POST /api/auth/otp/verify-phone - Verify phone number for profile
router.post('/verify-phone', authenticateJWT, verifyPhoneNumber);

// POST /api/auth/otp/send-phone-verification - Send OTP for phone verification
router.post('/send-phone-verification', authenticateJWT, sendPhoneVerificationOTP);

module.exports = router;
