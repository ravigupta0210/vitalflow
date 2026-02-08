const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { calculateHealthMetrics } = require('../utils/healthCalculations');
const axios = require('axios');

// Conditional questions based on health goals
const CONDITIONAL_QUESTIONS = {
  weight_loss: [
    { key: 'weight_loss_target', question: 'How much weight do you want to lose?', type: 'select', options: ['5-10 kg', '10-20 kg', '20+ kg'] },
    { key: 'weight_loss_timeline', question: 'What is your target timeline?', type: 'select', options: ['3 months', '6 months', '1 year', 'No specific timeline'] },
    { key: 'previous_diets', question: 'Have you tried dieting before?', type: 'radio', options: ['Yes, successfully', 'Yes, unsuccessfully', 'No'] },
    { key: 'emotional_eating', question: 'Do you tend to eat when stressed or emotional?', type: 'radio', options: ['Often', 'Sometimes', 'Rarely', 'Never'] }
  ],
  muscle_gain: [
    { key: 'training_experience', question: 'What is your weight training experience?', type: 'select', options: ['Beginner (0-6 months)', 'Intermediate (6-24 months)', 'Advanced (2+ years)'] },
    { key: 'gym_access', question: 'Do you have access to a gym?', type: 'radio', options: ['Yes, fully equipped', 'Yes, basic', 'Home gym', 'No gym access'] },
    { key: 'supplement_use', question: 'Are you open to using supplements?', type: 'radio', options: ['Yes', 'Only natural/basic', 'No'] },
    { key: 'muscle_focus', question: 'Which areas do you want to focus on?', type: 'multiselect', options: ['Upper body', 'Lower body', 'Core', 'Overall'] }
  ],
  diabetes: [
    { key: 'diabetes_type', question: 'What type of diabetes do you have?', type: 'select', options: ['Type 1', 'Type 2', 'Pre-diabetic', 'Gestational'] },
    { key: 'diabetes_management', question: 'How do you currently manage your diabetes?', type: 'multiselect', options: ['Medication', 'Insulin', 'Diet control', 'Exercise', 'None'] },
    { key: 'blood_sugar_monitoring', question: 'How often do you monitor your blood sugar?', type: 'select', options: ['Multiple times daily', 'Once daily', 'Weekly', 'Rarely'] },
    { key: 'hba1c_level', question: 'What is your latest HbA1c level (if known)?', type: 'text', optional: true }
  ],
  heart_health: [
    { key: 'heart_condition', question: 'Do you have any diagnosed heart conditions?', type: 'radio', options: ['Yes', 'No', 'Not sure'] },
    { key: 'blood_pressure_status', question: 'What is your blood pressure status?', type: 'select', options: ['Normal', 'Slightly elevated', 'High', 'On medication'] },
    { key: 'cholesterol_status', question: 'What is your cholesterol status?', type: 'select', options: ['Normal', 'Borderline high', 'High', 'On medication', 'Unknown'] },
    { key: 'family_heart_history', question: 'Is there a family history of heart disease?', type: 'radio', options: ['Yes', 'No', 'Unknown'] }
  ],
  blood_pressure: [
    { key: 'bp_reading', question: 'What is your typical blood pressure reading?', type: 'text', placeholder: 'e.g., 120/80' },
    { key: 'bp_medication', question: 'Are you on blood pressure medication?', type: 'radio', options: ['Yes', 'No'] },
    { key: 'bp_symptoms', question: 'Do you experience any symptoms?', type: 'multiselect', options: ['Headaches', 'Dizziness', 'Shortness of breath', 'None'] }
  ],
  thyroid: [
    { key: 'thyroid_type', question: 'What type of thyroid condition do you have?', type: 'select', options: ['Hypothyroidism', 'Hyperthyroidism', 'Hashimoto\'s', 'Graves\' disease', 'Not diagnosed'] },
    { key: 'thyroid_medication', question: 'Are you on thyroid medication?', type: 'radio', options: ['Yes', 'No'] },
    { key: 'tsh_level', question: 'What is your latest TSH level (if known)?', type: 'text', optional: true }
  ],
  pcod: [
    { key: 'pcod_symptoms', question: 'Which PCOD symptoms do you experience?', type: 'multiselect', options: ['Irregular periods', 'Weight gain', 'Hair loss', 'Acne', 'Excess facial hair', 'Fatigue', 'Mood swings'] },
    { key: 'pcod_medication', question: 'Are you on any medication for PCOD?', type: 'radio', options: ['Yes', 'No'] },
    { key: 'pcod_diagnosis', question: 'When were you diagnosed?', type: 'select', options: ['Less than 1 year', '1-3 years', '3-5 years', 'More than 5 years'] },
    { key: 'trying_conceive', question: 'Are you trying to conceive?', type: 'radio', options: ['Yes', 'No', 'Not applicable'] }
  ],
  mental_wellness: [
    { key: 'mental_concerns', question: 'What mental wellness concerns do you have?', type: 'multiselect', options: ['Stress', 'Anxiety', 'Depression', 'Sleep issues', 'Focus/concentration', 'Burnout'] },
    { key: 'therapy_status', question: 'Are you currently seeing a therapist?', type: 'radio', options: ['Yes', 'No, but interested', 'No'] },
    { key: 'mental_triggers', question: 'What triggers affect your mental health most?', type: 'multiselect', options: ['Work', 'Relationships', 'Finances', 'Health concerns', 'Other'] }
  ],
  sleep_improvement: [
    { key: 'sleep_issues', question: 'What sleep issues do you experience?', type: 'multiselect', options: ['Difficulty falling asleep', 'Waking up during night', 'Waking up too early', 'Not feeling rested', 'Snoring/sleep apnea'] },
    { key: 'sleep_schedule', question: 'Do you have a consistent sleep schedule?', type: 'radio', options: ['Yes', 'Mostly', 'No'] },
    { key: 'screen_time', question: 'Do you use screens before bed?', type: 'radio', options: ['Often', 'Sometimes', 'Rarely'] },
    { key: 'caffeine_evening', question: 'Do you consume caffeine in the evening?', type: 'radio', options: ['Often', 'Sometimes', 'Never'] }
  ],
  hair_health: [
    { key: 'hair_concern', question: 'What is your primary hair concern?', type: 'select', options: ['Hair loss', 'Thinning', 'Dandruff', 'Dryness', 'Premature graying'] },
    { key: 'hair_loss_pattern', question: 'If hair loss, what pattern?', type: 'select', options: ['Overall thinning', 'Receding hairline', 'Bald patches', 'Crown thinning', 'N/A'] },
    { key: 'hair_treatments', question: 'Have you tried any treatments?', type: 'multiselect', options: ['Minoxidil', 'Supplements', 'Natural remedies', 'Professional treatment', 'None'] }
  ],
  skin_health: [
    { key: 'skin_concern', question: 'What is your primary skin concern?', type: 'select', options: ['Acne', 'Dryness', 'Oiliness', 'Aging', 'Pigmentation', 'Sensitivity'] },
    { key: 'skin_type', question: 'What is your skin type?', type: 'select', options: ['Dry', 'Oily', 'Combination', 'Normal', 'Sensitive'] },
    { key: 'skincare_routine', question: 'Do you follow a skincare routine?', type: 'radio', options: ['Yes, comprehensive', 'Yes, basic', 'No'] }
  ],
  blood_purification: [
    { key: 'blood_concerns', question: 'What blood-related concerns do you have?', type: 'multiselect', options: ['High uric acid', 'Toxin buildup', 'Poor circulation', 'Skin issues due to blood impurities'] },
    { key: 'detox_tried', question: 'Have you tried detox programs before?', type: 'radio', options: ['Yes', 'No'] },
    { key: 'water_intake_current', question: 'How much water do you currently drink daily?', type: 'select', options: ['Less than 1L', '1-2L', '2-3L', 'More than 3L'] }
  ]
};

// Get onboarding status
const getStatus = (req, res) => {
  try {
    const user = db.prepare(`
      SELECT is_onboarded, onboarding_step FROM users WHERE id = ?
    `).get(req.user.id);

    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(req.user.id);
    const goals = db.prepare('SELECT goal_type, priority FROM health_goals WHERE user_id = ?').all(req.user.id);

    res.json({
      success: true,
      data: {
        isOnboarded: Boolean(user.is_onboarded),
        currentStep: user.onboarding_step,
        completedSteps: getCompletedSteps(req.user.id),
        profile: profile || null,
        goals: goals
      }
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ success: false, message: 'Failed to get onboarding status' });
  }
};

// Helper to determine completed steps
const getCompletedSteps = (userId) => {
  const completed = [];
  const user = db.prepare('SELECT onboarding_step FROM users WHERE id = ?').get(userId);
  const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId);
  const goals = db.prepare('SELECT * FROM health_goals WHERE user_id = ?').all(userId);

  if (profile && profile.age && profile.gender && profile.height_cm && profile.weight_kg) {
    completed.push(1);
  }
  if (profile && profile.sleep_hours && profile.work_type) {
    completed.push(2);
  }
  if (goals.length > 0) {
    completed.push(3);
  }
  // Step 4 is complete if onboarding_step >= 4 (questionnaire is optional)
  if (user && user.onboarding_step >= 4) {
    completed.push(4);
  }

  return completed;
};

// Step 1: Basic Profile
const submitStep1 = (req, res) => {
  try {
    const { firstName, lastName, age, gender, heightCm, weightKg, dietType, activityLevel, medicalConditions } = req.body;

    // Validate required fields
    if (!age || !gender || !heightCm || !weightKg || !dietType || !activityLevel) {
      return res.status(400).json({
        success: false,
        message: 'All basic profile fields are required'
      });
    }

    // Calculate health metrics
    const metrics = calculateHealthMetrics({
      age, gender, heightCm, weightKg, activityLevel
    });

    // Update user name if provided
    if (firstName) {
      db.prepare(`
        UPDATE users SET first_name = ?, last_name = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(firstName, lastName || null, req.user.id);
    }

    // Check if profile exists
    const existingProfile = db.prepare('SELECT id FROM user_profiles WHERE user_id = ?').get(req.user.id);

    if (existingProfile) {
      // Update existing profile
      db.prepare(`
        UPDATE user_profiles SET
          age = ?, gender = ?, height_cm = ?, weight_kg = ?, diet_type = ?, activity_level = ?,
          bmi = ?, bmr = ?, tdee = ?, target_calories = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(
        age, gender, heightCm, weightKg, dietType, activityLevel,
        metrics.bmi, metrics.bmr, metrics.tdee, metrics.targetCalories,
        req.user.id
      );
    } else {
      // Create new profile
      db.prepare(`
        INSERT INTO user_profiles (id, user_id, age, gender, height_cm, weight_kg, diet_type, activity_level, bmi, bmr, tdee, target_calories)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(), req.user.id,
        age, gender, heightCm, weightKg, dietType, activityLevel,
        metrics.bmi, metrics.bmr, metrics.tdee, metrics.targetCalories
      );
    }

    // Handle medical conditions
    if (medicalConditions && medicalConditions.length > 0) {
      // Clear existing conditions
      db.prepare('DELETE FROM medical_conditions WHERE user_id = ?').run(req.user.id);

      // Insert new conditions
      const insertCondition = db.prepare(`
        INSERT INTO medical_conditions (id, user_id, condition_type, severity, notes)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const condition of medicalConditions) {
        insertCondition.run(
          uuidv4(),
          req.user.id,
          condition.type,
          condition.severity || 'moderate',
          condition.notes || null
        );
      }
    }

    // Update onboarding step
    db.prepare(`
      UPDATE users SET onboarding_step = CASE WHEN onboarding_step < 1 THEN 1 ELSE onboarding_step END
      WHERE id = ?
    `).run(req.user.id);

    res.json({
      success: true,
      message: 'Basic profile saved successfully',
      data: {
        step: 1,
        metrics
      }
    });
  } catch (error) {
    console.error('Step 1 error:', error);
    res.status(500).json({ success: false, message: 'Failed to save basic profile' });
  }
};

// Step 2: Lifestyle
const submitStep2 = (req, res) => {
  try {
    const { sleepHours, sleepQuality, workType, stressLevel, waterIntake, smoking, alcohol } = req.body;

    // Validate required fields
    if (!sleepHours || !workType || !stressLevel) {
      return res.status(400).json({
        success: false,
        message: 'Sleep hours, work type, and stress level are required'
      });
    }

    // Update profile
    db.prepare(`
      UPDATE user_profiles SET
        sleep_hours = ?, sleep_quality = ?, work_type = ?, stress_level = ?,
        water_intake_liters = ?, smoking = ?, alcohol = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(
      sleepHours, sleepQuality || null, workType, stressLevel,
      waterIntake || null, smoking ? 1 : 0, alcohol || null,
      req.user.id
    );

    // Update onboarding step
    db.prepare(`
      UPDATE users SET onboarding_step = CASE WHEN onboarding_step < 2 THEN 2 ELSE onboarding_step END
      WHERE id = ?
    `).run(req.user.id);

    res.json({
      success: true,
      message: 'Lifestyle data saved successfully',
      data: { step: 2 }
    });
  } catch (error) {
    console.error('Step 2 error:', error);
    res.status(500).json({ success: false, message: 'Failed to save lifestyle data' });
  }
};

// Step 3: Health Goals
const submitStep3 = (req, res) => {
  try {
    const { goals } = req.body;

    // Validate goals (1-3 required)
    if (!goals || goals.length < 1 || goals.length > 3) {
      return res.status(400).json({
        success: false,
        message: 'Please select 1-3 health goals'
      });
    }

    // Clear existing goals
    db.prepare('DELETE FROM health_goals WHERE user_id = ?').run(req.user.id);

    // Insert new goals
    const insertGoal = db.prepare(`
      INSERT INTO health_goals (id, user_id, goal_type, priority, status)
      VALUES (?, ?, ?, ?, 'active')
    `);

    goals.forEach((goalType, index) => {
      insertGoal.run(uuidv4(), req.user.id, goalType, index + 1);
    });

    // Update onboarding step
    db.prepare(`
      UPDATE users SET onboarding_step = CASE WHEN onboarding_step < 3 THEN 3 ELSE onboarding_step END
      WHERE id = ?
    `).run(req.user.id);

    // Get conditional questions for selected goals
    const questions = [];
    goals.forEach(goalType => {
      if (CONDITIONAL_QUESTIONS[goalType]) {
        questions.push({
          goalType,
          questions: CONDITIONAL_QUESTIONS[goalType]
        });
      }
    });

    res.json({
      success: true,
      message: 'Health goals saved successfully',
      data: {
        step: 3,
        conditionalQuestions: questions
      }
    });
  } catch (error) {
    console.error('Step 3 error:', error);
    res.status(500).json({ success: false, message: 'Failed to save health goals' });
  }
};

// Get conditional questions for a goal type (legacy - fallback)
const getConditionalQuestions = (req, res) => {
  const { goalType } = req.params;

  const questions = CONDITIONAL_QUESTIONS[goalType];
  if (!questions) {
    return res.status(404).json({
      success: false,
      message: 'No questions found for this goal type'
    });
  }

  res.json({
    success: true,
    data: {
      goalType,
      questions
    }
  });
};

// Generate AI-powered personalized questions
const generateAIQuestions = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user profile
    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId);
    if (!profile) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile first'
      });
    }

    // Get user goals
    const goals = db.prepare('SELECT goal_type FROM health_goals WHERE user_id = ?').all(userId);
    const goalTypes = goals.map(g => g.goal_type);

    // Get medical conditions
    const conditions = db.prepare('SELECT condition_type FROM medical_conditions WHERE user_id = ?').all(userId);
    const conditionTypes = conditions.map(c => c.condition_type);

    // Call AI service to generate personalized questions
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';

    const requestData = {
      profile: {
        age: profile.age,
        gender: profile.gender,
        heightCm: profile.height_cm,
        weightKg: profile.weight_kg,
        dietType: profile.diet_type,
        activityLevel: profile.activity_level
      },
      lifestyle: {
        sleepHours: profile.sleep_hours,
        workType: profile.work_type,
        stressLevel: profile.stress_level,
        waterIntake: profile.water_intake_liters,
        smokingHabit: profile.smoking ? 'yes' : 'no',
        alcoholConsumption: profile.alcohol
      },
      goals: goalTypes,
      medicalConditions: conditionTypes
    };

    try {
      const response = await axios.post(
        `${AI_SERVICE_URL}/generate-onboarding-questions`,
        requestData,
        { timeout: 60000 } // 60 second timeout for AI generation
      );

      res.json({
        success: true,
        data: response.data
      });
    } catch (aiError) {
      console.error('AI service error:', aiError.message);

      // Fallback to hardcoded questions if AI fails
      const fallbackQuestions = [];
      goalTypes.forEach(goalType => {
        if (CONDITIONAL_QUESTIONS[goalType]) {
          fallbackQuestions.push({
            goalType,
            questions: CONDITIONAL_QUESTIONS[goalType]
          });
        }
      });

      res.json({
        success: true,
        data: {
          categories: fallbackQuestions.map((fq, idx) => ({
            id: fq.goalType,
            title: formatGoalTitle(fq.goalType),
            icon: getGoalIcon(fq.goalType),
            questions: fq.questions.map(q => ({
              id: `${fq.goalType}_${q.key}`,
              question: q.question,
              type: q.type,
              options: q.options || null,
              required: !q.optional,
              rationale: 'Based on your health goals'
            }))
          })),
          totalQuestions: fallbackQuestions.reduce((sum, fq) => sum + fq.questions.length, 0),
          estimatedTime: '3-5 minutes',
          generatedFor: {
            goals: goalTypes,
            conditions: conditionTypes
          },
          isFallback: true
        }
      });
    }
  } catch (error) {
    console.error('Generate AI questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate questions'
    });
  }
};

// Helper function to format goal type as title
const formatGoalTitle = (goalType) => {
  const titles = {
    weight_loss: 'Weight Loss Journey',
    muscle_gain: 'Muscle Building Goals',
    diabetes: 'Diabetes Management',
    heart_health: 'Heart Health',
    blood_pressure: 'Blood Pressure Management',
    thyroid: 'Thyroid Health',
    pcod: 'PCOD/PCOS Management',
    mental_wellness: 'Mental Wellness',
    sleep_improvement: 'Sleep Quality',
    hair_health: 'Hair Health',
    skin_health: 'Skin Health',
    blood_purification: 'Blood Purification'
  };
  return titles[goalType] || goalType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Helper function to get icon for goal type
const getGoalIcon = (goalType) => {
  const icons = {
    weight_loss: 'scale',
    muscle_gain: 'dumbbell',
    diabetes: 'activity',
    heart_health: 'heart',
    blood_pressure: 'heart',
    thyroid: 'activity',
    pcod: 'heart',
    mental_wellness: 'brain',
    sleep_improvement: 'moon',
    hair_health: 'sparkles',
    skin_health: 'sparkles',
    blood_purification: 'droplets'
  };
  return icons[goalType] || 'target';
};

// Step 4: Conditional Questions
const submitStep4 = (req, res) => {
  try {
    const { answers } = req.body;

    // Allow empty answers if no conditional questions were required
    const hasAnswers = answers && Object.keys(answers).length > 0;

    // Clear existing questionnaire answers
    db.prepare('DELETE FROM goal_questionnaires WHERE user_id = ?').run(req.user.id);

    // Insert new answers if any
    if (hasAnswers) {
      const insertAnswer = db.prepare(`
        INSERT INTO goal_questionnaires (id, user_id, goal_type, question_key, answer)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const [key, value] of Object.entries(answers)) {
        // Key format: questionId (may contain underscores)
        // For AI-generated questions, the key is just the question id
        const questionKey = key;
        const goalType = 'ai_generated'; // Mark as AI-generated questions

        // Convert value to string for SQLite storage
        let storedValue;
        if (value === null || value === undefined) {
          storedValue = '';
        } else if (typeof value === 'boolean') {
          storedValue = value ? 'true' : 'false';
        } else if (typeof value === 'object') {
          storedValue = JSON.stringify(value);
        } else {
          storedValue = String(value);
        }

        insertAnswer.run(
          uuidv4(),
          req.user.id,
          goalType,
          questionKey,
          storedValue
        );
      }
    }

    // Update onboarding step
    db.prepare(`
      UPDATE users SET onboarding_step = 4 WHERE id = ?
    `).run(req.user.id);

    res.json({
      success: true,
      message: 'Questionnaire answers saved successfully',
      data: { step: 4 }
    });
  } catch (error) {
    console.error('Step 4 error:', error);
    res.status(500).json({ success: false, message: 'Failed to save questionnaire answers' });
  }
};

// Complete onboarding
const completeOnboarding = (req, res) => {
  try {
    // Verify all steps are completed
    const completedSteps = getCompletedSteps(req.user.id);

    if (completedSteps.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Please complete all onboarding steps',
        completedSteps
      });
    }

    // Mark onboarding as complete
    db.prepare(`
      UPDATE users SET is_onboarded = 1, onboarding_step = 4, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.user.id);

    res.json({
      success: true,
      message: 'Onboarding completed successfully!'
    });
  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(500).json({ success: false, message: 'Failed to complete onboarding' });
  }
};

module.exports = {
  getStatus,
  submitStep1,
  submitStep2,
  submitStep3,
  getConditionalQuestions,
  generateAIQuestions,
  submitStep4,
  completeOnboarding
};
