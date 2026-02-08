const express = require('express');
const router = express.Router();
const { authenticateJWT, requireOnboarding } = require('../middleware/auth');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const aggregationService = require('../services/aggregationService');
const { invalidateUserCache } = require('../services/cacheService');

// All diet routes require authentication and onboarding
router.use(authenticateJWT, requireOnboarding);

// Get active diet plan (cached) - returns instantly if exists
router.get('/active', (req, res) => {
  try {
    const activePlan = db.prepare(`
      SELECT * FROM diet_plans WHERE user_id = ? AND is_active = 1 LIMIT 1
    `).get(req.user.id);

    if (!activePlan) {
      return res.json({
        success: true,
        data: null,
        message: 'No active diet plan. Generate one to get started.'
      });
    }

    // Get all days with meals
    const days = db.prepare('SELECT * FROM meal_days WHERE diet_plan_id = ? ORDER BY day_number')
      .all(activePlan.id);

    const daysWithMeals = days.map(day => {
      const meals = db.prepare('SELECT * FROM meals WHERE meal_day_id = ? ORDER BY order_index')
        .all(day.id);

      return {
        day_number: day.day_number,
        day_name: day.day_name,
        total_calories: day.total_calories,
        meals: meals.map(m => ({
          meal_type: m.meal_type,
          name: m.name,
          description: m.description,
          calories: m.calories,
          protein_grams: m.protein_grams,
          carbs_grams: m.carbs_grams,
          fats_grams: m.fats_grams,
          fiber_grams: m.fiber_grams,
          ingredients: m.ingredients ? JSON.parse(m.ingredients) : [],
          recipe_instructions: m.recipe_instructions,
          prep_time_mins: m.prep_time_mins,
          cook_time_mins: m.cook_time_mins,
          image_url: m.image_url
        }))
      };
    });

    res.json({
      success: true,
      data: {
        planId: activePlan.id,
        title: activePlan.title,
        description: activePlan.description,
        daily_calories: activePlan.daily_calories,
        protein_grams: activePlan.protein_grams,
        carbs_grams: activePlan.carbs_grams,
        fats_grams: activePlan.fats_grams,
        fiber_grams: activePlan.fiber_grams,
        days: daysWithMeals,
        grocery_list: [],
        meal_prep_tips: [],
        cached: true,
        generatedAt: activePlan.ai_generated_at
      }
    });
  } catch (error) {
    console.error('Get active diet plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to get active diet plan' });
  }
});

// Get all diet plans
router.get('/plans', (req, res) => {
  try {
    const plans = db.prepare(`
      SELECT * FROM diet_plans WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id);

    res.json({
      success: true,
      data: plans.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        dailyCalories: p.daily_calories,
        dietType: p.diet_type,
        goalFocus: p.goal_focus,
        isActive: Boolean(p.is_active),
        createdAt: p.created_at
      }))
    });
  } catch (error) {
    console.error('Get diet plans error:', error);
    res.status(500).json({ success: false, message: 'Failed to get diet plans' });
  }
});

// Get specific diet plan with meals
router.get('/plans/:id', (req, res) => {
  try {
    const plan = db.prepare('SELECT * FROM diet_plans WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Diet plan not found' });
    }

    const days = db.prepare('SELECT * FROM meal_days WHERE diet_plan_id = ? ORDER BY day_number')
      .all(plan.id);

    const daysWithMeals = days.map(day => {
      const meals = db.prepare('SELECT * FROM meals WHERE meal_day_id = ? ORDER BY order_index')
        .all(day.id);

      return {
        id: day.id,
        dayNumber: day.day_number,
        dayName: day.day_name,
        totalCalories: day.total_calories,
        meals: meals.map(m => ({
          id: m.id,
          type: m.meal_type,
          name: m.name,
          description: m.description,
          calories: m.calories,
          protein: m.protein_grams,
          carbs: m.carbs_grams,
          fats: m.fats_grams,
          fiber: m.fiber_grams,
          ingredients: m.ingredients ? JSON.parse(m.ingredients) : [],
          recipe: m.recipe_instructions,
          prepTime: m.prep_time_mins,
          cookTime: m.cook_time_mins,
          imageUrl: m.image_url
        }))
      };
    });

    res.json({
      success: true,
      data: {
        id: plan.id,
        title: plan.title,
        description: plan.description,
        dailyCalories: plan.daily_calories,
        protein: plan.protein_grams,
        carbs: plan.carbs_grams,
        fats: plan.fats_grams,
        fiber: plan.fiber_grams,
        dietType: plan.diet_type,
        goalFocus: plan.goal_focus,
        restrictions: plan.restrictions ? JSON.parse(plan.restrictions) : [],
        isActive: Boolean(plan.is_active),
        days: daysWithMeals
      }
    });
  } catch (error) {
    console.error('Get diet plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to get diet plan' });
  }
});

// Generate new diet plan (calls Python AI service)
router.post('/generate', async (req, res) => {
  try {
    const { restrictions, cuisine, mealsPerDay, budget, forceRegenerate } = req.body;

    // Check if user already has an active plan (return cached if not forcing regenerate)
    if (!forceRegenerate) {
      const existingPlan = db.prepare(`
        SELECT * FROM diet_plans WHERE user_id = ? AND is_active = 1 LIMIT 1
      `).get(req.user.id);

      if (existingPlan) {
        // Return cached plan
        const days = db.prepare('SELECT * FROM meal_days WHERE diet_plan_id = ? ORDER BY day_number')
          .all(existingPlan.id);

        const daysWithMeals = days.map(day => {
          const meals = db.prepare('SELECT * FROM meals WHERE meal_day_id = ? ORDER BY order_index')
            .all(day.id);

          return {
            day_number: day.day_number,
            day_name: day.day_name,
            total_calories: day.total_calories,
            meals: meals.map(m => ({
              meal_type: m.meal_type,
              name: m.name,
              description: m.description,
              calories: m.calories,
              protein_grams: m.protein_grams,
              carbs_grams: m.carbs_grams,
              fats_grams: m.fats_grams,
              fiber_grams: m.fiber_grams,
              ingredients: m.ingredients ? JSON.parse(m.ingredients) : [],
              recipe_instructions: m.recipe_instructions,
              prep_time_mins: m.prep_time_mins,
              cook_time_mins: m.cook_time_mins,
              image_url: m.image_url
            }))
          };
        });

        return res.json({
          success: true,
          message: 'Returning cached diet plan',
          data: {
            planId: existingPlan.id,
            title: existingPlan.title,
            description: existingPlan.description,
            daily_calories: existingPlan.daily_calories,
            protein_grams: existingPlan.protein_grams,
            carbs_grams: existingPlan.carbs_grams,
            fats_grams: existingPlan.fats_grams,
            fiber_grams: existingPlan.fiber_grams,
            days: daysWithMeals,
            grocery_list: [],
            meal_prep_tips: [],
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

    const response = await axios.post(`${AI_SERVICE_URL}/generate-diet`, {
      profile: {
        age: profile.age,
        gender: profile.gender,
        weight: profile.weight_kg,
        height: profile.height_cm,
        activityLevel: profile.activity_level,
        dietType: profile.diet_type,
        targetCalories: profile.target_calories,
        bmi: profile.bmi
      },
      goals: goals.map(g => g.goal_type),
      conditions: conditions.map(c => c.condition_type),
      questionnaire: questionnaire.reduce((acc, q) => {
        acc[`${q.goal_type}_${q.question_key}`] = q.answer;
        return acc;
      }, {}),
      preferences: {
        restrictions: restrictions || [],
        cuisine: cuisine || 'indian',
        mealsPerDay: mealsPerDay || 5,
        budget: budget || 'moderate'
      }
    });

    const generatedPlan = response.data;

    // Deactivate existing plans
    db.prepare('UPDATE diet_plans SET is_active = 0 WHERE user_id = ?').run(req.user.id);

    // Save generated plan to database
    const planId = uuidv4();
    db.prepare(`
      INSERT INTO diet_plans (id, user_id, title, description, daily_calories, protein_grams, carbs_grams, fats_grams, fiber_grams, diet_type, goal_focus, restrictions, ai_generated_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 1)
    `).run(
      planId,
      req.user.id,
      generatedPlan.title,
      generatedPlan.description,
      generatedPlan.daily_calories,
      generatedPlan.protein_grams,
      generatedPlan.carbs_grams,
      generatedPlan.fats_grams,
      generatedPlan.fiber_grams || 25,
      profile.diet_type,
      goals[0]?.goal_type,
      JSON.stringify(restrictions || [])
    );

    // Save meal days and meals
    if (generatedPlan.days) {
      const insertDay = db.prepare(`
        INSERT INTO meal_days (id, diet_plan_id, day_number, day_name, total_calories)
        VALUES (?, ?, ?, ?, ?)
      `);

      const insertMeal = db.prepare(`
        INSERT INTO meals (id, meal_day_id, meal_type, name, description, calories, protein_grams, carbs_grams, fats_grams, fiber_grams, ingredients, recipe_instructions, prep_time_mins, cook_time_mins, image_url, order_index)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      generatedPlan.days.forEach((day, dayIndex) => {
        const dayId = uuidv4();
        insertDay.run(
          dayId,
          planId,
          day.day_number || dayIndex + 1,
          day.day_name,
          day.total_calories
        );

        if (day.meals) {
          day.meals.forEach((meal, mealIndex) => {
            insertMeal.run(
              uuidv4(),
              dayId,
              meal.meal_type,
              meal.name,
              meal.description,
              meal.calories,
              meal.protein_grams,
              meal.carbs_grams,
              meal.fats_grams,
              meal.fiber_grams,
              JSON.stringify(meal.ingredients || []),
              meal.recipe_instructions,
              meal.prep_time_mins,
              meal.cook_time_mins,
              meal.image_url,
              mealIndex
            );
          });
        }
      });
    }

    res.json({
      success: true,
      message: 'Diet plan generated successfully',
      data: { planId, ...generatedPlan }
    });
  } catch (error) {
    console.error('Generate diet error:', error);

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'AI service is not available. Please ensure the Python AI service is running.'
      });
    }

    res.status(500).json({ success: false, message: 'Failed to generate diet plan' });
  }
});

// Get today's meals
router.get('/today', (req, res) => {
  try {
    const activePlan = db.prepare(`
      SELECT * FROM diet_plans WHERE user_id = ? AND is_active = 1 LIMIT 1
    `).get(req.user.id);

    if (!activePlan) {
      return res.json({
        success: true,
        data: null,
        message: 'No active diet plan'
      });
    }

    // Get current day of week
    const dayOfWeek = new Date().getDay();
    const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;

    const mealDay = db.prepare(`
      SELECT * FROM meal_days WHERE diet_plan_id = ? AND day_number = ?
    `).get(activePlan.id, adjustedDay);

    if (!mealDay) {
      return res.json({
        success: true,
        data: { planTitle: activePlan.title, meals: [] }
      });
    }

    const meals = db.prepare(`
      SELECT * FROM meals WHERE meal_day_id = ? ORDER BY order_index
    `).all(mealDay.id);

    res.json({
      success: true,
      data: {
        planTitle: activePlan.title,
        dayName: mealDay.day_name,
        totalCalories: mealDay.total_calories,
        meals: meals.map(m => ({
          id: m.id,
          type: m.meal_type,
          name: m.name,
          description: m.description,
          calories: m.calories,
          protein: m.protein_grams,
          carbs: m.carbs_grams,
          fats: m.fats_grams,
          ingredients: m.ingredients ? JSON.parse(m.ingredients) : [],
          recipe: m.recipe_instructions,
          prepTime: m.prep_time_mins,
          cookTime: m.cook_time_mins,
          imageUrl: m.image_url
        }))
      }
    });
  } catch (error) {
    console.error('Get today meals error:', error);
    res.status(500).json({ success: false, message: 'Failed to get today\'s meals' });
  }
});

// Log food intake
router.post('/log', async (req, res) => {
  try {
    const { mealType, foodName, calories, protein, carbs, fats, fiber, quantity, notes, mealId } = req.body;
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    if (!mealType || !foodName) {
      return res.status(400).json({
        success: false,
        message: 'Meal type and food name are required'
      });
    }

    db.prepare(`
      INSERT INTO food_logs (id, user_id, meal_id, meal_type, food_name, calories, protein_grams, carbs_grams, fats_grams, quantity, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      userId,
      mealId || null,
      mealType,
      foodName,
      calories || null,
      protein || null,
      carbs || null,
      fats || null,
      quantity || null,
      notes || null
    );

    // Update aggregations for live tracking
    const todaySummary = aggregationService.updateNutritionDailySummary(userId, today);
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
      message: 'Food logged successfully',
      data: {
        todaySummary,
        streaks,
        goalProgress
      }
    });
  } catch (error) {
    console.error('Log food error:', error);
    res.status(500).json({ success: false, message: 'Failed to log food' });
  }
});

// Get nutrition stats
router.get('/nutrition/:range', (req, res) => {
  try {
    const { range } = req.params;
    let days = 7;

    switch (range) {
      case 'week': days = 7; break;
      case 'month': days = 30; break;
      default: days = 7;
    }

    const logs = db.prepare(`
      SELECT
        DATE(logged_at) as date,
        SUM(calories) as total_calories,
        SUM(protein_grams) as total_protein,
        SUM(carbs_grams) as total_carbs,
        SUM(fats_grams) as total_fats
      FROM food_logs
      WHERE user_id = ? AND logged_at >= date('now', '-${days} days')
      GROUP BY DATE(logged_at)
      ORDER BY date ASC
    `).all(req.user.id);

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Get nutrition stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get nutrition stats' });
  }
});

// Get comprehensive diet data with AI insights
router.get('/comprehensive', async (req, res) => {
  try {
    // Get user profile
    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(req.user.id);
    const goals = db.prepare('SELECT goal_type FROM health_goals WHERE user_id = ?').all(req.user.id);
    const conditions = db.prepare('SELECT condition_type FROM medical_conditions WHERE user_id = ?').all(req.user.id);

    // Get active plan with all days
    const activePlan = db.prepare(`
      SELECT * FROM diet_plans WHERE user_id = ? AND is_active = 1 LIMIT 1
    `).get(req.user.id);

    let planDetails = null;
    if (activePlan) {
      const days = db.prepare('SELECT * FROM meal_days WHERE diet_plan_id = ? ORDER BY day_number').all(activePlan.id);
      const daysWithMeals = days.map(day => {
        const meals = db.prepare('SELECT * FROM meals WHERE meal_day_id = ? ORDER BY order_index').all(day.id);
        return {
          id: day.id,
          dayNumber: day.day_number,
          dayName: day.day_name,
          totalCalories: day.total_calories,
          meals: meals.map(m => ({
            id: m.id,
            type: m.meal_type,
            name: m.name,
            description: m.description,
            calories: m.calories,
            protein: m.protein_grams,
            carbs: m.carbs_grams,
            fats: m.fats_grams,
            fiber: m.fiber_grams,
            ingredients: m.ingredients ? JSON.parse(m.ingredients) : [],
            recipe: m.recipe_instructions,
            prepTime: m.prep_time_mins,
            benefits: m.description
          }))
        };
      });

      planDetails = {
        id: activePlan.id,
        title: activePlan.title,
        description: activePlan.description,
        dailyCalories: activePlan.daily_calories,
        protein: activePlan.protein_grams,
        carbs: activePlan.carbs_grams,
        fats: activePlan.fats_grams,
        dietType: activePlan.diet_type,
        goalFocus: activePlan.goal_focus,
        days: daysWithMeals
      };
    }

    // Get weekly nutrition stats
    const weekStats = db.prepare(`
      SELECT
        COUNT(DISTINCT DATE(logged_at)) as days_tracked,
        SUM(calories) as total_calories,
        SUM(protein_grams) as total_protein
      FROM food_logs
      WHERE user_id = ? AND logged_at >= date('now', '-7 days')
    `).get(req.user.id);

    // Calculate targets based on profile
    const tdee = profile?.tdee || 2000;
    const targets = {
      calories: profile?.target_calories || tdee,
      protein: Math.round((profile?.weight_kg || 70) * 1.6),
      carbs: Math.round(tdee * 0.45 / 4),
      fats: Math.round(tdee * 0.25 / 9)
    };

    // Generate AI nutrition tips
    let aiTips = [];
    try {
      const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/analyze-health`, {
        profile: {
          age: profile?.age,
          gender: profile?.gender,
          height: profile?.height_cm,
          weight: profile?.weight_kg,
          dietType: profile?.diet_type,
          activityLevel: profile?.activity_level
        },
        goals: goals.map(g => g.goal_type),
        conditions: conditions.map(c => c.condition_type)
      });
      aiTips = aiResponse.data.healthTips || [];
    } catch (aiErr) {
      console.log('AI tips fetch failed, using defaults');
      aiTips = [
        'Eat protein with every meal for satiety',
        'Include fiber-rich foods for better digestion',
        'Stay hydrated throughout the day'
      ];
    }

    // Food logs for history
    const recentLogs = db.prepare(`
      SELECT * FROM food_logs
      WHERE user_id = ?
      ORDER BY logged_at DESC
      LIMIT 20
    `).all(req.user.id);

    res.json({
      success: true,
      data: {
        profile: {
          name: profile?.first_name || 'User',
          dietType: profile?.diet_type || 'balanced',
          targetCalories: profile?.target_calories,
          weight: profile?.weight_kg,
          height: profile?.height_cm
        },
        goals: goals.map(g => ({
          type: g.goal_type,
          label: g.goal_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        })),
        conditions: conditions.map(c => c.condition_type),
        activePlan: planDetails,
        targets,
        stats: (() => {
          // Get real streak and adherence data
          const streaks = db.prepare('SELECT * FROM user_streaks WHERE user_id = ?').get(req.user.id);
          // Calculate real adherence from nutrition summaries
          const adherenceData = db.prepare(`
            SELECT AVG(completion_percentage) as avg_adherence
            FROM nutrition_daily_summaries
            WHERE user_id = ? AND date >= date('now', '-7 days')
          `).get(req.user.id);
          return {
            daysTracked: weekStats?.days_tracked || 0,
            avgCalories: weekStats?.total_calories ? Math.round(weekStats.total_calories / Math.max(weekStats.days_tracked, 1)) : 0,
            avgProtein: weekStats?.total_protein ? Math.round(weekStats.total_protein / Math.max(weekStats.days_tracked, 1)) : 0,
            adherence: Math.round(adherenceData?.avg_adherence || 0),
            streak: streaks?.diet_current_streak || 0,
            longestStreak: streaks?.diet_longest_streak || 0,
            consistencyScore: streaks?.overall_consistency_score || 0
          };
        })(),
        recentLogs: recentLogs.map(l => ({
          id: l.id,
          mealType: l.meal_type,
          foodName: l.food_name,
          calories: l.calories,
          loggedAt: l.logged_at
        })),
        aiTips
      }
    });
  } catch (error) {
    console.error('Get comprehensive diet error:', error);
    res.status(500).json({ success: false, message: 'Failed to get diet data' });
  }
});

// Get diet history
router.get('/history', (req, res) => {
  try {
    // Group food logs by date
    const logs = db.prepare(`
      SELECT
        DATE(logged_at) as date,
        COUNT(*) as meals_logged,
        SUM(calories) as total_calories,
        SUM(protein_grams) as total_protein
      FROM food_logs
      WHERE user_id = ?
      GROUP BY DATE(logged_at)
      ORDER BY date DESC
      LIMIT 30
    `).all(req.user.id);

    res.json({
      success: true,
      data: logs.map(l => ({
        date: l.date,
        mealsCompleted: l.meals_logged,
        totalMeals: 4,
        calories: l.total_calories || 0
      }))
    });
  } catch (error) {
    console.error('Get diet history error:', error);
    res.status(500).json({ success: false, message: 'Failed to get diet history' });
  }
});

// Activate diet plan
router.post('/plans/:id/activate', (req, res) => {
  try {
    const plan = db.prepare('SELECT id FROM diet_plans WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Diet plan not found' });
    }

    db.prepare('UPDATE diet_plans SET is_active = 0 WHERE user_id = ?').run(req.user.id);
    db.prepare('UPDATE diet_plans SET is_active = 1 WHERE id = ?').run(req.params.id);

    res.json({
      success: true,
      message: 'Diet plan activated'
    });
  } catch (error) {
    console.error('Activate diet plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to activate plan' });
  }
});

// Delete diet plan
router.delete('/plans/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM diet_plans WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Diet plan not found' });
    }

    res.json({
      success: true,
      message: 'Diet plan deleted'
    });
  } catch (error) {
    console.error('Delete diet plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete plan' });
  }
});

module.exports = router;
