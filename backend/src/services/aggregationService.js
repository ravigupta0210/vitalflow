const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

// ============================================
// WORKOUT AGGREGATION
// ============================================

/**
 * Update or create workout daily summary for a user on a specific date
 */
function updateWorkoutDailySummary(userId, date = null) {
  const targetDate = date || new Date().toISOString().split('T')[0];

  try {
    // Get all workout logs for this user on this date
    const logs = db.prepare(`
      SELECT
        wl.*,
        wd.focus_area,
        wd.estimated_duration_mins,
        e.name as exercise_name
      FROM workout_logs wl
      LEFT JOIN workout_days wd ON wl.workout_day_id = wd.id
      LEFT JOIN exercises e ON wl.exercise_id = e.id
      WHERE wl.user_id = ? AND DATE(wl.completed_at) = ?
    `).all(userId, targetDate);

    if (logs.length === 0) {
      // No workouts logged, delete any existing summary for this date
      db.prepare('DELETE FROM workout_daily_summaries WHERE user_id = ? AND date = ?').run(userId, targetDate);
      return null;
    }

    // Calculate aggregated values
    const uniqueWorkouts = new Set(logs.map(l => l.workout_day_id)).size;
    const exercisesCompleted = logs.filter(l => l.exercise_id).length;
    const totalDuration = logs.reduce((sum, l) => sum + (l.duration_mins || 0), 0);
    const totalSets = logs.reduce((sum, l) => sum + (l.sets_completed || 0), 0);
    const totalReps = logs.reduce((sum, l) => {
      if (!l.reps_completed) return sum;
      const reps = parseInt(l.reps_completed) || 0;
      return sum + reps;
    }, 0);

    // Get unique muscle groups worked
    const muscleGroups = [...new Set(logs.filter(l => l.focus_area).map(l => l.focus_area))];

    // Calculate completion percentage based on active plan
    let completionPercentage = 0;
    const activePlan = db.prepare('SELECT id FROM workout_plans WHERE user_id = ? AND is_active = 1').get(userId);
    if (activePlan) {
      const totalExercisesInPlan = db.prepare(`
        SELECT COUNT(*) as total FROM exercises e
        JOIN workout_days wd ON e.workout_day_id = wd.id
        WHERE wd.plan_id = ?
      `).get(activePlan.id);
      if (totalExercisesInPlan && totalExercisesInPlan.total > 0) {
        completionPercentage = Math.min(100, (exercisesCompleted / totalExercisesInPlan.total) * 100 * 7); // Weekly basis
      }
    }

    // Estimate calories burned (rough estimate: 5-8 calories per minute of exercise)
    const caloriesBurned = Math.round(totalDuration * 6.5);

    // Check if summary exists
    const existing = db.prepare('SELECT id FROM workout_daily_summaries WHERE user_id = ? AND date = ?').get(userId, targetDate);

    if (existing) {
      // Update existing summary
      db.prepare(`
        UPDATE workout_daily_summaries SET
          workouts_completed = ?,
          exercises_completed = ?,
          total_duration_mins = ?,
          total_sets = ?,
          total_reps = ?,
          completion_percentage = ?,
          muscle_groups_worked = ?,
          calories_burned_estimate = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        uniqueWorkouts,
        exercisesCompleted,
        totalDuration,
        totalSets,
        totalReps,
        completionPercentage,
        JSON.stringify(muscleGroups),
        caloriesBurned,
        existing.id
      );
    } else {
      // Insert new summary
      db.prepare(`
        INSERT INTO workout_daily_summaries
        (id, user_id, date, workouts_completed, exercises_completed, total_duration_mins,
         total_sets, total_reps, completion_percentage, muscle_groups_worked, calories_burned_estimate)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(),
        userId,
        targetDate,
        uniqueWorkouts,
        exercisesCompleted,
        totalDuration,
        totalSets,
        totalReps,
        completionPercentage,
        JSON.stringify(muscleGroups),
        caloriesBurned
      );
    }

    return {
      date: targetDate,
      workoutsCompleted: uniqueWorkouts,
      exercisesCompleted,
      totalDuration,
      totalSets,
      totalReps,
      completionPercentage,
      muscleGroups,
      caloriesBurned
    };
  } catch (error) {
    console.error('Error updating workout daily summary:', error);
    return null;
  }
}

// ============================================
// NUTRITION AGGREGATION
// ============================================

/**
 * Update or create nutrition daily summary for a user on a specific date
 */
function updateNutritionDailySummary(userId, date = null) {
  const targetDate = date || new Date().toISOString().split('T')[0];

  try {
    // Get all food logs for this user on this date
    const logs = db.prepare(`
      SELECT * FROM food_logs
      WHERE user_id = ? AND DATE(logged_at) = ?
    `).all(userId, targetDate);

    // Get user's target nutrition from profile
    const profile = db.prepare('SELECT target_calories, tdee FROM user_profiles WHERE user_id = ?').get(userId);
    const targetCalories = profile?.target_calories || profile?.tdee || 2000;

    // Standard macro distribution targets (can be customized)
    const targetProtein = Math.round((targetCalories * 0.30) / 4); // 30% from protein
    const targetCarbs = Math.round((targetCalories * 0.45) / 4);   // 45% from carbs
    const targetFats = Math.round((targetCalories * 0.25) / 9);    // 25% from fats

    if (logs.length === 0) {
      // No food logged, delete any existing summary
      db.prepare('DELETE FROM nutrition_daily_summaries WHERE user_id = ? AND date = ?').run(userId, targetDate);
      return null;
    }

    // Calculate totals
    const mealsLogged = logs.length;
    const totalCalories = logs.reduce((sum, l) => sum + (l.calories || 0), 0);
    const totalProtein = logs.reduce((sum, l) => sum + (l.protein_grams || 0), 0);
    const totalCarbs = logs.reduce((sum, l) => sum + (l.carbs_grams || 0), 0);
    const totalFats = logs.reduce((sum, l) => sum + (l.fats_grams || 0), 0);
    const totalFiber = logs.reduce((sum, l) => sum + (l.fiber_grams || 0), 0);

    // Calculate completion percentage based on calories
    const completionPercentage = Math.min(100, (totalCalories / targetCalories) * 100);

    // Get water intake from health metrics if available
    const metrics = db.prepare('SELECT water_intake_liters FROM health_metrics WHERE user_id = ? AND date = ?').get(userId, targetDate);
    const waterIntake = metrics?.water_intake_liters || 0;

    // Check if summary exists
    const existing = db.prepare('SELECT id FROM nutrition_daily_summaries WHERE user_id = ? AND date = ?').get(userId, targetDate);

    if (existing) {
      db.prepare(`
        UPDATE nutrition_daily_summaries SET
          meals_logged = ?,
          total_calories = ?,
          total_protein = ?,
          total_carbs = ?,
          total_fats = ?,
          total_fiber = ?,
          target_calories = ?,
          target_protein = ?,
          target_carbs = ?,
          target_fats = ?,
          completion_percentage = ?,
          water_intake_liters = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        mealsLogged, totalCalories, totalProtein, totalCarbs, totalFats, totalFiber,
        targetCalories, targetProtein, targetCarbs, targetFats, completionPercentage, waterIntake,
        existing.id
      );
    } else {
      db.prepare(`
        INSERT INTO nutrition_daily_summaries
        (id, user_id, date, meals_logged, total_calories, total_protein, total_carbs, total_fats, total_fiber,
         target_calories, target_protein, target_carbs, target_fats, completion_percentage, water_intake_liters)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(), userId, targetDate,
        mealsLogged, totalCalories, totalProtein, totalCarbs, totalFats, totalFiber,
        targetCalories, targetProtein, targetCarbs, targetFats, completionPercentage, waterIntake
      );
    }

    return {
      date: targetDate,
      mealsLogged,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFats,
      totalFiber,
      targetCalories,
      completionPercentage,
      waterIntake
    };
  } catch (error) {
    console.error('Error updating nutrition daily summary:', error);
    return null;
  }
}

// ============================================
// STREAK TRACKING
// ============================================

/**
 * Update user streaks based on daily summaries
 */
function updateUserStreaks(userId) {
  const today = new Date().toISOString().split('T')[0];

  try {
    // Get existing streaks or create new record
    let streaks = db.prepare('SELECT * FROM user_streaks WHERE user_id = ?').get(userId);

    if (!streaks) {
      db.prepare(`
        INSERT INTO user_streaks (id, user_id) VALUES (?, ?)
      `).run(uuidv4(), userId);
      streaks = {
        workout_current_streak: 0,
        workout_longest_streak: 0,
        workout_last_active_date: null,
        diet_current_streak: 0,
        diet_longest_streak: 0,
        diet_last_active_date: null,
        overall_current_streak: 0,
        overall_longest_streak: 0,
        total_workout_days: 0,
        total_diet_days: 0
      };
    }

    // Calculate workout streak
    const workoutDays = db.prepare(`
      SELECT DISTINCT date FROM workout_daily_summaries
      WHERE user_id = ? AND workouts_completed > 0
      ORDER BY date DESC
    `).all(userId);

    const workoutStreak = calculateStreak(workoutDays.map(d => d.date), today);
    const totalWorkoutDays = workoutDays.length;

    // Calculate diet streak
    const dietDays = db.prepare(`
      SELECT DISTINCT date FROM nutrition_daily_summaries
      WHERE user_id = ? AND meals_logged > 0
      ORDER BY date DESC
    `).all(userId);

    const dietStreak = calculateStreak(dietDays.map(d => d.date), today);
    const totalDietDays = dietDays.length;

    // Calculate overall streak (either workout OR diet logged)
    const allDays = new Set([
      ...workoutDays.map(d => d.date),
      ...dietDays.map(d => d.date)
    ]);
    const sortedAllDays = Array.from(allDays).sort().reverse();
    const overallStreak = calculateStreak(sortedAllDays, today);

    // Calculate consistency score (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const activeDaysLast30 = sortedAllDays.filter(d => d >= thirtyDaysAgoStr).length;
    const consistencyScore = Math.round((activeDaysLast30 / 30) * 100);

    // Update longest streaks if current is higher
    const workoutLongest = Math.max(streaks.workout_longest_streak || 0, workoutStreak);
    const dietLongest = Math.max(streaks.diet_longest_streak || 0, dietStreak);
    const overallLongest = Math.max(streaks.overall_longest_streak || 0, overallStreak);

    // Update database
    db.prepare(`
      UPDATE user_streaks SET
        workout_current_streak = ?,
        workout_longest_streak = ?,
        workout_last_active_date = ?,
        diet_current_streak = ?,
        diet_longest_streak = ?,
        diet_last_active_date = ?,
        overall_current_streak = ?,
        overall_longest_streak = ?,
        overall_consistency_score = ?,
        total_workout_days = ?,
        total_diet_days = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(
      workoutStreak,
      workoutLongest,
      workoutDays[0]?.date || null,
      dietStreak,
      dietLongest,
      dietDays[0]?.date || null,
      overallStreak,
      overallLongest,
      consistencyScore,
      totalWorkoutDays,
      totalDietDays,
      userId
    );

    return {
      workout: {
        current: workoutStreak,
        longest: workoutLongest,
        lastActive: workoutDays[0]?.date || null,
        totalDays: totalWorkoutDays
      },
      diet: {
        current: dietStreak,
        longest: dietLongest,
        lastActive: dietDays[0]?.date || null,
        totalDays: totalDietDays
      },
      overall: {
        current: overallStreak,
        longest: overallLongest,
        consistencyScore
      }
    };
  } catch (error) {
    console.error('Error updating user streaks:', error);
    return null;
  }
}

/**
 * Calculate consecutive day streak from sorted date array
 */
function calculateStreak(dates, today) {
  if (!dates || dates.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date(today);

  // Check if today is in the list, or yesterday (allow for timezone differences)
  const todayStr = today;
  const yesterday = new Date(currentDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Start checking from today or yesterday
  if (dates.includes(todayStr)) {
    streak = 1;
    currentDate.setDate(currentDate.getDate() - 1);
  } else if (dates.includes(yesterdayStr)) {
    streak = 1;
    currentDate = yesterday;
    currentDate.setDate(currentDate.getDate() - 1);
  } else {
    return 0; // No activity today or yesterday, streak is broken
  }

  // Count consecutive days backwards
  while (true) {
    const checkDate = currentDate.toISOString().split('T')[0];
    if (dates.includes(checkDate)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// ============================================
// GOAL PROGRESS
// ============================================

/**
 * Update progress for all user goals based on logged data
 */
function updateGoalProgress(userId) {
  try {
    const goals = db.prepare('SELECT * FROM health_goals WHERE user_id = ? AND status = ?').all(userId, 'active');
    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId);
    const streaks = db.prepare('SELECT * FROM user_streaks WHERE user_id = ?').get(userId);

    const today = new Date().toISOString().split('T')[0];
    const updatedGoals = [];

    for (const goal of goals) {
      let progress = goal.progress_percentage || 0;
      let milestone = null;

      switch (goal.goal_type) {
        case 'weight_loss':
        case 'weight_gain': {
          // Calculate progress based on weight change from profile
          const targetValue = parseFloat(goal.target_value);
          const currentWeight = profile?.weight_kg;
          const startWeight = profile?.weight_kg; // Would need initial weight tracking
          if (targetValue && currentWeight) {
            if (goal.goal_type === 'weight_loss') {
              // Assuming target is weight to lose
              const lost = startWeight - currentWeight;
              progress = Math.min(100, Math.max(0, (lost / targetValue) * 100));
            } else {
              const gained = currentWeight - startWeight;
              progress = Math.min(100, Math.max(0, (gained / targetValue) * 100));
            }
          }
          break;
        }

        case 'muscle_gain':
        case 'improve_fitness': {
          // Progress based on workout consistency
          if (streaks) {
            // Use workout days and consistency score
            const workoutDays = streaks.total_workout_days || 0;
            const targetDays = 30; // 30 workout days as a milestone
            progress = Math.min(100, (workoutDays / targetDays) * 100);
            if (workoutDays >= 10) milestone = '10 workouts completed';
            if (workoutDays >= 20) milestone = '20 workouts completed';
            if (workoutDays >= 30) milestone = '30 workouts completed!';
          }
          break;
        }

        case 'better_sleep': {
          // Progress based on sleep quality metrics
          const recentSleep = db.prepare(`
            SELECT AVG(sleep_hours) as avg_sleep FROM health_metrics
            WHERE user_id = ? AND date >= date('now', '-7 days') AND sleep_hours IS NOT NULL
          `).get(userId);
          if (recentSleep?.avg_sleep) {
            const targetSleep = 8; // 8 hours target
            progress = Math.min(100, (recentSleep.avg_sleep / targetSleep) * 100);
          }
          break;
        }

        case 'reduce_stress':
        case 'mental_wellness': {
          // Progress based on consistency and mood tracking
          if (streaks) {
            progress = streaks.overall_consistency_score || 0;
          }
          break;
        }

        case 'healthy_eating': {
          // Progress based on diet logging consistency
          if (streaks) {
            const dietDays = streaks.total_diet_days || 0;
            const targetDays = 30;
            progress = Math.min(100, (dietDays / targetDays) * 100);
            if (dietDays >= 7) milestone = '1 week of healthy eating tracked';
            if (dietDays >= 14) milestone = '2 weeks of healthy eating tracked';
            if (dietDays >= 30) milestone = '1 month of healthy eating tracked!';
          }
          break;
        }

        case 'increase_energy': {
          // Progress based on energy level tracking
          const recentEnergy = db.prepare(`
            SELECT AVG(energy_level) as avg_energy FROM health_metrics
            WHERE user_id = ? AND date >= date('now', '-7 days') AND energy_level IS NOT NULL
          `).get(userId);
          if (recentEnergy?.avg_energy) {
            progress = Math.min(100, (recentEnergy.avg_energy / 10) * 100);
          }
          break;
        }

        default:
          // For other goals, use overall consistency
          if (streaks) {
            progress = streaks.overall_consistency_score || 0;
          }
      }

      // Update goal progress
      db.prepare(`
        UPDATE health_goals SET progress_percentage = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(progress, goal.id);

      // Log progress history
      db.prepare(`
        INSERT INTO goal_progress_history (id, goal_id, user_id, date, progress_percentage, milestone_reached)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), goal.id, userId, today, progress, milestone);

      updatedGoals.push({
        id: goal.id,
        type: goal.goal_type,
        progress,
        milestone
      });
    }

    return updatedGoals;
  } catch (error) {
    console.error('Error updating goal progress:', error);
    return null;
  }
}

// ============================================
// AI ADAPTATION
// ============================================

/**
 * Check if AI adaptation is needed and trigger if necessary
 * This runs asynchronously and doesn't block the main request
 */
async function triggerAIAdaptation(userId) {
  try {
    const streaks = db.prepare('SELECT * FROM user_streaks WHERE user_id = ?').get(userId);
    const goals = db.prepare('SELECT * FROM health_goals WHERE user_id = ? AND status = ?').all(userId, 'active');
    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId);

    // Get recent workout data
    const recentWorkouts = db.prepare(`
      SELECT * FROM workout_daily_summaries
      WHERE user_id = ? AND date >= date('now', '-14 days')
      ORDER BY date DESC
    `).all(userId);

    // Get recent nutrition data
    const recentNutrition = db.prepare(`
      SELECT * FROM nutrition_daily_summaries
      WHERE user_id = ? AND date >= date('now', '-14 days')
      ORDER BY date DESC
    `).all(userId);

    // Analyze for adaptation triggers
    const triggers = [];

    // Trigger 1: Progress plateau (no improvement for 7 days)
    if (goals.length > 0) {
      const progressHistory = db.prepare(`
        SELECT * FROM goal_progress_history
        WHERE user_id = ? AND date >= date('now', '-7 days')
        ORDER BY date ASC
      `).all(userId);

      if (progressHistory.length >= 7) {
        const firstProgress = progressHistory[0]?.progress_percentage || 0;
        const lastProgress = progressHistory[progressHistory.length - 1]?.progress_percentage || 0;
        if (Math.abs(lastProgress - firstProgress) < 2) {
          triggers.push({
            type: 'plateau',
            reason: 'No progress improvement in 7 days',
            data: { firstProgress, lastProgress }
          });
        }
      }
    }

    // Trigger 2: Goal achieved
    const achievedGoals = goals.filter(g => g.progress_percentage >= 100);
    if (achievedGoals.length > 0) {
      triggers.push({
        type: 'goal_achieved',
        reason: 'Goal progress reached 100%',
        data: { goals: achievedGoals.map(g => g.goal_type) }
      });
    }

    // Trigger 3: Consistency drop (< 50% for 14 days)
    if (streaks && streaks.overall_consistency_score < 50) {
      triggers.push({
        type: 'consistency_drop',
        reason: 'Activity consistency below 50% for past 14 days',
        data: { consistencyScore: streaks.overall_consistency_score }
      });
    }

    // Trigger 4: Overtraining (7 consecutive workout days)
    if (streaks && streaks.workout_current_streak >= 7) {
      triggers.push({
        type: 'overtraining',
        reason: '7+ consecutive workout days without rest',
        data: { streak: streaks.workout_current_streak }
      });
    }

    // Trigger 5: Calorie deficit (< 80% target for 7 days)
    const lowCalorieDays = recentNutrition.filter(n => {
      const targetCal = n.target_calories || 2000;
      return n.total_calories < targetCal * 0.8;
    });
    if (lowCalorieDays.length >= 7) {
      triggers.push({
        type: 'calorie_deficit',
        reason: 'Below 80% calorie target for 7+ days',
        data: { lowCalorieDays: lowCalorieDays.length }
      });
    }

    // If no triggers, no adaptation needed
    if (triggers.length === 0) {
      return { needsAdaptation: false };
    }

    // Call AI service for recommendations (if available)
    let aiRecommendations = null;
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/analyze-progress`, {
        userId,
        triggers,
        profile: {
          age: profile?.age,
          gender: profile?.gender,
          activityLevel: profile?.activity_level,
          goals: goals.map(g => g.goal_type)
        },
        streaks,
        recentWorkouts: recentWorkouts.slice(0, 7),
        recentNutrition: recentNutrition.slice(0, 7)
      }, { timeout: 5000 });
      aiRecommendations = response.data;
    } catch (aiErr) {
      console.log('AI adaptation service unavailable, using rule-based recommendations');
      aiRecommendations = generateFallbackRecommendations(triggers);
    }

    // Log adaptation
    const primaryTrigger = triggers[0];
    db.prepare(`
      INSERT INTO ai_adaptation_log
      (id, user_id, adaptation_type, trigger_reason, trigger_data, recommendations, confidence_score)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      userId,
      primaryTrigger.type,
      primaryTrigger.reason,
      JSON.stringify(triggers),
      JSON.stringify(aiRecommendations?.recommendations || []),
      aiRecommendations?.confidence || 0.7
    );

    // Create health insight for user
    if (aiRecommendations?.recommendations?.length > 0) {
      db.prepare(`
        INSERT INTO health_insights (id, user_id, insight_type, title, content, priority)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(),
        userId,
        'ai_adaptation',
        aiRecommendations.recommendations[0].title || 'Plan Adjustment Suggestion',
        aiRecommendations.recommendations[0].content || aiRecommendations.recommendations[0],
        'high'
      );
    }

    return {
      needsAdaptation: true,
      triggers,
      recommendations: aiRecommendations?.recommendations || []
    };
  } catch (error) {
    console.error('Error in AI adaptation:', error);
    return { needsAdaptation: false, error: error.message };
  }
}

/**
 * Generate fallback recommendations when AI service is unavailable
 */
function generateFallbackRecommendations(triggers) {
  const recommendations = [];

  for (const trigger of triggers) {
    switch (trigger.type) {
      case 'plateau':
        recommendations.push({
          title: 'Try Something New',
          content: 'Your progress has plateaued. Consider increasing workout intensity, trying new exercises, or adjusting your calorie intake to break through.',
          action: 'modify_plan'
        });
        break;

      case 'goal_achieved':
        recommendations.push({
          title: 'Congratulations! Goal Achieved!',
          content: `You've reached your ${trigger.data.goals[0]} goal! Time to set a new challenge or maintain your progress with a maintenance plan.`,
          action: 'new_goal'
        });
        break;

      case 'consistency_drop':
        recommendations.push({
          title: 'Let\'s Get Back on Track',
          content: 'Your activity has dropped. Consider simplifying your plan with shorter, more manageable workouts to rebuild momentum.',
          action: 'simplify_plan'
        });
        break;

      case 'overtraining':
        recommendations.push({
          title: 'Rest Day Recommended',
          content: 'You\'ve been working out every day! Your body needs rest to recover and grow stronger. Consider taking 1-2 rest days this week.',
          action: 'rest'
        });
        break;

      case 'calorie_deficit':
        recommendations.push({
          title: 'Nutrition Check',
          content: 'You\'ve been under your calorie target consistently. Make sure you\'re eating enough to fuel your workouts and recovery.',
          action: 'adjust_diet'
        });
        break;
    }
  }

  return { recommendations, confidence: 0.7 };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get today's summary for a user
 */
function getTodaySummary(userId) {
  const today = new Date().toISOString().split('T')[0];

  const workout = db.prepare('SELECT * FROM workout_daily_summaries WHERE user_id = ? AND date = ?').get(userId, today);
  const nutrition = db.prepare('SELECT * FROM nutrition_daily_summaries WHERE user_id = ? AND date = ?').get(userId, today);
  const streaks = db.prepare('SELECT * FROM user_streaks WHERE user_id = ?').get(userId);

  return {
    workout: workout ? {
      workoutsCompleted: workout.workouts_completed,
      exercisesCompleted: workout.exercises_completed,
      totalDuration: workout.total_duration_mins,
      completionPercentage: workout.completion_percentage,
      caloriesBurned: workout.calories_burned_estimate
    } : null,
    nutrition: nutrition ? {
      mealsLogged: nutrition.meals_logged,
      totalCalories: nutrition.total_calories,
      totalProtein: nutrition.total_protein,
      completionPercentage: nutrition.completion_percentage,
      targetCalories: nutrition.target_calories
    } : null,
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
  };
}

/**
 * Get weekly progress summary
 */
function getWeeklyProgress(userId) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];

  const workouts = db.prepare(`
    SELECT * FROM workout_daily_summaries
    WHERE user_id = ? AND date >= ?
    ORDER BY date ASC
  `).all(userId, weekAgoStr);

  const nutrition = db.prepare(`
    SELECT * FROM nutrition_daily_summaries
    WHERE user_id = ? AND date >= ?
    ORDER BY date ASC
  `).all(userId, weekAgoStr);

  return {
    workouts: workouts.map(w => ({
      date: w.date,
      workoutsCompleted: w.workouts_completed,
      duration: w.total_duration_mins,
      caloriesBurned: w.calories_burned_estimate
    })),
    nutrition: nutrition.map(n => ({
      date: n.date,
      calories: n.total_calories,
      targetCalories: n.target_calories,
      protein: n.total_protein
    })),
    summary: {
      totalWorkouts: workouts.reduce((sum, w) => sum + w.workouts_completed, 0),
      totalWorkoutMinutes: workouts.reduce((sum, w) => sum + w.total_duration_mins, 0),
      avgCalories: nutrition.length > 0
        ? Math.round(nutrition.reduce((sum, n) => sum + n.total_calories, 0) / nutrition.length)
        : 0,
      activeDays: new Set([...workouts.map(w => w.date), ...nutrition.map(n => n.date)]).size
    }
  };
}

module.exports = {
  updateWorkoutDailySummary,
  updateNutritionDailySummary,
  updateUserStreaks,
  updateGoalProgress,
  triggerAIAdaptation,
  getTodaySummary,
  getWeeklyProgress
};
