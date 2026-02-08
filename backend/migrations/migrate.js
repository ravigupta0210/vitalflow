require('dotenv').config({ path: '../.env' });
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

console.log('🔄 Running VitalFlow database migrations...\n');

// ============================================
// CORE TABLES
// ============================================

// Users Table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    google_id TEXT UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT,
    avatar TEXT,
    role TEXT DEFAULT 'user',
    is_onboarded INTEGER DEFAULT 0,
    onboarding_step INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
console.log('✅ Created users table');

// User Profiles Table (Extended health data)
db.exec(`
  CREATE TABLE IF NOT EXISTS user_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    -- Basic Profile (Step 1)
    age INTEGER,
    gender TEXT,
    height_cm REAL,
    weight_kg REAL,
    diet_type TEXT,
    activity_level TEXT,
    -- Lifestyle (Step 2)
    sleep_hours REAL,
    sleep_quality TEXT,
    work_type TEXT,
    stress_level TEXT,
    water_intake_liters REAL,
    smoking INTEGER DEFAULT 0,
    alcohol TEXT,
    -- Calculated Fields
    bmi REAL,
    bmr REAL,
    tdee REAL,
    target_calories REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);
console.log('✅ Created user_profiles table');

// Medical Conditions Table
db.exec(`
  CREATE TABLE IF NOT EXISTS medical_conditions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    condition_type TEXT NOT NULL,
    severity TEXT,
    medications TEXT,
    diagnosed_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);
console.log('✅ Created medical_conditions table');

// Health Goals Table
db.exec(`
  CREATE TABLE IF NOT EXISTS health_goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    goal_type TEXT NOT NULL,
    priority INTEGER DEFAULT 1,
    target_value TEXT,
    progress_percentage REAL DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);
console.log('✅ Created health_goals table');

// Goal Questionnaires Table (Conditional questions)
db.exec(`
  CREATE TABLE IF NOT EXISTS goal_questionnaires (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    goal_type TEXT NOT NULL,
    question_key TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);
console.log('✅ Created goal_questionnaires table');

// ============================================
// WORKOUT MODULE TABLES
// ============================================

// Workout Plans Table
db.exec(`
  CREATE TABLE IF NOT EXISTS workout_plans (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    duration_weeks INTEGER,
    difficulty_level TEXT,
    goal_focus TEXT,
    equipment_needed TEXT,
    ai_prompt_used TEXT,
    ai_generated_at DATETIME,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);
console.log('✅ Created workout_plans table');

// Workout Days Table
db.exec(`
  CREATE TABLE IF NOT EXISTS workout_days (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL,
    day_number INTEGER NOT NULL,
    day_name TEXT,
    focus_area TEXT,
    estimated_duration_mins INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE
  )
`);
console.log('✅ Created workout_days table');

// Exercises Table
db.exec(`
  CREATE TABLE IF NOT EXISTS exercises (
    id TEXT PRIMARY KEY,
    workout_day_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    sets INTEGER,
    reps TEXT,
    rest_seconds INTEGER,
    weight_suggestion TEXT,
    video_url TEXT,
    image_url TEXT,
    notes TEXT,
    order_index INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workout_day_id) REFERENCES workout_days(id) ON DELETE CASCADE
  )
`);
console.log('✅ Created exercises table');

// Workout Logs Table
db.exec(`
  CREATE TABLE IF NOT EXISTS workout_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    workout_day_id TEXT NOT NULL,
    exercise_id TEXT,
    sets_completed INTEGER,
    reps_completed TEXT,
    weight_used REAL,
    duration_mins INTEGER,
    notes TEXT,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (workout_day_id) REFERENCES workout_days(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE SET NULL
  )
`);
console.log('✅ Created workout_logs table');

// ============================================
// DIET MODULE TABLES
// ============================================

// Diet Plans Table
db.exec(`
  CREATE TABLE IF NOT EXISTS diet_plans (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    daily_calories INTEGER,
    protein_grams REAL,
    carbs_grams REAL,
    fats_grams REAL,
    fiber_grams REAL,
    diet_type TEXT,
    goal_focus TEXT,
    restrictions TEXT,
    ai_prompt_used TEXT,
    ai_generated_at DATETIME,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);
console.log('✅ Created diet_plans table');

// Meal Days Table
db.exec(`
  CREATE TABLE IF NOT EXISTS meal_days (
    id TEXT PRIMARY KEY,
    diet_plan_id TEXT NOT NULL,
    day_number INTEGER NOT NULL,
    day_name TEXT,
    total_calories INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (diet_plan_id) REFERENCES diet_plans(id) ON DELETE CASCADE
  )
`);
console.log('✅ Created meal_days table');

// Meals Table
db.exec(`
  CREATE TABLE IF NOT EXISTS meals (
    id TEXT PRIMARY KEY,
    meal_day_id TEXT NOT NULL,
    meal_type TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    calories INTEGER,
    protein_grams REAL,
    carbs_grams REAL,
    fats_grams REAL,
    fiber_grams REAL,
    ingredients TEXT,
    recipe_instructions TEXT,
    prep_time_mins INTEGER,
    cook_time_mins INTEGER,
    image_url TEXT,
    order_index INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meal_day_id) REFERENCES meal_days(id) ON DELETE CASCADE
  )
`);
console.log('✅ Created meals table');

// Food Logs Table
db.exec(`
  CREATE TABLE IF NOT EXISTS food_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    meal_id TEXT,
    meal_type TEXT NOT NULL,
    food_name TEXT NOT NULL,
    calories INTEGER,
    protein_grams REAL,
    carbs_grams REAL,
    fats_grams REAL,
    quantity TEXT,
    notes TEXT,
    logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE SET NULL
  )
`);
console.log('✅ Created food_logs table');

// ============================================
// CHAT & INSIGHTS TABLES
// ============================================

// Chat Conversations Table
db.exec(`
  CREATE TABLE IF NOT EXISTS chat_conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT,
    context TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);
console.log('✅ Created chat_conversations table');

// Chat Messages Table
db.exec(`
  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    tokens_used INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
  )
`);
console.log('✅ Created chat_messages table');

// Health Insights Table
db.exec(`
  CREATE TABLE IF NOT EXISTS health_insights (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    insight_type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'normal',
    is_read INTEGER DEFAULT 0,
    valid_until DATETIME,
    ai_prompt_used TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);
console.log('✅ Created health_insights table');

// Health Metrics Table
db.exec(`
  CREATE TABLE IF NOT EXISTS health_metrics (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date DATE NOT NULL,
    weight_kg REAL,
    water_intake_liters REAL,
    sleep_hours REAL,
    steps INTEGER,
    mood TEXT,
    energy_level INTEGER,
    stress_level TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);
console.log('✅ Created health_metrics table');

// Refresh Tokens Table (for JWT refresh)
db.exec(`
  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);
console.log('✅ Created refresh_tokens table');

// ============================================
// LIVE TRACKING & AGGREGATION TABLES
// ============================================

// Workout Daily Summaries Table (auto-aggregated)
db.exec(`
  CREATE TABLE IF NOT EXISTS workout_daily_summaries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date DATE NOT NULL,
    workouts_completed INTEGER DEFAULT 0,
    exercises_completed INTEGER DEFAULT 0,
    total_duration_mins INTEGER DEFAULT 0,
    total_sets INTEGER DEFAULT 0,
    total_reps INTEGER DEFAULT 0,
    completion_percentage REAL DEFAULT 0,
    muscle_groups_worked TEXT,
    calories_burned_estimate INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);
console.log('✅ Created workout_daily_summaries table');

// Nutrition Daily Summaries Table (auto-aggregated)
db.exec(`
  CREATE TABLE IF NOT EXISTS nutrition_daily_summaries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date DATE NOT NULL,
    meals_logged INTEGER DEFAULT 0,
    total_calories INTEGER DEFAULT 0,
    total_protein REAL DEFAULT 0,
    total_carbs REAL DEFAULT 0,
    total_fats REAL DEFAULT 0,
    total_fiber REAL DEFAULT 0,
    target_calories INTEGER DEFAULT 0,
    target_protein REAL DEFAULT 0,
    target_carbs REAL DEFAULT 0,
    target_fats REAL DEFAULT 0,
    completion_percentage REAL DEFAULT 0,
    water_intake_liters REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);
console.log('✅ Created nutrition_daily_summaries table');

// User Streaks Table (replaces mock data)
db.exec(`
  CREATE TABLE IF NOT EXISTS user_streaks (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    workout_current_streak INTEGER DEFAULT 0,
    workout_longest_streak INTEGER DEFAULT 0,
    workout_last_active_date DATE,
    diet_current_streak INTEGER DEFAULT 0,
    diet_longest_streak INTEGER DEFAULT 0,
    diet_last_active_date DATE,
    overall_current_streak INTEGER DEFAULT 0,
    overall_longest_streak INTEGER DEFAULT 0,
    overall_consistency_score REAL DEFAULT 0,
    total_workout_days INTEGER DEFAULT 0,
    total_diet_days INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);
console.log('✅ Created user_streaks table');

// Goal Progress History Table
db.exec(`
  CREATE TABLE IF NOT EXISTS goal_progress_history (
    id TEXT PRIMARY KEY,
    goal_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    date DATE NOT NULL,
    progress_percentage REAL DEFAULT 0,
    milestone_reached TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (goal_id) REFERENCES health_goals(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);
console.log('✅ Created goal_progress_history table');

// AI Adaptation Log Table
db.exec(`
  CREATE TABLE IF NOT EXISTS ai_adaptation_log (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    adaptation_type TEXT NOT NULL,
    trigger_reason TEXT NOT NULL,
    trigger_data TEXT,
    recommendations TEXT,
    confidence_score REAL,
    was_applied INTEGER DEFAULT 0,
    applied_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);
console.log('✅ Created ai_adaptation_log table');

// ============================================
// USER SETTINGS & NOTIFICATIONS TABLES
// ============================================

// User Settings Table (preferences)
db.exec(`
  CREATE TABLE IF NOT EXISTS user_settings (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    email_notifications INTEGER DEFAULT 1,
    push_notifications INTEGER DEFAULT 1,
    weekly_report INTEGER DEFAULT 1,
    workout_reminders INTEGER DEFAULT 1,
    dark_mode INTEGER DEFAULT 0,
    language TEXT DEFAULT 'en',
    measurement_unit TEXT DEFAULT 'metric',
    two_factor_auth INTEGER DEFAULT 0,
    data_sharing INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);
console.log('✅ Created user_settings table');

// Notifications Table
db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);
console.log('✅ Created notifications table');

// OTP Tokens Table
db.exec(`
  CREATE TABLE IF NOT EXISTS otp_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    identifier TEXT NOT NULL,
    identifier_type TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    purpose TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    is_used INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);
console.log('✅ Created otp_tokens table');

// Device Tokens Table (for push notifications)
db.exec(`
  CREATE TABLE IF NOT EXISTS device_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    platform TEXT NOT NULL,
    device_name TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);
console.log('✅ Created device_tokens table');

// Add mobile_number and mobile_verified columns to users table
try {
  db.exec(`ALTER TABLE users ADD COLUMN mobile_number TEXT`);
  console.log('✅ Added mobile_number column to users table');
} catch (e) {
  if (!e.message.includes('duplicate column name')) {
    console.log('ℹ️ mobile_number column already exists');
  }
}

try {
  db.exec(`ALTER TABLE users ADD COLUMN mobile_verified INTEGER DEFAULT 0`);
  console.log('✅ Added mobile_verified column to users table');
} catch (e) {
  if (!e.message.includes('duplicate column name')) {
    console.log('ℹ️ mobile_verified column already exists');
  }
}

// ============================================
// INDEXES FOR PERFORMANCE
// ============================================

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_user_profiles_user ON user_profiles(user_id);
  CREATE INDEX IF NOT EXISTS idx_health_goals_user ON health_goals(user_id);
  CREATE INDEX IF NOT EXISTS idx_health_goals_type ON health_goals(goal_type);
  CREATE INDEX IF NOT EXISTS idx_medical_conditions_user ON medical_conditions(user_id);
  CREATE INDEX IF NOT EXISTS idx_goal_questionnaires_user ON goal_questionnaires(user_id);
  CREATE INDEX IF NOT EXISTS idx_workout_plans_user ON workout_plans(user_id);
  CREATE INDEX IF NOT EXISTS idx_workout_days_plan ON workout_days(plan_id);
  CREATE INDEX IF NOT EXISTS idx_exercises_day ON exercises(workout_day_id);
  CREATE INDEX IF NOT EXISTS idx_workout_logs_user ON workout_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_diet_plans_user ON diet_plans(user_id);
  CREATE INDEX IF NOT EXISTS idx_meal_days_plan ON meal_days(diet_plan_id);
  CREATE INDEX IF NOT EXISTS idx_meals_day ON meals(meal_day_id);
  CREATE INDEX IF NOT EXISTS idx_food_logs_user ON food_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_chat_conversations_user ON chat_conversations(user_id);
  CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
  CREATE INDEX IF NOT EXISTS idx_health_insights_user ON health_insights(user_id);
  CREATE INDEX IF NOT EXISTS idx_health_metrics_user_date ON health_metrics(user_id, date);
  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

  -- Aggregation table indexes
  CREATE INDEX IF NOT EXISTS idx_workout_daily_summaries_user_date ON workout_daily_summaries(user_id, date);
  CREATE INDEX IF NOT EXISTS idx_nutrition_daily_summaries_user_date ON nutrition_daily_summaries(user_id, date);
  CREATE INDEX IF NOT EXISTS idx_user_streaks_user ON user_streaks(user_id);
  CREATE INDEX IF NOT EXISTS idx_goal_progress_history_goal ON goal_progress_history(goal_id);
  CREATE INDEX IF NOT EXISTS idx_goal_progress_history_user_date ON goal_progress_history(user_id, date);
  CREATE INDEX IF NOT EXISTS idx_ai_adaptation_log_user ON ai_adaptation_log(user_id);
  CREATE INDEX IF NOT EXISTS idx_ai_adaptation_log_type ON ai_adaptation_log(adaptation_type);

  -- User Settings & Notifications indexes
  CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
  CREATE INDEX IF NOT EXISTS idx_otp_tokens_identifier ON otp_tokens(identifier, identifier_type);
  CREATE INDEX IF NOT EXISTS idx_otp_tokens_expires ON otp_tokens(expires_at);

  -- Device tokens indexes
  CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON device_tokens(user_id);
  CREATE INDEX IF NOT EXISTS idx_device_tokens_token ON device_tokens(token);
`);
console.log('✅ Created indexes');

console.log('\n🎉 All migrations completed successfully!');
console.log(`📁 Database location: ${dbPath}\n`);

db.close();
