const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

/**
 * Push Notification Service
 * Handles device token registration and push notification sending
 *
 * Note: For actual push notification delivery, you'll need to:
 * 1. Set up Firebase Cloud Messaging (FCM) for Android
 * 2. Set up Apple Push Notification service (APNs) for iOS
 * 3. Add firebase-admin package and configure it
 *
 * This service provides the database layer and structure for push notifications.
 * The actual sending logic will need to be implemented once Firebase is configured.
 */

/**
 * Register a device token for push notifications
 * @param {string} userId - User ID
 * @param {string} token - Device token (FCM or APNs)
 * @param {string} platform - Platform ('android' or 'ios')
 * @param {string} deviceName - Optional device name
 * @returns {object} - Device token record
 */
const registerDeviceToken = (userId, token, platform, deviceName = null) => {
  // Check if token already exists
  const existing = db.prepare(`
    SELECT * FROM device_tokens WHERE token = ?
  `).get(token);

  if (existing) {
    // Update existing token - might have different user now
    db.prepare(`
      UPDATE device_tokens
      SET user_id = ?, platform = ?, device_name = ?, is_active = 1, updated_at = CURRENT_TIMESTAMP
      WHERE token = ?
    `).run(userId, platform, deviceName, token);

    return {
      id: existing.id,
      userId,
      token,
      platform,
      deviceName,
      isActive: true
    };
  }

  // Create new token
  const id = uuidv4();
  db.prepare(`
    INSERT INTO device_tokens (id, user_id, token, platform, device_name)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, userId, token, platform, deviceName);

  return {
    id,
    userId,
    token,
    platform,
    deviceName,
    isActive: true
  };
};

/**
 * Remove a device token (on logout or manual unregister)
 * @param {string} token - Device token to remove
 */
const unregisterDeviceToken = (token) => {
  db.prepare(`
    DELETE FROM device_tokens WHERE token = ?
  `).run(token);
};

/**
 * Deactivate a device token (soft delete - keeps record for debugging)
 * @param {string} token - Device token to deactivate
 */
const deactivateDeviceToken = (token) => {
  db.prepare(`
    UPDATE device_tokens
    SET is_active = 0, updated_at = CURRENT_TIMESTAMP
    WHERE token = ?
  `).run(token);
};

/**
 * Get all active device tokens for a user
 * @param {string} userId - User ID
 * @returns {array} - Array of device tokens
 */
const getUserDeviceTokens = (userId) => {
  return db.prepare(`
    SELECT * FROM device_tokens
    WHERE user_id = ? AND is_active = 1
  `).all(userId);
};

/**
 * Send push notification to a user
 * This is a placeholder that stores the notification in the database
 * and logs what would be sent. Actual push delivery requires FCM/APNs setup.
 *
 * @param {string} userId - User ID to send notification to
 * @param {object} notification - Notification payload
 * @param {string} notification.title - Notification title
 * @param {string} notification.body - Notification body
 * @param {object} notification.data - Optional data payload
 * @returns {object} - Result of push attempt
 */
const sendPushNotification = async (userId, notification) => {
  const { title, body, data = {} } = notification;

  // Get user's device tokens
  const tokens = getUserDeviceTokens(userId);

  if (tokens.length === 0) {
    console.log(`[Push] No device tokens found for user ${userId}`);
    return { success: false, reason: 'no_tokens' };
  }

  // Also store as in-app notification
  const notificationId = uuidv4();
  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, message, metadata)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    notificationId,
    userId,
    data.type || 'push',
    title,
    body,
    JSON.stringify(data)
  );

  // In production, you would:
  // 1. Import firebase-admin
  // 2. Initialize with service account
  // 3. Use admin.messaging().sendMulticast()

  console.log(`[Push] Would send to ${tokens.length} device(s):`, {
    userId,
    title,
    body,
    tokens: tokens.map(t => ({ platform: t.platform, token: t.token.substring(0, 20) + '...' }))
  });

  // Placeholder for actual FCM implementation:
  /*
  const admin = require('firebase-admin');

  const message = {
    notification: { title, body },
    data: { ...data, click_action: 'FLUTTER_NOTIFICATION_CLICK' },
    tokens: tokens.map(t => t.token)
  };

  try {
    const response = await admin.messaging().sendMulticast(message);
    console.log(`[Push] Sent ${response.successCount} successful, ${response.failureCount} failed`);

    // Handle failed tokens
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.log(`[Push] Failed token: ${tokens[idx].token}`, resp.error);
          // Deactivate invalid tokens
          if (resp.error?.code === 'messaging/invalid-registration-token' ||
              resp.error?.code === 'messaging/registration-token-not-registered') {
            deactivateDeviceToken(tokens[idx].token);
          }
        }
      });
    }

    return { success: true, successCount: response.successCount, failureCount: response.failureCount };
  } catch (error) {
    console.error('[Push] Error sending:', error);
    return { success: false, reason: 'send_error', error: error.message };
  }
  */

  return { success: true, tokens: tokens.length, notificationId };
};

/**
 * Send push notification to multiple users
 * @param {array} userIds - Array of user IDs
 * @param {object} notification - Notification payload
 */
const sendPushNotificationToMany = async (userIds, notification) => {
  const results = await Promise.all(
    userIds.map(userId => sendPushNotification(userId, notification))
  );
  return results;
};

/**
 * Send workout reminder push notification
 * @param {string} userId - User ID
 */
const sendWorkoutReminder = async (userId) => {
  return sendPushNotification(userId, {
    title: "Time to Work Out!",
    body: "Your workout is waiting. Let's crush those goals!",
    data: {
      type: 'workout_reminder',
      action: 'open_workouts'
    }
  });
};

/**
 * Send meal reminder push notification
 * @param {string} userId - User ID
 * @param {string} mealType - Type of meal (breakfast, lunch, dinner, snack)
 */
const sendMealReminder = async (userId, mealType) => {
  const mealMessages = {
    breakfast: "Good morning! Time to log your breakfast.",
    lunch: "Lunch time! Don't forget to log what you eat.",
    dinner: "Evening! Remember to log your dinner.",
    snack: "Had a snack? Log it to track your nutrition."
  };

  return sendPushNotification(userId, {
    title: "Meal Reminder",
    body: mealMessages[mealType] || "Time to log your meal!",
    data: {
      type: 'meal_reminder',
      mealType,
      action: 'open_diet'
    }
  });
};

/**
 * Send streak notification
 * @param {string} userId - User ID
 * @param {number} streakDays - Number of days in streak
 */
const sendStreakNotification = async (userId, streakDays) => {
  return sendPushNotification(userId, {
    title: `${streakDays} Day Streak!`,
    body: `You're on fire! Keep up the great work!`,
    data: {
      type: 'streak_achievement',
      streakDays,
      action: 'open_dashboard'
    }
  });
};

/**
 * Send goal achieved notification
 * @param {string} userId - User ID
 * @param {string} goalName - Name of achieved goal
 */
const sendGoalAchievedNotification = async (userId, goalName) => {
  return sendPushNotification(userId, {
    title: "Goal Achieved!",
    body: `Congratulations! You've reached your ${goalName} goal!`,
    data: {
      type: 'goal_achieved',
      goalName,
      action: 'open_profile'
    }
  });
};

module.exports = {
  registerDeviceToken,
  unregisterDeviceToken,
  deactivateDeviceToken,
  getUserDeviceTokens,
  sendPushNotification,
  sendPushNotificationToMany,
  sendWorkoutReminder,
  sendMealReminder,
  sendStreakNotification,
  sendGoalAchievedNotification
};
