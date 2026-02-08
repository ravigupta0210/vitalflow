"""
Pydantic models for VitalFlow AI Service
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from enum import Enum


class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class ActivityLevel(str, Enum):
    SEDENTARY = "sedentary"
    LIGHT = "light"
    MODERATE = "moderate"
    ACTIVE = "active"
    VERY_ACTIVE = "very_active"


class DietType(str, Enum):
    VEGETARIAN = "vegetarian"
    NON_VEGETARIAN = "non_vegetarian"
    VEGAN = "vegan"
    EGGETARIAN = "eggetarian"


class GoalType(str, Enum):
    WEIGHT_LOSS = "weight_loss"
    MUSCLE_GAIN = "muscle_gain"
    DIABETES = "diabetes"
    HEART_HEALTH = "heart_health"
    BLOOD_PRESSURE = "blood_pressure"
    THYROID = "thyroid"
    PCOD = "pcod"
    MENTAL_WELLNESS = "mental_wellness"
    SLEEP_IMPROVEMENT = "sleep_improvement"
    HAIR_HEALTH = "hair_health"
    SKIN_HEALTH = "skin_health"
    BLOOD_PURIFICATION = "blood_purification"


# ============================================
# REQUEST MODELS
# ============================================

class ProfileData(BaseModel):
    """User profile data for AI context"""
    age: int = Field(..., ge=10, le=100)
    gender: str
    weight: float = Field(..., ge=20, le=300)
    height: float = Field(..., ge=100, le=250)
    activityLevel: str
    dietType: Optional[str] = None
    targetCalories: Optional[int] = None
    bmi: Optional[float] = None


class HealthProfile(BaseModel):
    """Complete health profile for analysis"""
    profile: ProfileData
    goals: List[str] = []
    conditions: List[str] = []
    questionnaire: Dict[str, Any] = {}


class WorkoutPreferences(BaseModel):
    """User preferences for workout generation"""
    equipment: str = "minimal"  # minimal, home_gym, full_gym
    daysPerWeek: int = Field(default=5, ge=2, le=7)
    durationMins: int = Field(default=45, ge=20, le=120)
    focus: Optional[str] = None


class WorkoutRequest(BaseModel):
    """Request for workout plan generation"""
    profile: ProfileData
    goals: List[str] = []
    conditions: List[str] = []
    questionnaire: Dict[str, Any] = {}
    preferences: WorkoutPreferences = WorkoutPreferences()


class DietPreferences(BaseModel):
    """User preferences for diet generation"""
    restrictions: List[str] = []
    cuisine: str = "indian"
    mealsPerDay: int = Field(default=5, ge=3, le=6)
    budget: str = "moderate"  # low, moderate, high


class DietRequest(BaseModel):
    """Request for diet plan generation"""
    profile: ProfileData
    goals: List[str] = []
    conditions: List[str] = []
    questionnaire: Dict[str, Any] = {}
    preferences: DietPreferences = DietPreferences()


class ChatMessage(BaseModel):
    """Chat message in conversation history"""
    role: str  # user, assistant
    content: str


class ChatContext(BaseModel):
    """Context for AI chatbot"""
    profile: Optional[Dict[str, Any]] = None
    goals: List[str] = []
    conditions: List[str] = []


class ChatRequest(BaseModel):
    """Request for AI chat"""
    message: str
    context: ChatContext = ChatContext()
    history: List[ChatMessage] = []


# ============================================
# RESPONSE MODELS
# ============================================

class HealthMetrics(BaseModel):
    """Calculated health metrics"""
    bmi: float
    bmiCategory: str
    bmiRisk: str
    bmr: int
    tdee: int
    targetCalories: int
    idealWeight: Dict[str, float]
    recommendedWater: float


class HealthInsight(BaseModel):
    """AI-generated health insight"""
    type: str  # recommendation, warning, progress, tip
    title: str
    content: str
    priority: str  # high, normal, low
    relatedGoal: Optional[str] = None


class HealthAnalysisResponse(BaseModel):
    """Response for health analysis"""
    success: bool = True
    metrics: HealthMetrics
    insights: List[HealthInsight]
    healthScore: int = Field(ge=0, le=100)
    confidenceScore: float = Field(ge=0, le=1)
    disclaimer: Optional[str] = None


class Exercise(BaseModel):
    """Exercise in workout plan"""
    name: str
    description: str
    sets: int
    reps: str
    rest_seconds: int = 60
    weight_suggestion: str = "bodyweight"
    video_url: Optional[str] = None
    image_url: Optional[str] = None
    notes: Optional[str] = None


class WorkoutDay(BaseModel):
    """Day in workout plan"""
    day_number: int
    day_name: str
    focus_area: str
    estimated_duration_mins: int
    exercises: List[Exercise]


class WorkoutPlanResponse(BaseModel):
    """Response for workout plan generation"""
    success: bool = True
    title: str
    description: str
    duration_weeks: int = 4
    difficulty_level: str
    goal_focus: str
    equipment: List[str] = []
    days: List[WorkoutDay]
    weekly_tips: List[str] = []
    safety_notes: List[str] = []


class Meal(BaseModel):
    """Meal in diet plan"""
    meal_type: str  # breakfast, mid_morning_snack, lunch, evening_snack, dinner
    name: str
    description: str
    calories: int
    protein_grams: float
    carbs_grams: float
    fats_grams: float
    fiber_grams: Optional[float] = None
    ingredients: List[str]
    recipe_instructions: Optional[str] = None
    prep_time_mins: Optional[int] = None
    cook_time_mins: Optional[int] = None
    image_url: Optional[str] = None


class MealDay(BaseModel):
    """Day in diet plan"""
    day_number: int
    day_name: str
    total_calories: int
    meals: List[Meal]


class DietPlanResponse(BaseModel):
    """Response for diet plan generation"""
    success: bool = True
    title: str
    description: str
    daily_calories: int
    protein_grams: float
    carbs_grams: float
    fats_grams: float
    fiber_grams: float = 25
    days: List[MealDay]
    grocery_list: List[str] = []
    meal_prep_tips: List[str] = []


class ChatResponse(BaseModel):
    """Response for AI chat"""
    success: bool = True
    response: str
    suggestedQuestions: List[str] = []


# ============================================
# ONBOARDING QUESTIONS MODELS
# ============================================

class OnboardingProfileData(BaseModel):
    """User profile data collected in early onboarding steps"""
    age: Optional[int] = None
    gender: Optional[str] = None
    heightCm: Optional[float] = None
    weightKg: Optional[float] = None
    dietType: Optional[str] = None
    activityLevel: Optional[str] = None


class OnboardingLifestyleData(BaseModel):
    """Lifestyle data from onboarding"""
    sleepHours: Optional[float] = None
    workType: Optional[str] = None
    stressLevel: Optional[str] = None
    waterIntake: Optional[int] = None
    smokingHabit: Optional[str] = None
    alcoholConsumption: Optional[str] = None


class OnboardingQuestionsRequest(BaseModel):
    """Request for generating personalized onboarding questions"""
    profile: OnboardingProfileData = OnboardingProfileData()
    lifestyle: OnboardingLifestyleData = OnboardingLifestyleData()
    goals: List[str] = []
    medicalConditions: List[str] = []


class OnboardingQuestion(BaseModel):
    """Individual question in onboarding"""
    id: str
    question: str
    type: str  # select, multiselect, text, number, boolean, scale
    options: Optional[List[str]] = None
    required: bool = False
    rationale: Optional[str] = None
    placeholder: Optional[str] = None


class OnboardingCategory(BaseModel):
    """Category of questions in onboarding"""
    id: str
    title: str
    icon: str
    questions: List[OnboardingQuestion]


class OnboardingQuestionsResponse(BaseModel):
    """Response with generated onboarding questions"""
    success: bool = True
    categories: List[OnboardingCategory]
    totalQuestions: int
    estimatedTime: str
    generatedFor: Optional[Dict[str, Any]] = None
