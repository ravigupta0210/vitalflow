const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { sendNotificationEmail } = require('./emailService');

// Notification types
const NOTIFICATION_TYPES = {
  WELCOME: 'welcome',
  WORKOUT: 'workout',
  DIET: 'diet',
  ACHIEVEMENT: 'achievement',
  PROGRESS: 'progress',
  REMINDER: 'reminder',
  CALENDAR: 'calendar',
  CHAT: 'chat',
  SYSTEM: 'system'
};

// Create a notification
async function createNotification(userId, { type, title, message, metadata = null, sendEmailNotification = false }) {
  const id = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, message, metadata)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, userId, type, title, message, metadata ? JSON.stringify(metadata) : null);

  const notification = {
    id,
    user_id: userId,
    type,
    title,
    message,
    metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
    is_read: false,
    created_at: new Date().toISOString()
  };

  // Send email notification if enabled
  if (sendEmailNotification) {
    try {
      // Check user's email notification settings
      const settings = db.prepare(`
        SELECT email_notifications FROM user_settings WHERE user_id = ?
      `).get(userId);

      if (!settings || settings.email_notifications) {
        const user = db.prepare('SELECT email, first_name FROM users WHERE id = ?').get(userId);
        if (user) {
          await sendNotificationEmail(user, notification);
        }
      }
    } catch (error) {
      console.error('Failed to send notification email:', error);
    }
  }

  return notification;
}

// Get user notifications with pagination
function getNotifications(userId, { page = 1, limit = 20, isRead = null } = {}) {
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM notifications WHERE user_id = ?';
  const params = [userId];

  if (isRead !== null) {
    query += ' AND is_read = ?';
    params.push(isRead ? 1 : 0);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const notifications = db.prepare(query).all(...params);

  // Parse metadata JSON
  return notifications.map(n => ({
    ...n,
    is_read: Boolean(n.is_read),
    metadata: n.metadata ? JSON.parse(n.metadata) : null
  }));
}

// Get unread count
function getUnreadCount(userId) {
  const result = db.prepare(`
    SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0
  `).get(userId);

  return result.count;
}

// Mark notification as read
function markAsRead(userId, notificationId) {
  const stmt = db.prepare(`
    UPDATE notifications SET is_read = 1
    WHERE id = ? AND user_id = ?
  `);

  const result = stmt.run(notificationId, userId);
  return result.changes > 0;
}

// Mark all notifications as read
function markAllAsRead(userId) {
  const stmt = db.prepare(`
    UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0
  `);

  const result = stmt.run(userId);
  return result.changes;
}

// Delete a notification
function deleteNotification(userId, notificationId) {
  const stmt = db.prepare(`
    DELETE FROM notifications WHERE id = ? AND user_id = ?
  `);

  const result = stmt.run(notificationId, userId);
  return result.changes > 0;
}

// Clear all notifications
function clearAllNotifications(userId) {
  const stmt = db.prepare(`DELETE FROM notifications WHERE user_id = ?`);
  const result = stmt.run(userId);
  return result.changes;
}

// Create welcome notification for new users
async function createWelcomeNotification(userId, firstName) {
  return createNotification(userId, {
    type: NOTIFICATION_TYPES.WELCOME,
    title: 'Welcome to VitalFlow!',
    message: `Hi ${firstName || 'there'}! We're excited to have you on board. Complete your health profile to get personalized workout and diet recommendations powered by AI.`,
    metadata: { action: 'complete_profile' }
  });
}

// Create workout reminder notification
async function createWorkoutReminder(userId, workoutTitle) {
  return createNotification(userId, {
    type: NOTIFICATION_TYPES.WORKOUT,
    title: 'Workout Reminder',
    message: `Time for your workout: ${workoutTitle}. Stay consistent and crush your goals!`,
    metadata: { action: 'view_workout' },
    sendEmailNotification: true
  });
}

// Create achievement notification
async function createAchievementNotification(userId, achievement) {
  return createNotification(userId, {
    type: NOTIFICATION_TYPES.ACHIEVEMENT,
    title: 'Achievement Unlocked!',
    message: achievement.message,
    metadata: { achievement: achievement.type, badge: achievement.badge },
    sendEmailNotification: true
  });
}

// Create progress notification
async function createProgressNotification(userId, progressData) {
  return createNotification(userId, {
    type: NOTIFICATION_TYPES.PROGRESS,
    title: 'Progress Update',
    message: progressData.message,
    metadata: progressData
  });
}

// Clean up old notifications (older than 30 days)
function cleanupOldNotifications() {
  const stmt = db.prepare(`
    DELETE FROM notifications
    WHERE created_at < datetime('now', '-30 days')
  `);
  const result = stmt.run();
  if (result.changes > 0) {
    console.log(`🧹 Cleaned up ${result.changes} old notifications`);
  }
}

// Run cleanup daily
setInterval(cleanupOldNotifications, 24 * 60 * 60 * 1000);

module.exports = {
  NOTIFICATION_TYPES,
  createNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  createWelcomeNotification,
  createWorkoutReminder,
  createAchievementNotification,
  createProgressNotification,
  cleanupOldNotifications
};
