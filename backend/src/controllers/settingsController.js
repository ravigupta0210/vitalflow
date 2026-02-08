const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Get user settings
const getSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get settings or create default if not exists
    let settings = db.prepare(`
      SELECT * FROM user_settings WHERE user_id = ?
    `).get(userId);

    if (!settings) {
      // Create default settings
      const id = uuidv4();
      db.prepare(`
        INSERT INTO user_settings (id, user_id)
        VALUES (?, ?)
      `).run(id, userId);

      settings = db.prepare(`
        SELECT * FROM user_settings WHERE user_id = ?
      `).get(userId);
    }

    // Convert integer booleans to actual booleans
    const formattedSettings = {
      id: settings.id,
      notifications: {
        email: Boolean(settings.email_notifications),
        push: Boolean(settings.push_notifications),
        weeklyReport: Boolean(settings.weekly_report),
        workoutReminders: Boolean(settings.workout_reminders)
      },
      appearance: {
        darkMode: Boolean(settings.dark_mode),
        language: settings.language,
        measurementUnit: settings.measurement_unit
      },
      privacy: {
        twoFactorAuth: Boolean(settings.two_factor_auth),
        dataSharing: Boolean(settings.data_sharing)
      },
      updatedAt: settings.updated_at
    };

    res.json({
      success: true,
      settings: formattedSettings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch settings'
    });
  }
};

// Update user settings
const updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notifications, appearance, privacy } = req.body;

    // Check if settings exist
    let settings = db.prepare(`
      SELECT id FROM user_settings WHERE user_id = ?
    `).get(userId);

    if (!settings) {
      // Create settings if not exists
      const id = uuidv4();
      db.prepare(`
        INSERT INTO user_settings (id, user_id)
        VALUES (?, ?)
      `).run(id, userId);
    }

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (notifications) {
      if (notifications.email !== undefined) {
        updates.push('email_notifications = ?');
        params.push(notifications.email ? 1 : 0);
      }
      if (notifications.push !== undefined) {
        updates.push('push_notifications = ?');
        params.push(notifications.push ? 1 : 0);
      }
      if (notifications.weeklyReport !== undefined) {
        updates.push('weekly_report = ?');
        params.push(notifications.weeklyReport ? 1 : 0);
      }
      if (notifications.workoutReminders !== undefined) {
        updates.push('workout_reminders = ?');
        params.push(notifications.workoutReminders ? 1 : 0);
      }
    }

    if (appearance) {
      if (appearance.darkMode !== undefined) {
        updates.push('dark_mode = ?');
        params.push(appearance.darkMode ? 1 : 0);
      }
      if (appearance.language !== undefined) {
        updates.push('language = ?');
        params.push(appearance.language);
      }
      if (appearance.measurementUnit !== undefined) {
        updates.push('measurement_unit = ?');
        params.push(appearance.measurementUnit);
      }
    }

    if (privacy) {
      if (privacy.twoFactorAuth !== undefined) {
        updates.push('two_factor_auth = ?');
        params.push(privacy.twoFactorAuth ? 1 : 0);
      }
      if (privacy.dataSharing !== undefined) {
        updates.push('data_sharing = ?');
        params.push(privacy.dataSharing ? 1 : 0);
      }
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(userId);

      db.prepare(`
        UPDATE user_settings
        SET ${updates.join(', ')}
        WHERE user_id = ?
      `).run(...params);
    }

    // Fetch and return updated settings
    const updatedSettings = db.prepare(`
      SELECT * FROM user_settings WHERE user_id = ?
    `).get(userId);

    const formattedSettings = {
      id: updatedSettings.id,
      notifications: {
        email: Boolean(updatedSettings.email_notifications),
        push: Boolean(updatedSettings.push_notifications),
        weeklyReport: Boolean(updatedSettings.weekly_report),
        workoutReminders: Boolean(updatedSettings.workout_reminders)
      },
      appearance: {
        darkMode: Boolean(updatedSettings.dark_mode),
        language: updatedSettings.language,
        measurementUnit: updatedSettings.measurement_unit
      },
      privacy: {
        twoFactorAuth: Boolean(updatedSettings.two_factor_auth),
        dataSharing: Boolean(updatedSettings.data_sharing)
      },
      updatedAt: updatedSettings.updated_at
    };

    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: formattedSettings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings'
    });
  }
};

module.exports = {
  getSettings,
  updateSettings
};
