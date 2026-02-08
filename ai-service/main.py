"""
VitalFlow AI Service - FastAPI Application
Health Analysis, Workout Generation, Diet Planning, and Chat
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from config.settings import settings
from models.health_profile import (
    HealthProfile, WorkoutRequest, DietRequest, ChatRequest,
    HealthAnalysisResponse, WorkoutPlanResponse, DietPlanResponse, ChatResponse,
    OnboardingQuestionsRequest, OnboardingQuestionsResponse
)
from services.health_analyzer import HealthAnalyzer
from services.workout_generator import WorkoutGenerator
from services.diet_generator import DietGenerator
from services.chat_handler import ChatHandler
from services.onboarding_generator import OnboardingQuestionGenerator
from services.gemini_client import GeminiClient
from research.health_benchmarks import HEALTH_BENCHMARKS
from research.exercise_database import EXERCISE_DATABASE
from research.nutrition_data import FOOD_DATABASE
from rules.condition_rules import CONDITION_RULES


# Initialize services
gemini_client = None
health_analyzer = None
workout_generator = None
diet_generator = None
chat_handler = None
onboarding_generator = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup"""
    global gemini_client, health_analyzer, workout_generator, diet_generator, chat_handler, onboarding_generator

    print("🚀 Initializing VitalFlow AI Service...")

    gemini_client = GeminiClient()
    health_analyzer = HealthAnalyzer(gemini_client)
    workout_generator = WorkoutGenerator(gemini_client)
    diet_generator = DietGenerator(gemini_client)
    chat_handler = ChatHandler(gemini_client)
    onboarding_generator = OnboardingQuestionGenerator(gemini_client)

    print("✅ All services initialized")
    yield
    print("👋 Shutting down VitalFlow AI Service")


app = FastAPI(
    title="VitalFlow AI Service",
    description="AI-powered health analysis, workout and diet generation",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
import os
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5001,http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "VitalFlow AI Service",
        "version": "1.0.0",
        "gemini_configured": gemini_client is not None and gemini_client.is_configured
    }


# ============================================
# HEALTH ANALYSIS ENDPOINTS
# ============================================

@app.post("/analyze-profile", response_model=HealthAnalysisResponse)
async def analyze_profile(profile: HealthProfile):
    """Analyze user health profile and generate insights"""
    try:
        result = await health_analyzer.analyze(profile)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/calculate-metrics")
async def calculate_metrics(profile: HealthProfile):
    """Calculate health metrics (BMI, BMR, TDEE, etc.)"""
    try:
        metrics = health_analyzer.calculate_all_metrics(profile)
        return {"success": True, "data": metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# WORKOUT GENERATION ENDPOINTS
# ============================================

@app.post("/generate-workout", response_model=WorkoutPlanResponse)
async def generate_workout(request: WorkoutRequest):
    """Generate personalized workout plan"""
    try:
        plan = await workout_generator.generate(request)
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# DIET GENERATION ENDPOINTS
# ============================================

@app.post("/generate-diet", response_model=DietPlanResponse)
async def generate_diet(request: DietRequest):
    """Generate personalized diet plan"""
    try:
        plan = await diet_generator.generate(request)
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# CHAT ENDPOINTS
# ============================================

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Context-aware health chatbot"""
    try:
        response = await chat_handler.respond(request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# ONBOARDING QUESTIONS ENDPOINT
# ============================================

@app.post("/generate-onboarding-questions", response_model=OnboardingQuestionsResponse)
async def generate_onboarding_questions(request: OnboardingQuestionsRequest):
    """Generate personalized onboarding questions based on user profile and goals"""
    try:
        result = await onboarding_generator.generate_questions({
            'profile': request.profile.model_dump() if request.profile else {},
            'lifestyle': request.lifestyle.model_dump() if request.lifestyle else {},
            'goals': request.goals,
            'medicalConditions': request.medicalConditions
        })
        return OnboardingQuestionsResponse(**result)
    except Exception as e:
        print(f"Error generating onboarding questions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# COMPREHENSIVE HEALTH ANALYSIS
# ============================================

@app.post("/analyze-health")
async def analyze_health(data: dict):
    """Comprehensive AI health analysis for dashboard"""
    try:
        profile = data.get('profile', {})
        goals = data.get('goals', [])
        conditions = data.get('conditions', [])
        questionnaire = data.get('questionnaire', {})

        # Build AI prompt for comprehensive analysis
        prompt = f"""You are an expert health analyst. Analyze this user's health profile and provide personalized insights.

USER PROFILE:
- Age: {profile.get('age')} years
- Gender: {profile.get('gender')}
- Height: {profile.get('height')} cm
- Weight: {profile.get('weight')} kg
- BMI: {profile.get('bmi')}
- BMR: {profile.get('bmr')} cal/day
- TDEE: {profile.get('tdee')} cal/day
- Diet Type: {profile.get('dietType')}
- Activity Level: {profile.get('activityLevel')}
- Sleep: {profile.get('sleepHours')} hours/night
- Work Type: {profile.get('workType')}
- Stress Level: {profile.get('stressLevel')}
- Water Intake: {profile.get('waterIntake')} glasses/day
- Smoking: {'Yes' if profile.get('smoking') else 'No'}
- Alcohol: {profile.get('alcohol') or 'No'}

HEALTH GOALS: {', '.join(goals) if goals else 'General wellness'}
MEDICAL CONDITIONS: {', '.join(conditions) if conditions else 'None reported'}

QUESTIONNAIRE ANSWERS: {questionnaire}

Generate a comprehensive health analysis with:
1. 3-5 personalized insights (mix of health, nutrition, fitness, lifestyle)
2. Key recommendations for their specific goals
3. Risk factors to watch
4. Motivational message

Return ONLY valid JSON in this format:
{{
  "insights": [
    {{
      "type": "health|nutrition|fitness|lifestyle|warning",
      "title": "Short title",
      "content": "Detailed insight (2-3 sentences)",
      "priority": "high|normal|low",
      "actionable": "Specific action they can take"
    }}
  ],
  "recommendations": [
    "Specific recommendation 1",
    "Specific recommendation 2"
  ],
  "riskFactors": ["Risk 1 if any"],
  "motivationalMessage": "Personalized encouraging message",
  "healthTips": ["Tip 1", "Tip 2", "Tip 3"]
}}"""

        response = await gemini_client.generate(prompt, expect_json=True)
        import json
        result = json.loads(response)
        result['generatedAt'] = __import__('datetime').datetime.now().isoformat()
        return result

    except Exception as e:
        print(f"Health analysis error: {e}")
        # Return fallback insights
        return {
            "insights": [
                {
                    "type": "health",
                    "title": "Health Profile Created",
                    "content": "Your health profile has been set up. Track your progress regularly for best results.",
                    "priority": "normal",
                    "actionable": "Log your daily metrics to see trends"
                }
            ],
            "recommendations": [
                "Stay consistent with your health goals",
                "Track your progress weekly",
                "Stay hydrated throughout the day"
            ],
            "riskFactors": [],
            "motivationalMessage": "Every step counts towards a healthier you!",
            "healthTips": [
                "Drink water first thing in the morning",
                "Take short walks during work breaks",
                "Get 7-8 hours of sleep for optimal recovery"
            ],
            "generatedAt": __import__('datetime').datetime.now().isoformat()
        }


# ============================================
# PROGRESS ANALYSIS & AI ADAPTATION
# ============================================

@app.post("/analyze-progress")
async def analyze_progress(data: dict):
    """
    Analyze user progress and generate AI-powered adaptation recommendations.

    Triggers:
    - plateau: No improvement for 7 days
    - goal_achieved: Progress >= 100%
    - consistency_drop: < 50% activity for 14 days
    - overtraining: 7+ consecutive workout days
    - calorie_deficit: < 80% calorie target for 7 days
    """
    try:
        triggers = data.get('triggers', [])
        profile = data.get('profile', {})
        streaks = data.get('streaks', {})
        recent_workouts = data.get('recentWorkouts', [])
        recent_nutrition = data.get('recentNutrition', [])

        if not triggers:
            return {
                "needsAdaptation": False,
                "recommendations": [],
                "confidence": 1.0
            }

        # Build AI prompt for progress analysis
        trigger_descriptions = [f"- {t['type']}: {t['reason']}" for t in triggers]

        prompt = f"""You are a fitness and nutrition AI coach. Analyze this user's progress data and provide specific, actionable recommendations.

USER PROFILE:
- Age: {profile.get('age')}
- Gender: {profile.get('gender')}
- Activity Level: {profile.get('activityLevel')}
- Goals: {', '.join(profile.get('goals', []))}

CURRENT STREAKS:
- Workout Streak: {streaks.get('workout_current_streak', 0)} days
- Diet Streak: {streaks.get('diet_current_streak', 0)} days
- Consistency Score: {streaks.get('overall_consistency_score', 0)}%

ADAPTATION TRIGGERS DETECTED:
{chr(10).join(trigger_descriptions)}

RECENT WORKOUT DATA (last 7 days):
{recent_workouts[:3] if recent_workouts else 'No recent workouts'}

RECENT NUTRITION DATA (last 7 days):
{recent_nutrition[:3] if recent_nutrition else 'No recent nutrition data'}

Based on the triggers, provide 1-3 specific recommendations. For each recommendation:
1. Be specific and actionable (not generic advice)
2. Consider the user's current activity level and goals
3. Provide a clear "why" and "how"

Return ONLY valid JSON in this format:
{{
  "needsAdaptation": true,
  "adaptationType": "modify_plan|simplify|rest|celebrate|adjust_diet",
  "recommendations": [
    {{
      "title": "Short actionable title",
      "content": "Detailed explanation with specific steps (2-3 sentences)",
      "action": "specific_action_type",
      "priority": "high|medium|low"
    }}
  ],
  "confidence": 0.85,
  "suggestedChanges": {{
    "workoutIntensity": "increase|decrease|maintain",
    "restDays": "add|maintain",
    "calorieAdjustment": "increase|decrease|maintain"
  }}
}}"""

        response = await gemini_client.generate(prompt, expect_json=True)
        import json
        result = json.loads(response)
        result['analyzedAt'] = __import__('datetime').datetime.now().isoformat()
        return result

    except Exception as e:
        print(f"Progress analysis error: {e}")
        # Return rule-based fallback recommendations
        recommendations = []
        primary_trigger = triggers[0] if triggers else None

        if primary_trigger:
            trigger_type = primary_trigger.get('type')

            if trigger_type == 'plateau':
                recommendations.append({
                    "title": "Break Through Your Plateau",
                    "content": "Your progress has stalled. Try increasing workout intensity by 10%, varying your exercises, or adjusting your calorie intake slightly.",
                    "action": "modify_plan",
                    "priority": "high"
                })
            elif trigger_type == 'goal_achieved':
                recommendations.append({
                    "title": "Congratulations on Your Achievement!",
                    "content": "You've reached your goal! Consider setting a new challenge or switching to a maintenance plan to preserve your gains.",
                    "action": "new_goal",
                    "priority": "high"
                })
            elif trigger_type == 'consistency_drop':
                recommendations.append({
                    "title": "Let's Rebuild Momentum",
                    "content": "Your activity has dropped. Start with just 15-20 minute workouts to rebuild the habit. Consistency matters more than intensity right now.",
                    "action": "simplify",
                    "priority": "high"
                })
            elif trigger_type == 'overtraining':
                recommendations.append({
                    "title": "Rest Day Strongly Recommended",
                    "content": "You've been training hard! Your muscles need 24-48 hours to recover and grow stronger. Take 1-2 rest days this week.",
                    "action": "rest",
                    "priority": "high"
                })
            elif trigger_type == 'calorie_deficit':
                recommendations.append({
                    "title": "Fuel Your Body",
                    "content": "You've been under your calorie target consistently. This can slow metabolism and hinder progress. Try adding a healthy snack or larger portion.",
                    "action": "adjust_diet",
                    "priority": "medium"
                })

        return {
            "needsAdaptation": len(recommendations) > 0,
            "adaptationType": recommendations[0]["action"] if recommendations else None,
            "recommendations": recommendations,
            "confidence": 0.7,
            "suggestedChanges": None,
            "analyzedAt": __import__('datetime').datetime.now().isoformat()
        }


# ============================================
# REFERENCE DATA ENDPOINTS
# ============================================

@app.get("/health-benchmarks")
async def get_health_benchmarks():
    """Get research-backed health benchmarks"""
    return {"success": True, "data": HEALTH_BENCHMARKS}


@app.get("/exercise-database")
async def get_exercise_database(muscle_group: str = None, difficulty: str = None):
    """Get exercise database with optional filtering"""
    exercises = EXERCISE_DATABASE

    if muscle_group:
        exercises = {k: v for k, v in exercises.items()
                    if muscle_group.lower() in [m.lower() for m in v.get('primary_muscles', [])]}

    if difficulty:
        exercises = {k: v for k, v in exercises.items()
                    if v.get('difficulty', '').lower() == difficulty.lower()}

    return {"success": True, "data": exercises, "count": len(exercises)}


@app.get("/food-database")
async def get_food_database(diet_type: str = None, category: str = None):
    """Get food database with optional filtering"""
    foods = FOOD_DATABASE

    if diet_type:
        foods = {k: v for k, v in foods.items()
                if diet_type.lower() in [d.lower() for d in v.get('diet_types', [])]}

    if category:
        foods = {k: v for k, v in foods.items()
                if v.get('category', '').lower() == category.lower()}

    return {"success": True, "data": foods, "count": len(foods)}


@app.get("/condition-rules/{condition_type}")
async def get_condition_rules(condition_type: str):
    """Get rules for a specific health condition"""
    rules = CONDITION_RULES.get(condition_type.lower())

    if not rules:
        raise HTTPException(status_code=404, detail=f"No rules found for condition: {condition_type}")

    return {"success": True, "data": rules}


if __name__ == "__main__":
    import os
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "false").lower() == "true"
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=debug,
        log_level="info"
    )
