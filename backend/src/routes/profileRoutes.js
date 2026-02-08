const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const db = require('../config/database');
const { calculateHealthMetrics } = require('../utils/healthCalculations');

// All profile routes require authentication
router.use(authenticateJWT);

// Get full profile
router.get('/', (req, res) => {
  try {
    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(req.user.id);
    const conditions = db.prepare('SELECT * FROM medical_conditions WHERE user_id = ?').all(req.user.id);
    const goals = db.prepare('SELECT * FROM health_goals WHERE user_id = ?').all(req.user.id);

    res.json({
      success: true,
      data: {
        profile: profile ? {
          age: profile.age,
          gender: profile.gender,
          heightCm: profile.height_cm,
          weightKg: profile.weight_kg,
          dietType: profile.diet_type,
          activityLevel: profile.activity_level,
          sleepHours: profile.sleep_hours,
          sleepQuality: profile.sleep_quality,
          workType: profile.work_type,
          stressLevel: profile.stress_level,
          waterIntake: profile.water_intake_liters,
          smoking: Boolean(profile.smoking),
          alcohol: profile.alcohol,
          bmi: profile.bmi,
          bmr: profile.bmr,
          tdee: profile.tdee,
          targetCalories: profile.target_calories
        } : null,
        conditions: conditions.map(c => ({
          id: c.id,
          type: c.condition_type,
          severity: c.severity,
          notes: c.notes
        })),
        goals: goals.map(g => ({
          id: g.id,
          type: g.goal_type,
          priority: g.priority,
          progress: g.progress_percentage,
          status: g.status
        }))
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to get profile' });
  }
});

// Update basic profile
router.put('/basic', (req, res) => {
  try {
    const { age, gender, heightCm, weightKg, dietType, activityLevel } = req.body;

    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(req.user.id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    // Recalculate metrics
    const metrics = calculateHealthMetrics({
      age: age || profile.age,
      gender: gender || profile.gender,
      heightCm: heightCm || profile.height_cm,
      weightKg: weightKg || profile.weight_kg,
      activityLevel: activityLevel || profile.activity_level
    });

    db.prepare(`
      UPDATE user_profiles SET
        age = COALESCE(?, age),
        gender = COALESCE(?, gender),
        height_cm = COALESCE(?, height_cm),
        weight_kg = COALESCE(?, weight_kg),
        diet_type = COALESCE(?, diet_type),
        activity_level = COALESCE(?, activity_level),
        bmi = ?, bmr = ?, tdee = ?, target_calories = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(
      age, gender, heightCm, weightKg, dietType, activityLevel,
      metrics.bmi, metrics.bmr, metrics.tdee, metrics.targetCalories,
      req.user.id
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { metrics }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// Get health summary
router.get('/health-summary', (req, res) => {
  try {
    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(req.user.id);
    const goals = db.prepare('SELECT * FROM health_goals WHERE user_id = ?').all(req.user.id);

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    // Calculate metrics
    const metrics = calculateHealthMetrics({
      age: profile.age,
      gender: profile.gender,
      heightCm: profile.height_cm,
      weightKg: profile.weight_kg,
      activityLevel: profile.activity_level,
      goals: goals.map(g => g.goal_type)
    });

    res.json({
      success: true,
      data: {
        currentWeight: profile.weight_kg,
        idealWeight: metrics.idealWeight,
        bmi: metrics.bmi,
        bmiCategory: metrics.bmiCategory,
        bmr: metrics.bmr,
        tdee: metrics.tdee,
        targetCalories: metrics.targetCalories,
        macros: metrics.macros,
        recommendedWater: metrics.waterIntake
      }
    });
  } catch (error) {
    console.error('Get health summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to get health summary' });
  }
});

module.exports = router;
