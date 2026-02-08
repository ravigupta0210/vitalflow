# VitalFlow - AI-Powered Personalized Health Platform

## Project Overview

**VitalFlow** is a next-generation AI-powered personalized health platform with dynamic workout/diet generation, health insights, and an intelligent chatbot. Built using free/open-source tools with a modern tech stack.

- **Brand Name**: VitalFlow
- **Theme**: Teal/Cyan + Dark Mode
- **Status**: In Development

---

## Tech Stack

| Layer | Technology | Port |
|-------|------------|------|
| Frontend | React 18 + Vite, Tailwind CSS, GSAP, SWR | 5173 |
| Backend API | Node.js + Express.js | 5001 |
| AI Engine | Python (FastAPI) - Health Analysis Microservice | 8000 |
| Database | SQLite (better-sqlite3) | - |
| Auth | Passport.js (JWT + Google OAuth) | - |
| AI LLM | Google Gemini API (free tier) | - |

---

## Project Structure

```
personal-trainer/
├── backend/                      # Node.js API Server
│   ├── src/
│   │   ├── index.js              # Server entry (Express app)
│   │   ├── config/
│   │   │   ├── database.js       # SQLite configuration
│   │   │   └── passport.js       # JWT + Google OAuth strategies
│   │   ├── middleware/
│   │   │   └── auth.js           # JWT authentication middleware
│   │   ├── controllers/
│   │   │   ├── authController.js # Register, login, OAuth
│   │   │   └── onboardingController.js # Multi-step onboarding
│   │   ├── routes/
│   │   │   ├── authRoutes.js     # /api/auth/*
│   │   │   ├── onboardingRoutes.js # /api/onboarding/*
│   │   │   ├── profileRoutes.js  # /api/profile/*
│   │   │   ├── dashboardRoutes.js # /api/dashboard/*
│   │   │   ├── workoutRoutes.js  # /api/workouts/*
│   │   │   ├── dietRoutes.js     # /api/diet/*
│   │   │   └── chatRoutes.js     # /api/chat/*
│   │   └── utils/
│   │       └── healthCalculations.js # BMI, BMR, TDEE calculations
│   ├── migrations/
│   │   └── migrate.js            # Database schema creation
│   ├── database.sqlite           # SQLite database file
│   ├── .env                      # Environment variables
│   └── package.json
│
├── ai-service/                   # Python AI/Analysis Engine
│   ├── main.py                   # FastAPI entry point
│   ├── requirements.txt          # Python dependencies
│   ├── .env                      # Gemini API key
│   ├── config/
│   │   └── settings.py           # Pydantic settings
│   ├── models/
│   │   └── health_profile.py     # Pydantic models
│   ├── services/
│   │   ├── gemini_client.py      # Gemini API wrapper
│   │   ├── health_analyzer.py    # Health analysis service
│   │   ├── workout_generator.py  # AI workout generation
│   │   ├── diet_generator.py     # AI diet generation
│   │   └── chat_handler.py       # AI chatbot handler
│   ├── rules/                    # Rule-based health logic
│   │   ├── health_rules.py       # WHO/Medical benchmarks
│   │   ├── workout_rules.py      # Exercise restrictions
│   │   ├── nutrition_rules.py    # Dietary guidelines
│   │   └── condition_rules.py    # Condition-specific rules
│   └── research/                 # Evidence-based data
│       ├── exercise_database.py  # 20+ exercises with metadata
│       ├── nutrition_data.py     # Food database (Indian foods)
│       └── health_benchmarks.py  # WHO/CDC/AHA standards
│
├── frontend/                     # React Frontend
│   ├── src/
│   │   ├── main.jsx              # React entry point
│   │   ├── App.jsx               # Route configuration
│   │   ├── index.css             # Tailwind + custom styles
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # Authentication state
│   │   │   └── HealthContext.jsx # Health data + SWR
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   └── dashboard/
│   │   │       └── Layout.jsx    # Sidebar + Header layout
│   │   ├── pages/
│   │   │   ├── Login.jsx         # Login page
│   │   │   ├── Register.jsx      # Registration page
│   │   │   ├── AuthCallback.jsx  # OAuth callback handler
│   │   │   ├── Onboarding.jsx    # 4-step onboarding
│   │   │   ├── Dashboard.jsx     # Main dashboard
│   │   │   ├── Workouts.jsx      # Workout plans
│   │   │   ├── Diet.jsx          # Diet/meal plans
│   │   │   ├── Chat.jsx          # AI chatbot
│   │   │   ├── Profile.jsx       # User settings
│   │   │   └── NotFound.jsx      # 404 page
│   │   └── services/
│   │       └── api.js            # Axios with interceptors
│   ├── public/
│   │   └── vitalflow-icon.svg    # Favicon
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── PROJECT_DOCS.md               # This file
```

---

## Database Schema (18 Tables)

### Users & Profiles
```sql
-- users: Core user authentication
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  first_name TEXT,
  last_name TEXT,
  is_onboarded INTEGER DEFAULT 0,
  onboarding_step INTEGER DEFAULT 0,
  auth_provider TEXT DEFAULT 'local',
  google_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- user_profiles: Health data
CREATE TABLE user_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE REFERENCES users(id),
  age INTEGER,
  gender TEXT,
  height_cm REAL,
  weight_kg REAL,
  diet_type TEXT,
  activity_level TEXT,
  bmi REAL,
  bmr REAL,
  tdee REAL,
  target_calories INTEGER,
  sleep_hours INTEGER,
  sleep_quality TEXT,
  work_type TEXT,
  stress_level TEXT,
  water_intake_liters REAL,
  smoking INTEGER,
  alcohol TEXT
);

-- medical_conditions: User health conditions
CREATE TABLE medical_conditions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  condition_type TEXT NOT NULL,
  severity TEXT,
  diagnosed_date TEXT,
  notes TEXT
);

-- health_goals: Selected goals (1-3 per user)
CREATE TABLE health_goals (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  goal_type TEXT NOT NULL,
  priority INTEGER,
  target_value TEXT,
  target_date TEXT,
  status TEXT DEFAULT 'active'
);

-- goal_questionnaires: Conditional question answers
CREATE TABLE goal_questionnaires (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  goal_type TEXT,
  question_key TEXT,
  answer TEXT
);
```

### Workout Module
```sql
-- workout_plans: AI-generated plans
CREATE TABLE workout_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  name TEXT,
  description TEXT,
  duration_weeks INTEGER,
  difficulty TEXT,
  goal_type TEXT,
  ai_generated INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- workout_days: Day-by-day schedule
CREATE TABLE workout_days (
  id TEXT PRIMARY KEY,
  plan_id TEXT REFERENCES workout_plans(id),
  day_number INTEGER,
  name TEXT,
  focus_area TEXT,
  duration_minutes INTEGER,
  calories_burn INTEGER
);

-- exercises: Individual exercises
CREATE TABLE exercises (
  id TEXT PRIMARY KEY,
  day_id TEXT REFERENCES workout_days(id),
  name TEXT NOT NULL,
  sets INTEGER,
  reps TEXT,
  weight_kg REAL,
  duration_seconds INTEGER,
  rest_seconds INTEGER,
  order_index INTEGER,
  instructions TEXT,
  video_url TEXT
);

-- workout_logs: Progress tracking
CREATE TABLE workout_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  plan_id TEXT REFERENCES workout_plans(id),
  day_id TEXT REFERENCES workout_days(id),
  exercise_id TEXT REFERENCES exercises(id),
  completed INTEGER DEFAULT 0,
  actual_sets INTEGER,
  actual_reps TEXT,
  actual_weight REAL,
  notes TEXT,
  logged_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Diet Module
```sql
-- diet_plans: AI-generated meal plans
CREATE TABLE diet_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  name TEXT,
  description TEXT,
  duration_days INTEGER,
  diet_type TEXT,
  target_calories INTEGER,
  ai_generated INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- meal_days: Daily meal schedules
CREATE TABLE meal_days (
  id TEXT PRIMARY KEY,
  plan_id TEXT REFERENCES diet_plans(id),
  day_number INTEGER,
  total_calories INTEGER,
  total_protein REAL,
  total_carbs REAL,
  total_fats REAL
);

-- meals: Individual meals
CREATE TABLE meals (
  id TEXT PRIMARY KEY,
  day_id TEXT REFERENCES meal_days(id),
  meal_type TEXT,
  name TEXT NOT NULL,
  description TEXT,
  calories INTEGER,
  protein REAL,
  carbs REAL,
  fats REAL,
  fiber REAL,
  ingredients TEXT,
  recipe TEXT,
  prep_time_minutes INTEGER,
  order_index INTEGER
);

-- food_logs: User food tracking
CREATE TABLE food_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  meal_id TEXT REFERENCES meals(id),
  food_name TEXT,
  calories INTEGER,
  protein REAL,
  carbs REAL,
  fats REAL,
  quantity REAL,
  unit TEXT,
  logged_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### AI & Insights
```sql
-- chat_conversations: Chat sessions
CREATE TABLE chat_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  title TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- chat_messages: Message history
CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT REFERENCES chat_conversations(id),
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- health_insights: AI-generated insights
CREATE TABLE health_insights (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  insight_type TEXT,
  title TEXT,
  content TEXT,
  priority TEXT,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- health_metrics: Daily tracking data
CREATE TABLE health_metrics (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  date DATE NOT NULL,
  weight_kg REAL,
  steps INTEGER,
  water_glasses INTEGER,
  sleep_hours REAL,
  calories_consumed INTEGER,
  calories_burned INTEGER,
  mood TEXT,
  energy_level INTEGER,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- refresh_tokens: JWT refresh tokens
CREATE TABLE refresh_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  token TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /register | Register with email/password |
| POST | /login | Login with email/password |
| POST | /logout | Logout (invalidate refresh token) |
| POST | /refresh-token | Get new access token |
| POST | /change-password | Change password |
| GET | /google | Initiate Google OAuth |
| GET | /google/callback | Google OAuth callback |
| GET | /me | Get current user |

### Onboarding (`/api/onboarding`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /status | Get onboarding status |
| GET | /questions/:goalType | Get conditional questions |
| POST | /step/1 | Submit basic profile |
| POST | /step/2 | Submit lifestyle data |
| POST | /step/3 | Submit health goals |
| POST | /step/4 | Submit questionnaire answers |
| POST | /complete | Complete onboarding |

### Dashboard (`/api/dashboard`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | / | Get dashboard data |
| GET | /insights | Get AI insights |
| GET | /metrics/:range | Get metrics for date range |
| POST | /metrics | Log daily metrics |

### Workouts (`/api/workouts`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /plans | Get all workout plans |
| GET | /plans/:id | Get specific plan |
| GET | /today | Get today's workout |
| GET | /history | Get workout history |
| POST | /generate | Generate AI workout plan |
| POST | /log | Log workout progress |

### Diet (`/api/diet`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /plans | Get all diet plans |
| GET | /plans/:id | Get specific plan |
| GET | /today | Get today's meals |
| GET | /history | Get diet history |
| POST | /generate | Generate AI diet plan |
| POST | /log | Log food intake |

### Chat (`/api/chat`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /conversations | Get all conversations |
| GET | /conversations/:id | Get conversation messages |
| POST | /conversations | Create new conversation |
| POST | /conversations/:id/messages | Send message |
| DELETE | /conversations/:id | Delete conversation |

### Python AI Service (`http://localhost:8000`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /analyze-profile | Full health analysis |
| POST | /generate-workout | Generate workout plan |
| POST | /generate-diet | Generate diet plan |
| POST | /chat | AI chat response |
| GET | /health-benchmarks | Get health standards |

---

## Environment Variables

### Backend (`backend/.env`)
```env
PORT=5001
NODE_ENV=development
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
AI_SERVICE_URL=http://localhost:8000
DATABASE_PATH=./database.sqlite
```

### AI Service (`ai-service/.env`)
```env
GEMINI_API_KEY=your-gemini-api-key
NODE_API_URL=http://localhost:5001
ENVIRONMENT=development
```

---

## Completed Tasks

- [x] Project directory structure
- [x] Node.js backend with Express
- [x] SQLite database with 18 tables
- [x] JWT authentication
- [x] Google OAuth setup (needs credentials)
- [x] Python FastAPI AI service
- [x] Health rules engine (workout_rules, nutrition_rules, condition_rules)
- [x] Research data modules (exercises, nutrition, benchmarks)
- [x] Gemini API client
- [x] React frontend with Vite + Tailwind
- [x] Login/Register pages with GSAP animations
- [x] Multi-step onboarding form
- [x] Dashboard layout (fixed sidebar + header)
- [x] Dashboard page with health score
- [x] Workouts page with exercise cards
- [x] Diet page with meal cards
- [x] AI Chat page
- [x] Profile settings page
- [x] Protected routes
- [x] Auth context with token refresh
- [x] Health context with SWR

---

## Pending Tasks

- [ ] **Google OAuth**: Add Google Client ID and Secret
- [ ] **Gemini API**: Add API key for AI features
- [ ] Test full onboarding flow end-to-end
- [ ] Test workout generation with AI
- [ ] Test diet generation with AI
- [ ] Test AI chatbot
- [ ] Add GSAP animations to dashboard components
- [ ] Add Recharts for progress visualization
- [ ] Mobile responsiveness testing
- [ ] Error handling improvements
- [ ] Loading states and skeletons

---

## How to Run

### 1. Start Backend (Port 5001)
```bash
cd backend
npm install
node migrations/migrate.js  # First time only
node src/index.js
```

### 2. Start AI Service (Port 8000)
```bash
cd ai-service
pip install -r requirements.txt
python3 -m uvicorn main:app --reload --port 8000
```

### 3. Start Frontend (Port 5173)
```bash
cd frontend
npm install
npm run dev
```

### Access the App
- Frontend: http://localhost:5173
- Backend Health: http://localhost:5001/health
- AI Service Docs: http://localhost:8000/docs

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Google+ API" and "Google Identity"
4. Go to "Credentials" > "Create Credentials" > "OAuth 2.0 Client ID"
5. Set application type to "Web application"
6. Add authorized redirect URI: `http://localhost:5001/api/auth/google/callback`
7. Copy Client ID and Client Secret to `backend/.env`

## Gemini API Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Copy to `ai-service/.env` as `GEMINI_API_KEY`

---

## Key Features

### 1. Multi-Step Onboarding
- Step 1: Basic Profile (age, gender, height, weight, diet type, activity)
- Step 2: Lifestyle (sleep, work type, stress, water intake, habits)
- Step 3: Health Goals (select 1-3 from 12 options)
- Step 4: Conditional Questions (dynamic based on goals)

### 2. AI-Powered Features
- Personalized workout generation based on health profile
- Custom meal plans respecting diet preferences
- Health insights with research-backed recommendations
- Context-aware health chatbot

### 3. Health Rules Engine
- Medical guideline validation (WHO, CDC, AHA)
- Exercise restrictions for conditions (diabetes, hypertension, PCOD, etc.)
- Safe workout generation with progressive overload
- Nutrition rules by goal (weight loss, muscle gain, etc.)

### 4. Research-Based Data
- 20+ exercises with full metadata
- Indian food database with nutritional info
- Health benchmarks from medical research

---

## Notes

- Port 5000 is used by macOS ControlCenter, so backend uses 5001
- SQLite database is at `backend/database.sqlite`
- Run migrations before first use: `node migrations/migrate.js`
- Frontend auto-reloads with Vite HMR
- Backend needs manual restart after changes (use nodemon for dev)
