const express = require('express');
const passport = require('passport');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateJWT } = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

// Google OAuth routes
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false
}));

router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`
  }),
  authController.googleCallback
);

// Protected routes
router.get('/me', authenticateJWT, authController.getMe);
router.post('/logout-all', authenticateJWT, authController.logoutAll);
router.put('/change-password', authenticateJWT, authController.changePassword);
router.delete('/delete-account', authenticateJWT, authController.deleteAccount);

module.exports = router;
