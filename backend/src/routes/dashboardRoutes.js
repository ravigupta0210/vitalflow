const express = require('express');
const router = express.Router();
const { authenticateJWT, requireOnboarding } = require('../middleware/auth');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { getCache, setCache, invalidateUserCache } = require('../services/cacheService');
const aggregationService = require('../services/aggregationService');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

// All dashboard routes require authentication and onboarding
router.use(authenticateJWT);

// Get dashboard overview
router.get('/', requireOnboarding, (req, res) => {
  try {
    const userId = req.user.id;

    // Check cache first
    const cached = getCache(userId, 'dashboard');
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    // Wrap all reads in a transaction for consistency
    const today = new Date().toISOString().split('T')[0];
    const getDashboardData = db.transaction((uid) => {
      const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(uid);
      const goals = db.prepare('SELECT * FROM health_goals WHERE user_id = ? ORDER BY priority').all(uid);
      const recentInsights = db.prepare(`
        SELECT * FROM health_insights WHERE user_id = ?
        ORDER BY created_at DESC LIMIT 5
      `).all(uid);
      const todayMetrics = db.prepare(`
        SELECT * FROM health_metrics WHERE user_id = ? AND date = ?
      `).get(uid, today);
      const activeWorkout = db.prepare(`
        SELECT * FROM workout_plans WHERE user_id = ? AND is_active = 1 LIMIT 1
      `).get(uid);
      const activeDiet = db.prepare(`
        SELECT * FROM diet_plans WHERE user_id = ? AND is_active = 1 LIMIT 1
      `).get(uid);
      return { profile, goals, recentInsights, todayMetrics, activeWorkout, activeDiet };
    });

    const { profile, goals, recentInsights, todayMetrics, activeWorkout, activeDiet } = getDashboardData(userId);

    const data = {
      healthScore: calculateHealthScore(profile, goals, todayMetrics),
      profile: {
        bmi: profile?.bmi,
        targetCalories: profile?.target_calories,
        waterIntake: profile?.water_intake_liters
      },
      goals: goals.map(g => ({
        id: g.id,
        type: g.goal_type,
        priority: g.priority,
        progress: g.progress_percentage,
        status: g.status
      })),
      insights: recentInsights.map(i => ({
        id: i.id,
        type: i.insight_type,
        title: i.title,
        content: i.content,
        priority: i.priority,
        isRead: Boolean(i.is_read),
        createdAt: i.created_at
      })),
      todayMetrics: todayMetrics ? {
        weight: todayMetrics.weight_kg,
        water: todayMetrics.water_intake_liters,
        sleep: todayMetrics.sleep_hours,
        steps: todayMetrics.steps,
        mood: todayMetrics.mood,
        energy: todayMetrics.energy_level
      } : null,
      activePlans: {
        workout: activeWorkout ? { id: activeWorkout.id, title: activeWorkout.title } : null,
        diet: activeDiet ? { id: activeDiet.id, title: activeDiet.title } : null
      }
    };

    // Cache the response
    setCache(userId, 'dashboard', data);

    res.json({ success: true, data });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to load dashboard' });
  }
});

// Calculate health score (0-100)
function calculateHealthScore(profile, goals, metrics) {
  let score = 50; // Base score

  if (!profile) return score;

  // BMI contribution (up to 20 points)
  if (profile.bmi) {
    if (profile.bmi >= 18.5 && profile.bmi < 25) score += 20;
    else if (profile.bmi >= 17 && profile.bmi < 30) score += 10;
    else score += 5;
  }

  // Activity level (up to 15 points)
  const activityPoints = {
    sedentary: 0,
    light: 5,
    moderate: 10,
    active: 15,
    very_active: 15
  };
  score += activityPoints[profile.activity_level] || 0;

  // Sleep (up to 10 points)
  if (profile.sleep_hours >= 7 && profile.sleep_hours <= 9) score += 10;
  else if (profile.sleep_hours >= 6) score += 5;

  // Water intake (up to 5 points)
  if (profile.water_intake_liters >= 2) score += 5;
  else if (profile.water_intake_liters >= 1.5) score += 3;

  // Goals progress (up to 10 points)
  if (goals.length > 0) {
    const avgProgress = goals.reduce((sum, g) => sum + (g.progress_percentage || 0), 0) / goals.length;
    score += Math.round(avgProgress / 10);
  }

  return Math.min(Math.max(score, 0), 100);
}

// Log daily metrics
router.post('/metrics', requireOnboarding, (req, res) => {
  try {
    const userId = req.user.id;
    const { weight, water, sleep, steps, mood, energy, notes } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // Check if entry exists
    const existing = db.prepare(`
      SELECT id FROM health_metrics WHERE user_id = ? AND date = ?
    `).get(userId, today);

    if (existing) {
      // Update existing
      db.prepare(`
        UPDATE health_metrics SET
          weight_kg = COALESCE(?, weight_kg),
          water_intake_liters = COALESCE(?, water_intake_liters),
          sleep_hours = COALESCE(?, sleep_hours),
          steps = COALESCE(?, steps),
          mood = COALESCE(?, mood),
          energy_level = COALESCE(?, energy_level),
          notes = COALESCE(?, notes)
        WHERE id = ?
      `).run(weight, water, sleep, steps, mood, energy, notes, existing.id);
    } else {
      // Create new
      db.prepare(`
        INSERT INTO health_metrics (id, user_id, date, weight_kg, water_intake_liters, sleep_hours, steps, mood, energy_level, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), userId, today, weight, water, sleep, steps, mood, energy, notes);
    }

    // Update profile weight if provided
    if (weight) {
      db.prepare('UPDATE user_profiles SET weight_kg = ? WHERE user_id = ?').run(weight, userId);
    }

    // Invalidate cache after mutation
    invalidateUserCache(userId);

    res.json({
      success: true,
      message: 'Metrics logged successfully'
    });
  } catch (error) {
    console.error('Log metrics error:', error);
    res.status(500).json({ success: false, message: 'Failed to log metrics' });
  }
});

// Get metrics history
router.get('/metrics/:range', requireOnboarding, (req, res) => {
  try {
    const { range } = req.params;
    let days = 7;

    switch (range) {
      case 'week': days = 7; break;
      case 'month': days = 30; break;
      case '3months': days = 90; break;
      default: days = 7;
    }

    const metrics = db.prepare(`
      SELECT * FROM health_metrics
      WHERE user_id = ? AND date >= date('now', '-${days} days')
      ORDER BY date ASC
    `).all(req.user.id);

    res.json({
      success: true,
      data: metrics.map(m => ({
        date: m.date,
        weight: m.weight_kg,
        water: m.water_intake_liters,
        sleep: m.sleep_hours,
        steps: m.steps,
        mood: m.mood,
        energy: m.energy_level
      }))
    });
  } catch (error) {
    console.error('Get metrics history error:', error);
    res.status(500).json({ success: false, message: 'Failed to get metrics history' });
  }
});

// ============================================
// REAL-TIME PROGRESS ENDPOINTS
// ============================================

// Get today's live progress (instant response)
router.get('/progress/today', requireOnboarding, (req, res) => {
  try {
    const userId = req.user.id;

    // Check cache first for very fast response
    const cached = getCache(userId, 'progress');
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const todaySummary = aggregationService.getTodaySummary(userId);

    // Cache for 10 seconds
    setCache(userId, 'progress', todaySummary);

    res.json({ success: true, data: todaySummary });
  } catch (error) {
    console.error('Get today progress error:', error);
    res.status(500).json({ success: false, message: 'Failed to get today\'s progress' });
  }
});

// Get weekly progress trends
router.get('/progress/weekly', requireOnboarding, (req, res) => {
  try {
    const userId = req.user.id;

    const weeklyProgress = aggregationService.getWeeklyProgress(userId);

    res.json({ success: true, data: weeklyProgress });
  } catch (error) {
    console.error('Get weekly progress error:', error);
    res.status(500).json({ success: false, message: 'Failed to get weekly progress' });
  }
});

// Get real-time goal progress
router.get('/goals/live', requireOnboarding, (req, res) => {
  try {
    const userId = req.user.id;

    // Get goals with latest progress
    const goals = db.prepare(`
      SELECT hg.*,
        (SELECT progress_percentage FROM goal_progress_history
         WHERE goal_id = hg.id ORDER BY date DESC LIMIT 1) as latest_progress
      FROM health_goals hg
      WHERE user_id = ? AND status = 'active'
      ORDER BY priority
    `).all(userId);

    // Get streaks for additional context
    const streaks = db.prepare('SELECT * FROM user_streaks WHERE user_id = ?').get(userId);

    res.json({
      success: true,
      data: {
        goals: goals.map(g => ({
          id: g.id,
          type: g.goal_type,
          priority: g.priority,
          progress: g.progress_percentage || g.latest_progress || 0,
          status: g.status,
          targetValue: g.target_value
        })),
        streaks: streaks ? {
          workout: {
            current: streaks.workout_current_streak,
            longest: streaks.workout_longest_streak
          },
          diet: {
            current: streaks.diet_current_streak,
            longest: streaks.diet_longest_streak
          },
          overall: {
            current: streaks.overall_current_streak,
            consistencyScore: streaks.overall_consistency_score
          }
        } : null
      }
    });
  } catch (error) {
    console.error('Get live goals error:', error);
    res.status(500).json({ success: false, message: 'Failed to get live goals' });
  }
});

// Get recent AI adaptations/suggestions
router.get('/adaptations', requireOnboarding, (req, res) => {
  try {
    const userId = req.user.id;

    const adaptations = db.prepare(`
      SELECT * FROM ai_adaptation_log
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).all(userId);

    res.json({
      success: true,
      data: adaptations.map(a => ({
        id: a.id,
        type: a.adaptation_type,
        reason: a.trigger_reason,
        recommendations: a.recommendations ? JSON.parse(a.recommendations) : [],
        confidence: a.confidence_score,
        wasApplied: Boolean(a.was_applied),
        createdAt: a.created_at
      }))
    });
  } catch (error) {
    console.error('Get adaptations error:', error);
    res.status(500).json({ success: false, message: 'Failed to get adaptations' });
  }
});

// ============================================
// INSIGHTS & AI ENDPOINTS
// ============================================

// Get AI-generated insights
router.get('/insights', requireOnboarding, (req, res) => {
  try {
    const userId = req.user.id;

    // Check cache first
    const cached = getCache(userId, 'insights');
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const insights = db.prepare(`
      SELECT * FROM health_insights WHERE user_id = ?
      ORDER BY created_at DESC LIMIT 10
    `).all(userId);

    const data = insights.map(i => ({
      id: i.id,
      type: i.insight_type,
      title: i.title,
      content: i.content,
      priority: i.priority,
      isRead: Boolean(i.is_read),
      createdAt: i.created_at
    }));

    // Cache the response
    setCache(userId, 'insights', data);

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({ success: false, message: 'Failed to get insights' });
  }
});

// Get daily tips
router.get('/daily-tips', requireOnboarding, (req, res) => {
  try {
    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(req.user.id);
    const goals = db.prepare('SELECT goal_type FROM health_goals WHERE user_id = ?').all(req.user.id);

    // Generate contextual tips based on profile and goals
    const tips = generateDailyTips(profile, goals.map(g => g.goal_type));

    res.json({
      success: true,
      data: tips
    });
  } catch (error) {
    console.error('Get daily tips error:', error);
    res.status(500).json({ success: false, message: 'Failed to get daily tips' });
  }
});

// Generate basic daily tips (will be enhanced by AI service)
function generateDailyTips(profile, goals) {
  const tips = [];

  // Water tip
  tips.push({
    category: 'hydration',
    title: 'Stay Hydrated',
    content: `Aim to drink at least ${profile?.water_intake_liters || 2}L of water today. Proper hydration helps with energy and metabolism.`
  });

  // Sleep tip
  if (profile?.sleep_hours < 7) {
    tips.push({
      category: 'sleep',
      title: 'Improve Sleep',
      content: 'You\'re sleeping less than 7 hours. Try to wind down 30 minutes before bed without screens.'
    });
  }

  // Goal-specific tips
  if (goals.includes('weight_loss')) {
    tips.push({
      category: 'nutrition',
      title: 'Weight Loss Tip',
      content: 'Focus on protein-rich meals to stay full longer. Include vegetables in every meal.'
    });
  }

  if (goals.includes('muscle_gain')) {
    tips.push({
      category: 'fitness',
      title: 'Muscle Building Tip',
      content: 'Progressive overload is key. Try to increase weight or reps slightly each week.'
    });
  }

  return tips;
}

// Get comprehensive dashboard data with AI insights
router.get('/comprehensive', requireOnboarding, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check cache first for instant response
    const cached = getCache(userId, 'comprehensive');
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    // Wrap all reads in a transaction for consistency
    const getComprehensiveData = db.transaction((uid) => {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(uid);
      const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(uid);
      const goals = db.prepare('SELECT * FROM health_goals WHERE user_id = ? ORDER BY priority').all(uid);
      const conditions = db.prepare('SELECT * FROM medical_conditions WHERE user_id = ?').all(uid);
      const questionnaire = db.prepare('SELECT * FROM goal_questionnaires WHERE user_id = ?').all(uid);
      const metricsHistory = db.prepare(`
        SELECT * FROM health_metrics WHERE user_id = ?
        AND date >= date('now', '-30 days') ORDER BY date ASC
      `).all(uid);
      const activeWorkout = db.prepare(`SELECT * FROM workout_plans WHERE user_id = ? AND is_active = 1 LIMIT 1`).get(uid);
      const activeDiet = db.prepare(`SELECT * FROM diet_plans WHERE user_id = ? AND is_active = 1 LIMIT 1`).get(uid);
      return { user, profile, goals, conditions, questionnaire, metricsHistory, activeWorkout, activeDiet };
    });

    const { user, profile, goals, conditions, questionnaire, metricsHistory, activeWorkout, activeDiet } = getComprehensiveData(userId);

    // Build user context for AI
    const userContext = {
      profile: {
        age: profile?.age,
        gender: profile?.gender,
        height: profile?.height_cm,
        weight: profile?.weight_kg,
        bmi: profile?.bmi,
        bmr: profile?.bmr,
        tdee: profile?.tdee,
        targetCalories: profile?.target_calories,
        dietType: profile?.diet_type,
        activityLevel: profile?.activity_level,
        sleepHours: profile?.sleep_hours,
        workType: profile?.work_type,
        stressLevel: profile?.stress_level,
        waterIntake: profile?.water_intake_liters,
        smoking: profile?.smoking,
        alcohol: profile?.alcohol
      },
      goals: goals.map(g => g.goal_type),
      conditions: conditions.map(c => c.condition_type),
      questionnaire: questionnaire.reduce((acc, q) => {
        acc[q.question_key] = q.answer;
        return acc;
      }, {})
    };

    // Check if we have cached AI insights first (fast path)
    let aiInsights = getCache(userId, 'aiInsights');

    // If no cached AI insights, try to get from AI service with SHORT timeout
    if (!aiInsights) {
      try {
        // Use very short timeout (3s) - if AI is slow, use fallback
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/analyze-health`, userContext, { timeout: 3000 });
        aiInsights = aiResponse.data;
        // Cache AI insights for 5 minutes
        setCache(userId, 'aiInsights', aiInsights);
      } catch (aiErr) {
        console.log('AI insights timeout/unavailable, using fallback');
        aiInsights = null;
      }
    }

    // Calculate health score
    const healthScore = calculateHealthScore(profile, goals, null);

    // Format chart data
    const weightData = metricsHistory.filter(m => m.weight_kg).map(m => ({ date: m.date, value: m.weight_kg }));
    const sleepData = metricsHistory.filter(m => m.sleep_hours).map(m => ({ date: m.date, value: m.sleep_hours }));
    const waterData = metricsHistory.filter(m => m.water_intake_liters).map(m => ({ date: m.date, value: m.water_intake_liters }));
    const energyData = metricsHistory.filter(m => m.energy_level).map(m => ({ date: m.date, value: m.energy_level }));

    // BMI category
    const bmiCategory = getBMICategory(profile?.bmi);

    // Build the response data object
    const data = {
      user: {
        id: user.id,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User',
        email: user.email
      },
      healthScore,
      profile: {
        age: profile?.age,
        gender: profile?.gender,
        height: profile?.height_cm,
        weight: profile?.weight_kg,
        dietType: profile?.diet_type,
        activityLevel: profile?.activity_level,
        sleepHours: profile?.sleep_hours,
        workType: profile?.work_type,
        stressLevel: profile?.stress_level,
        waterIntake: profile?.water_intake_liters,
        smoking: Boolean(profile?.smoking),
        alcohol: profile?.alcohol
      },
      metrics: {
        bmi: { value: profile?.bmi, category: bmiCategory.category, color: bmiCategory.color },
        bmr: profile?.bmr,
        tdee: profile?.tdee,
        targetCalories: profile?.target_calories,
        idealWeight: calculateIdealWeight(profile?.height_cm, profile?.gender)
      },
      goals: goals.map(g => ({
        id: g.id,
        type: g.goal_type,
        label: formatGoalLabel(g.goal_type),
        priority: g.priority,
        progress: g.progress_percentage || 0,
        status: g.status
      })),
      conditions: conditions.map(c => ({
        type: c.condition_type,
        label: formatConditionLabel(c.condition_type),
        severity: c.severity
      })),
      charts: {
        weight: weightData,
        sleep: sleepData,
        water: waterData,
        energy: energyData,
        macroDistribution: calculateMacroDistribution(profile),
        activityBreakdown: calculateActivityBreakdown(profile)
      },
      activePlans: {
        workout: activeWorkout ? {
          id: activeWorkout.id,
          title: activeWorkout.title,
          description: activeWorkout.description,
          difficulty: activeWorkout.difficulty_level,
          weeks: activeWorkout.duration_weeks
        } : null,
        diet: activeDiet ? {
          id: activeDiet.id,
          title: activeDiet.title,
          description: activeDiet.description,
          dailyCalories: activeDiet.daily_calories
        } : null
      },
      aiInsights: aiInsights || generateFallbackInsights(profile, goals),
      questionnaireAnswers: userContext.questionnaire
    };

    // Cache the response for 60 seconds
    setCache(userId, 'comprehensive', data);

    res.json({ success: true, data });
  } catch (error) {
    console.error('Comprehensive dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to load dashboard data' });
  }
});

// Update profile and trigger AI regeneration
router.put('/profile', requireOnboarding, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      age, gender, height, weight, dietType, activityLevel,
      sleepHours, workType, stressLevel, waterIntake, smoking, alcohol,
      goals, conditions, regenerateAI = true
    } = req.body;

    // Update profile
    const updateFields = [];
    const updateValues = [];

    if (age !== undefined) { updateFields.push('age = ?'); updateValues.push(age); }
    if (gender !== undefined) { updateFields.push('gender = ?'); updateValues.push(gender); }
    if (height !== undefined) { updateFields.push('height_cm = ?'); updateValues.push(height); }
    if (weight !== undefined) { updateFields.push('weight_kg = ?'); updateValues.push(weight); }
    if (dietType !== undefined) { updateFields.push('diet_type = ?'); updateValues.push(dietType); }
    if (activityLevel !== undefined) { updateFields.push('activity_level = ?'); updateValues.push(activityLevel); }
    if (sleepHours !== undefined) { updateFields.push('sleep_hours = ?'); updateValues.push(sleepHours); }
    if (workType !== undefined) { updateFields.push('work_type = ?'); updateValues.push(workType); }
    if (stressLevel !== undefined) { updateFields.push('stress_level = ?'); updateValues.push(stressLevel); }
    if (waterIntake !== undefined) { updateFields.push('water_intake_liters = ?'); updateValues.push(waterIntake); }
    if (smoking !== undefined) { updateFields.push('smoking = ?'); updateValues.push(smoking ? 1 : 0); }
    if (alcohol !== undefined) { updateFields.push('alcohol = ?'); updateValues.push(alcohol); }

    // Recalculate metrics if height/weight changed
    if (height !== undefined || weight !== undefined) {
      const profile = db.prepare('SELECT height_cm, weight_kg, age, gender, activity_level FROM user_profiles WHERE user_id = ?').get(userId);
      const h = height || profile.height_cm;
      const w = weight || profile.weight_kg;
      const a = age || profile.age;
      const g = gender || profile.gender;
      const act = activityLevel || profile.activity_level;

      const bmi = w / Math.pow(h / 100, 2);
      const bmr = g === 'male'
        ? Math.round(10 * w + 6.25 * h - 5 * a + 5)
        : Math.round(10 * w + 6.25 * h - 5 * a - 161);

      const activityMultipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
      const tdee = Math.round(bmr * (activityMultipliers[act] || 1.55));

      updateFields.push('bmi = ?', 'bmr = ?', 'tdee = ?', 'target_calories = ?');
      updateValues.push(Math.round(bmi * 10) / 10, bmr, tdee, tdee);
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(userId);
      db.prepare(`UPDATE user_profiles SET ${updateFields.join(', ')} WHERE user_id = ?`).run(...updateValues);
    }

    // Update goals if provided
    if (goals && Array.isArray(goals)) {
      db.prepare('DELETE FROM health_goals WHERE user_id = ?').run(userId);
      const insertGoal = db.prepare('INSERT INTO health_goals (id, user_id, goal_type, priority, status) VALUES (?, ?, ?, ?, ?)');
      goals.forEach((goal, idx) => {
        insertGoal.run(uuidv4(), userId, goal, idx + 1, 'active');
      });
    }

    // Update conditions if provided
    if (conditions && Array.isArray(conditions)) {
      db.prepare('DELETE FROM medical_conditions WHERE user_id = ?').run(userId);
      const insertCondition = db.prepare('INSERT INTO medical_conditions (id, user_id, condition_type, severity) VALUES (?, ?, ?, ?)');
      conditions.forEach(condition => {
        if (condition !== 'none') {
          insertCondition.run(uuidv4(), userId, condition, 'moderate');
        }
      });
    }

    // Deactivate old AI-generated plans if regeneration requested
    if (regenerateAI) {
      db.prepare('UPDATE workout_plans SET is_active = 0 WHERE user_id = ?').run(userId);
      db.prepare('UPDATE diet_plans SET is_active = 0 WHERE user_id = ?').run(userId);
    }

    // Invalidate cache after profile update
    invalidateUserCache(userId);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      regenerationRequired: regenerateAI
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// Get full user context for AI services
router.get('/context', requireOnboarding, (req, res) => {
  try {
    const userId = req.user.id;

    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId);
    const goals = db.prepare('SELECT goal_type FROM health_goals WHERE user_id = ? ORDER BY priority').all(userId);
    const conditions = db.prepare('SELECT condition_type FROM medical_conditions WHERE user_id = ?').all(userId);
    const questionnaire = db.prepare('SELECT question_key, answer FROM goal_questionnaires WHERE user_id = ?').all(userId);

    res.json({
      success: true,
      data: {
        profile: {
          age: profile?.age,
          gender: profile?.gender,
          heightCm: profile?.height_cm,
          weightKg: profile?.weight_kg,
          bmi: profile?.bmi,
          bmr: profile?.bmr,
          tdee: profile?.tdee,
          targetCalories: profile?.target_calories,
          dietType: profile?.diet_type,
          activityLevel: profile?.activity_level,
          sleepHours: profile?.sleep_hours,
          workType: profile?.work_type,
          stressLevel: profile?.stress_level,
          waterIntake: profile?.water_intake_liters,
          smoking: Boolean(profile?.smoking),
          alcohol: profile?.alcohol
        },
        goals: goals.map(g => g.goal_type),
        conditions: conditions.map(c => c.condition_type),
        questionnaire: questionnaire.reduce((acc, q) => {
          acc[q.question_key] = q.answer;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Get context error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user context' });
  }
});

// Helper functions
function getBMICategory(bmi) {
  if (!bmi) return { category: 'Unknown', color: 'gray' };
  if (bmi < 18.5) return { category: 'Underweight', color: 'yellow' };
  if (bmi < 25) return { category: 'Normal', color: 'green' };
  if (bmi < 30) return { category: 'Overweight', color: 'orange' };
  return { category: 'Obese', color: 'red' };
}

function calculateIdealWeight(heightCm, gender) {
  if (!heightCm) return null;
  const heightM = heightCm / 100;
  return {
    min: Math.round(18.5 * heightM * heightM),
    max: Math.round(24.9 * heightM * heightM),
    optimal: Math.round((gender === 'male' ? 22 : 21.5) * heightM * heightM)
  };
}

function formatGoalLabel(goalType) {
  const labels = {
    weight_loss: 'Weight Loss', muscle_gain: 'Muscle Gain', improve_fitness: 'Improve Fitness',
    better_sleep: 'Better Sleep', stress_management: 'Stress Management', increase_energy: 'Increase Energy',
    diabetes_management: 'Diabetes Management', heart_health: 'Heart Health', flexibility: 'Flexibility',
    pcod_management: 'PCOD Management', thyroid_management: 'Thyroid Management', general_wellness: 'General Wellness'
  };
  return labels[goalType] || goalType;
}

function formatConditionLabel(conditionType) {
  const labels = {
    diabetes: 'Diabetes', hypertension: 'Hypertension', heart_condition: 'Heart Condition',
    thyroid: 'Thyroid Disorder', pcod: 'PCOD/PCOS', asthma: 'Asthma', arthritis: 'Arthritis',
    back_pain: 'Back Pain'
  };
  return labels[conditionType] || conditionType;
}

function calculateMacroDistribution(profile) {
  if (!profile?.target_calories) return null;
  const cals = profile.target_calories;
  // Default balanced macros
  return {
    protein: Math.round(cals * 0.3 / 4), // 30% protein, 4 cal/g
    carbs: Math.round(cals * 0.4 / 4),   // 40% carbs, 4 cal/g
    fats: Math.round(cals * 0.3 / 9)     // 30% fats, 9 cal/g
  };
}

function calculateActivityBreakdown(profile) {
  const activityLevel = profile?.activity_level || 'moderate';
  const breakdowns = {
    sedentary: { exercise: 5, walking: 10, standing: 15, sitting: 70 },
    light: { exercise: 10, walking: 20, standing: 20, sitting: 50 },
    moderate: { exercise: 20, walking: 25, standing: 25, sitting: 30 },
    active: { exercise: 30, walking: 30, standing: 25, sitting: 15 },
    very_active: { exercise: 40, walking: 30, standing: 20, sitting: 10 }
  };
  return breakdowns[activityLevel] || breakdowns.moderate;
}

function generateFallbackInsights(profile, goals) {
  const insights = [];

  if (profile?.bmi) {
    const bmiCat = getBMICategory(profile.bmi);
    insights.push({
      type: 'health',
      title: 'BMI Analysis',
      content: `Your BMI is ${profile.bmi} (${bmiCat.category}). ${bmiCat.category === 'Normal' ? 'Great job maintaining a healthy weight!' : 'Focus on gradual lifestyle changes for improvement.'}`,
      priority: 'high'
    });
  }

  if (profile?.sleep_hours < 7) {
    insights.push({
      type: 'lifestyle',
      title: 'Sleep Improvement Needed',
      content: `You're averaging ${profile.sleep_hours} hours of sleep. Aim for 7-9 hours for optimal recovery and health.`,
      priority: 'high'
    });
  }

  goals.forEach(g => {
    insights.push({
      type: 'goal',
      title: `${formatGoalLabel(g.goal_type)} Progress`,
      content: `Your ${formatGoalLabel(g.goal_type).toLowerCase()} journey is active. Stay consistent with your plan!`,
      priority: 'normal'
    });
  });

  return { insights, generatedAt: new Date().toISOString() };
}

module.exports = router;
