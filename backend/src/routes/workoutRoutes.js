const express = require('express');
const router = express.Router();
const { authenticateJWT, requireOnboarding } = require('../middleware/auth');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const aggregationService = require('../services/aggregationService');
const { invalidateUserCache } = require('../services/cacheService');

// All workout routes require authentication and onboarding
router.use(authenticateJWT, requireOnboarding);

// Get all workout plans
router.get('/plans', (req, res) => {
  try {
    const plans = db.prepare(`
      SELECT * FROM workout_plans WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id);

    res.json({
      success: true,
      data: plans.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        durationWeeks: p.duration_weeks,
        difficulty: p.difficulty_level,
        goalFocus: p.goal_focus,
        isActive: Boolean(p.is_active),
        createdAt: p.created_at
      }))
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ success: false, message: 'Failed to get workout plans' });
  }
});

// Get active workout plan (cached) - returns instantly if exists
router.get('/active', (req, res) => {
  try {
    const activePlan = db.prepare(`
      SELECT * FROM workout_plans WHERE user_id = ? AND is_active = 1 LIMIT 1
    `).get(req.user.id);

    if (!activePlan) {
      return res.json({
        success: true,
        data: null,
        message: 'No active workout plan. Generate one to get started.'
      });
    }

    // Get all days with exercises
    const days = db.prepare('SELECT * FROM workout_days WHERE plan_id = ? ORDER BY day_number')
      .all(activePlan.id);

    const daysWithExercises = days.map(day => {
      const exercises = db.prepare('SELECT * FROM exercises WHERE workout_day_id = ? ORDER BY order_index')
        .all(day.id);

      return {
        day_number: day.day_number,
        day_name: day.day_name,
        focus_area: day.focus_area,
        estimated_duration_mins: day.estimated_duration_mins,
        exercises: exercises.map(e => ({
          name: e.name,
          description: e.description,
          sets: e.sets,
          reps: e.reps,
          rest_seconds: e.rest_seconds,
          weight_suggestion: e.weight_suggestion,
          video_url: e.video_url,
          image_url: e.image_url,
          notes: e.notes
        }))
      };
    });

    res.json({
      success: true,
      data: {
        planId: activePlan.id,
        title: activePlan.title,
        description: activePlan.description,
        duration_weeks: activePlan.duration_weeks,
        difficulty_level: activePlan.difficulty_level,
        goal_focus: activePlan.goal_focus,
        equipment: activePlan.equipment_needed ? JSON.parse(activePlan.equipment_needed) : [],
        days: daysWithExercises,
        weekly_tips: [],
        safety_notes: [],
        cached: true,
        generatedAt: activePlan.ai_generated_at
      }
    });
  } catch (error) {
    console.error('Get active plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to get active workout plan' });
  }
});

// Get specific workout plan with days and exercises
router.get('/plans/:id', (req, res) => {
  try {
    const plan = db.prepare('SELECT * FROM workout_plans WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Workout plan not found' });
    }

    const days = db.prepare('SELECT * FROM workout_days WHERE plan_id = ? ORDER BY day_number')
      .all(plan.id);

    const daysWithExercises = days.map(day => {
      const exercises = db.prepare('SELECT * FROM exercises WHERE workout_day_id = ? ORDER BY order_index')
        .all(day.id);

      return {
        id: day.id,
        dayNumber: day.day_number,
        dayName: day.day_name,
        focusArea: day.focus_area,
        duration: day.estimated_duration_mins,
        exercises: exercises.map(e => ({
          id: e.id,
          name: e.name,
          description: e.description,
          sets: e.sets,
          reps: e.reps,
          rest: e.rest_seconds,
          weight: e.weight_suggestion,
          videoUrl: e.video_url,
          imageUrl: e.image_url,
          notes: e.notes
        }))
      };
    });

    res.json({
      success: true,
      data: {
        id: plan.id,
        title: plan.title,
        description: plan.description,
        durationWeeks: plan.duration_weeks,
        difficulty: plan.difficulty_level,
        goalFocus: plan.goal_focus,
        equipment: plan.equipment_needed ? JSON.parse(plan.equipment_needed) : [],
        isActive: Boolean(plan.is_active),
        days: daysWithExercises
      }
    });
  } catch (error) {
    console.error('Get plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to get workout plan' });
  }
});

// Generate new workout plan (calls Python AI service)
router.post('/generate', async (req, res) => {
  try {
    const { equipment, daysPerWeek, duration, focus, forceRegenerate } = req.body;

    // Check if user already has an active plan (return cached if not forcing regenerate)
    if (!forceRegenerate) {
      const existingPlan = db.prepare(`
        SELECT * FROM workout_plans WHERE user_id = ? AND is_active = 1 LIMIT 1
      `).get(req.user.id);

      if (existingPlan) {
        // Return cached plan
        const days = db.prepare('SELECT * FROM workout_days WHERE plan_id = ? ORDER BY day_number')
          .all(existingPlan.id);

        const daysWithExercises = days.map(day => {
          const exercises = db.prepare('SELECT * FROM exercises WHERE workout_day_id = ? ORDER BY order_index')
            .all(day.id);

          return {
            day_number: day.day_number,
            day_name: day.day_name,
            focus_area: day.focus_area,
            estimated_duration_mins: day.estimated_duration_mins,
            exercises: exercises.map(e => ({
              name: e.name,
              description: e.description,
              sets: e.sets,
              reps: e.reps,
              rest_seconds: e.rest_seconds,
              weight_suggestion: e.weight_suggestion,
              video_url: e.video_url,
              image_url: e.image_url,
              notes: e.notes
            }))
          };
        });

        return res.json({
          success: true,
          message: 'Returning cached workout plan',
          data: {
            planId: existingPlan.id,
            title: existingPlan.title,
            description: existingPlan.description,
            duration_weeks: existingPlan.duration_weeks,
            difficulty_level: existingPlan.difficulty_level,
            goal_focus: existingPlan.goal_focus,
            equipment: existingPlan.equipment_needed ? JSON.parse(existingPlan.equipment_needed) : [],
            days: daysWithExercises,
            weekly_tips: [],
            safety_notes: [],
            cached: true,
            generatedAt: existingPlan.ai_generated_at
          }
        });
      }
    }

    // Get user profile and goals
    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(req.user.id);
    const goals = db.prepare('SELECT goal_type FROM health_goals WHERE user_id = ?').all(req.user.id);
    const conditions = db.prepare('SELECT condition_type FROM medical_conditions WHERE user_id = ?').all(req.user.id);
    const questionnaire = db.prepare('SELECT * FROM goal_questionnaires WHERE user_id = ?').all(req.user.id);

    // Call Python AI service
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

    const response = await axios.post(`${AI_SERVICE_URL}/generate-workout`, {
      profile: {
        age: profile.age,
        gender: profile.gender,
        weight: profile.weight_kg,
        height: profile.height_cm,
        activityLevel: profile.activity_level,
        bmi: profile.bmi
      },
      goals: goals.map(g => g.goal_type),
      conditions: conditions.map(c => c.condition_type),
      questionnaire: questionnaire.reduce((acc, q) => {
        acc[`${q.goal_type}_${q.question_key}`] = q.answer;
        return acc;
      }, {}),
      preferences: {
        equipment: equipment || 'minimal',
        daysPerWeek: daysPerWeek || 5,
        durationMins: duration || 45,
        focus: focus || goals[0]?.goal_type
      }
    });

    const generatedPlan = response.data;

    // Deactivate existing plans
    db.prepare('UPDATE workout_plans SET is_active = 0 WHERE user_id = ?').run(req.user.id);

    // Save generated plan to database
    const planId = uuidv4();
    db.prepare(`
      INSERT INTO workout_plans (id, user_id, title, description, duration_weeks, difficulty_level, goal_focus, equipment_needed, ai_generated_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 1)
    `).run(
      planId,
      req.user.id,
      generatedPlan.title,
      generatedPlan.description,
      generatedPlan.duration_weeks || 4,
      generatedPlan.difficulty_level,
      generatedPlan.goal_focus,
      JSON.stringify(generatedPlan.equipment || [])
    );

    // Save workout days and exercises
    if (generatedPlan.days) {
      const insertDay = db.prepare(`
        INSERT INTO workout_days (id, plan_id, day_number, day_name, focus_area, estimated_duration_mins)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const insertExercise = db.prepare(`
        INSERT INTO exercises (id, workout_day_id, name, description, sets, reps, rest_seconds, weight_suggestion, video_url, image_url, notes, order_index)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      generatedPlan.days.forEach((day, dayIndex) => {
        const dayId = uuidv4();
        insertDay.run(
          dayId,
          planId,
          day.day_number || dayIndex + 1,
          day.day_name,
          day.focus_area,
          day.estimated_duration_mins || 45
        );

        if (day.exercises) {
          day.exercises.forEach((exercise, exIndex) => {
            insertExercise.run(
              uuidv4(),
              dayId,
              exercise.name,
              exercise.description,
              exercise.sets,
              exercise.reps,
              exercise.rest_seconds || 60,
              exercise.weight_suggestion,
              exercise.video_url,
              exercise.image_url,
              exercise.notes,
              exIndex
            );
          });
        }
      });
    }

    res.json({
      success: true,
      message: 'Workout plan generated successfully',
      data: { planId, ...generatedPlan }
    });
  } catch (error) {
    console.error('Generate workout error:', error);

    // If AI service is unavailable, return a helpful message
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'AI service is not available. Please ensure the Python AI service is running.'
      });
    }

    res.status(500).json({ success: false, message: 'Failed to generate workout plan' });
  }
});

// Get today's workout
router.get('/today', (req, res) => {
  try {
    const activePlan = db.prepare(`
      SELECT * FROM workout_plans WHERE user_id = ? AND is_active = 1 LIMIT 1
    `).get(req.user.id);

    if (!activePlan) {
      return res.json({
        success: true,
        data: null,
        message: 'No active workout plan'
      });
    }

    // Get current day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = new Date().getDay();
    const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek; // Sunday becomes 7

    const workoutDay = db.prepare(`
      SELECT * FROM workout_days WHERE plan_id = ? AND day_number = ?
    `).get(activePlan.id, adjustedDay);

    if (!workoutDay) {
      return res.json({
        success: true,
        data: { isRestDay: true, planTitle: activePlan.title }
      });
    }

    const exercises = db.prepare(`
      SELECT * FROM exercises WHERE workout_day_id = ? ORDER BY order_index
    `).all(workoutDay.id);

    res.json({
      success: true,
      data: {
        planTitle: activePlan.title,
        dayName: workoutDay.day_name,
        focusArea: workoutDay.focus_area,
        duration: workoutDay.estimated_duration_mins,
        exercises: exercises.map(e => ({
          id: e.id,
          name: e.name,
          description: e.description,
          sets: e.sets,
          reps: e.reps,
          rest: e.rest_seconds,
          weight: e.weight_suggestion,
          videoUrl: e.video_url,
          imageUrl: e.image_url,
          notes: e.notes
        }))
      }
    });
  } catch (error) {
    console.error('Get today workout error:', error);
    res.status(500).json({ success: false, message: 'Failed to get today\'s workout' });
  }
});

// Log workout completion
router.post('/log', async (req, res) => {
  try {
    const { workoutDayId, exercises, duration, notes } = req.body;
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // Log each exercise
    if (exercises && exercises.length > 0) {
      const insertLog = db.prepare(`
        INSERT INTO workout_logs (id, user_id, workout_day_id, exercise_id, sets_completed, reps_completed, weight_used, duration_mins, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      exercises.forEach(ex => {
        insertLog.run(
          uuidv4(),
          userId,
          workoutDayId,
          ex.exerciseId,
          ex.setsCompleted,
          ex.repsCompleted,
          ex.weightUsed,
          ex.duration || duration || null,
          ex.notes
        );
      });
    } else {
      // Log workout completion without exercise details
      db.prepare(`
        INSERT INTO workout_logs (id, user_id, workout_day_id, duration_mins, notes)
        VALUES (?, ?, ?, ?, ?)
      `).run(uuidv4(), userId, workoutDayId, duration, notes);
    }

    // Update aggregations for live tracking
    const todaySummary = aggregationService.updateWorkoutDailySummary(userId, today);
    const streaks = aggregationService.updateUserStreaks(userId);
    const goalProgress = aggregationService.updateGoalProgress(userId);

    // Invalidate cached data to ensure fresh reads
    invalidateUserCache(userId);

    // Trigger AI adaptation check (async, don't wait)
    aggregationService.triggerAIAdaptation(userId).catch(err => {
      console.log('AI adaptation check failed:', err.message);
    });

    res.json({
      success: true,
      message: 'Workout logged successfully',
      data: {
        todaySummary,
        streaks,
        goalProgress
      }
    });
  } catch (error) {
    console.error('Log workout error:', error);
    res.status(500).json({ success: false, message: 'Failed to log workout' });
  }
});

// Get comprehensive workout data with AI insights
router.get('/comprehensive', async (req, res) => {
  try {
    // Get user profile
    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(req.user.id);
    const goals = db.prepare('SELECT goal_type FROM health_goals WHERE user_id = ?').all(req.user.id);
    const conditions = db.prepare('SELECT condition_type FROM medical_conditions WHERE user_id = ?').all(req.user.id);

    // Get active plan with all days
    const activePlan = db.prepare(`
      SELECT * FROM workout_plans WHERE user_id = ? AND is_active = 1 LIMIT 1
    `).get(req.user.id);

    let planDetails = null;
    if (activePlan) {
      const days = db.prepare('SELECT * FROM workout_days WHERE plan_id = ? ORDER BY day_number').all(activePlan.id);
      const daysWithExercises = days.map(day => {
        const exercises = db.prepare('SELECT * FROM exercises WHERE workout_day_id = ? ORDER BY order_index').all(day.id);
        return {
          id: day.id,
          dayNumber: day.day_number,
          dayName: day.day_name,
          focusArea: day.focus_area,
          duration: day.estimated_duration_mins,
          exercises: exercises.map(e => ({
            id: e.id,
            name: e.name,
            description: e.description,
            sets: e.sets,
            reps: e.reps,
            rest: e.rest_seconds,
            weight: e.weight_suggestion,
            muscles: e.notes ? e.notes.split(',').map(m => m.trim()) : [],
            instructions: e.description,
            tips: e.notes
          }))
        };
      });

      planDetails = {
        id: activePlan.id,
        title: activePlan.title,
        description: activePlan.description,
        durationWeeks: activePlan.duration_weeks,
        difficulty: activePlan.difficulty_level,
        goalFocus: activePlan.goal_focus,
        equipment: activePlan.equipment_needed ? JSON.parse(activePlan.equipment_needed) : [],
        days: daysWithExercises
      };
    }

    // Get workout stats
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStats = db.prepare(`
      SELECT
        COUNT(*) as workouts_completed,
        SUM(duration_mins) as total_minutes
      FROM workout_logs
      WHERE user_id = ? AND completed_at >= ?
    `).get(req.user.id, weekStart.toISOString());

    // Get recent logs for progress
    const recentLogs = db.prepare(`
      SELECT wl.*, wd.day_name, wd.focus_area
      FROM workout_logs wl
      LEFT JOIN workout_days wd ON wl.workout_day_id = wd.id
      WHERE wl.user_id = ?
      ORDER BY wl.completed_at DESC
      LIMIT 7
    `).all(req.user.id);

    // Calculate muscle group progress from recent workouts (real data)
    const muscleGroupCounts = {};
    const workoutSummaries = db.prepare(`
      SELECT muscle_groups_worked FROM workout_daily_summaries
      WHERE user_id = ? AND date >= date('now', '-30 days')
    `).all(req.user.id);

    workoutSummaries.forEach(ws => {
      if (ws.muscle_groups_worked) {
        try {
          const groups = JSON.parse(ws.muscle_groups_worked);
          groups.forEach(g => {
            const normalized = g.toLowerCase();
            muscleGroupCounts[normalized] = (muscleGroupCounts[normalized] || 0) + 1;
          });
        } catch (e) { /* ignore parse errors */ }
      }
    });

    // Convert counts to progress percentage (max 30 workouts = 100%)
    const muscleProgress = {
      chest: Math.min(100, Math.round((muscleGroupCounts['chest'] || muscleGroupCounts['upper body'] || 0) / 30 * 100)),
      back: Math.min(100, Math.round((muscleGroupCounts['back'] || muscleGroupCounts['upper body'] || 0) / 30 * 100)),
      legs: Math.min(100, Math.round((muscleGroupCounts['legs'] || muscleGroupCounts['lower body'] || 0) / 30 * 100)),
      arms: Math.min(100, Math.round((muscleGroupCounts['arms'] || muscleGroupCounts['biceps'] || muscleGroupCounts['triceps'] || 0) / 30 * 100)),
      shoulders: Math.min(100, Math.round((muscleGroupCounts['shoulders'] || muscleGroupCounts['upper body'] || 0) / 30 * 100)),
      core: Math.min(100, Math.round((muscleGroupCounts['core'] || muscleGroupCounts['abs'] || 0) / 30 * 100))
    };

    // Generate AI workout tips based on profile
    let aiTips = [];
    try {
      const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/analyze-health`, {
        profile: {
          age: profile?.age,
          gender: profile?.gender,
          height: profile?.height_cm,
          weight: profile?.weight_kg,
          activityLevel: profile?.activity_level,
          bmi: profile?.bmi
        },
        goals: goals.map(g => g.goal_type),
        conditions: conditions.map(c => c.condition_type)
      });

      aiTips = aiResponse.data.healthTips || [];
    } catch (aiErr) {
      console.log('AI tips fetch failed, using defaults');
      aiTips = [
        'Warm up for 5-10 minutes before starting',
        'Stay hydrated throughout your workout',
        'Focus on proper form over heavy weights'
      ];
    }

    res.json({
      success: true,
      data: {
        profile: {
          name: profile?.first_name || 'User',
          age: profile?.age,
          weight: profile?.weight_kg,
          height: profile?.height_cm,
          activityLevel: profile?.activity_level,
          bmi: profile?.bmi
        },
        goals: goals.map(g => ({
          type: g.goal_type,
          label: g.goal_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        })),
        conditions: conditions.map(c => c.condition_type),
        activePlan: planDetails,
        stats: (() => {
          // Get real streak data
          const streaks = db.prepare('SELECT * FROM user_streaks WHERE user_id = ?').get(req.user.id);
          return {
            weeklyWorkouts: weekStats?.workouts_completed || 0,
            totalMinutes: weekStats?.total_minutes || 0,
            caloriesBurned: Math.round((weekStats?.total_minutes || 0) * 7),
            streak: streaks?.workout_current_streak || 0,
            longestStreak: streaks?.workout_longest_streak || 0,
            consistencyScore: streaks?.overall_consistency_score || 0
          };
        })(),
        muscleProgress,
        recentWorkouts: recentLogs.map(l => ({
          id: l.id,
          dayName: l.day_name || 'Workout',
          focusArea: l.focus_area,
          duration: l.duration_mins,
          completedAt: l.completed_at
        })),
        aiTips
      }
    });
  } catch (error) {
    console.error('Get comprehensive workout error:', error);
    res.status(500).json({ success: false, message: 'Failed to get workout data' });
  }
});

// Get workout history
router.get('/history', (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT wl.*, wd.day_name, wd.focus_area, wp.title as plan_title
      FROM workout_logs wl
      LEFT JOIN workout_days wd ON wl.workout_day_id = wd.id
      LEFT JOIN workout_plans wp ON wd.plan_id = wp.id
      WHERE wl.user_id = ?
      ORDER BY wl.completed_at DESC
      LIMIT 30
    `).all(req.user.id);

    res.json({
      success: true,
      data: logs.map(l => ({
        id: l.id,
        planTitle: l.plan_title,
        dayName: l.day_name,
        focusArea: l.focus_area,
        duration: l.duration_mins,
        completedAt: l.completed_at
      }))
    });
  } catch (error) {
    console.error('Get workout history error:', error);
    res.status(500).json({ success: false, message: 'Failed to get workout history' });
  }
});

// Set plan as active
router.post('/plans/:id/activate', (req, res) => {
  try {
    const plan = db.prepare('SELECT id FROM workout_plans WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Workout plan not found' });
    }

    // Deactivate all plans
    db.prepare('UPDATE workout_plans SET is_active = 0 WHERE user_id = ?').run(req.user.id);

    // Activate selected plan
    db.prepare('UPDATE workout_plans SET is_active = 1 WHERE id = ?').run(req.params.id);

    res.json({
      success: true,
      message: 'Workout plan activated'
    });
  } catch (error) {
    console.error('Activate plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to activate plan' });
  }
});

// Delete workout plan
router.delete('/plans/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM workout_plans WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Workout plan not found' });
    }

    res.json({
      success: true,
      message: 'Workout plan deleted'
    });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete plan' });
  }
});

module.exports = router;
