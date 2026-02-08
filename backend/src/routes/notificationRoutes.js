const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteUserNotification,
  clearAllUserNotifications
} = require('../controllers/notificationController');
const {
  registerDeviceToken,
  unregisterDeviceToken
} = require('../services/pushNotificationService');

// All notification routes require authentication
router.use(authenticateJWT);

// POST /api/notifications/register-device - Register device for push notifications
router.post('/register-device', (req, res) => {
  try {
    const { token, platform, deviceName } = req.body;
    const userId = req.user.id;

    if (!token || !platform) {
      return res.status(400).json({
        success: false,
        message: 'Token and platform are required'
      });
    }

    if (!['android', 'ios', 'web'].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform. Must be android, ios, or web'
      });
    }

    const result = registerDeviceToken(userId, token, platform, deviceName);

    res.json({
      success: true,
      message: 'Device registered for push notifications',
      data: result
    });
  } catch (error) {
    console.error('Register device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register device'
    });
  }
});

// DELETE /api/notifications/unregister-device - Unregister device from push notifications
router.delete('/unregister-device', (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    unregisterDeviceToken(token);

    res.json({
      success: true,
      message: 'Device unregistered from push notifications'
    });
  } catch (error) {
    console.error('Unregister device error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unregister device'
    });
  }
});

// GET /api/notifications - Get user notifications (with pagination and filter)
router.get('/', getUserNotifications);

// GET /api/notifications/unread-count - Get unread notification count
router.get('/unread-count', getUnreadNotificationCount);

// PUT /api/notifications/:id/read - Mark a notification as read
router.put('/:id/read', markNotificationAsRead);

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', markAllNotificationsAsRead);

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', deleteUserNotification);

// DELETE /api/notifications/clear-all - Clear all notifications
router.delete('/clear-all', clearAllUserNotifications);

module.exports = router;
