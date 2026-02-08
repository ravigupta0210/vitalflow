const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications
} = require('../services/notificationService');

// Get user notifications
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, filter } = req.query;

    let isRead = null;
    if (filter === 'unread') isRead = false;
    if (filter === 'read') isRead = true;

    const notifications = getNotifications(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      isRead
    });

    const unreadCount = getUnreadCount(userId);

    res.json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: notifications.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
};

// Get unread notification count
const getUnreadNotificationCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = getUnreadCount(userId);

    res.json({
      success: true,
      unreadCount: count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unread count'
    });
  }
};

// Mark notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const success = markAsRead(userId, id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = markAllAsRead(userId);

    res.json({
      success: true,
      message: `${count} notification(s) marked as read`
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notifications as read'
    });
  }
};

// Delete a notification
const deleteUserNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const success = deleteNotification(userId, id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification'
    });
  }
};

// Clear all notifications
const clearAllUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = clearAllNotifications(userId);

    res.json({
      success: true,
      message: `${count} notification(s) cleared`
    });
  } catch (error) {
    console.error('Clear all notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear notifications'
    });
  }
};

module.exports = {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteUserNotification,
  clearAllUserNotifications
};
