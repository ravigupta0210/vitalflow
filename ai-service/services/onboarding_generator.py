"""
Onboarding Question Generator - AI-powered personalized questions
Generates relevant questions based on user profile, goals, and conditions
"""

from services.gemini_client import GeminiClient
from typing import List, Dict, Any
import json


class OnboardingQuestionGenerator:
    """Generates personalized onboarding questions using AI"""

    def __init__(self, gemini_client: GeminiClient):
        self.gemini = gemini_client

    async def generate_questions(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate personalized questions based on user profile"""

        # Extract user data
        profile = user_data.get('profile', {})
        lifestyle = user_data.get('lifestyle', {})
        goals = user_data.get('goals', [])
        conditions = user_data.get('medicalConditions', [])

        # Build comprehensive prompt
        prompt = self._build_prompt(profile, lifestyle, goals, conditions)

        try:
            response = await self.gemini.generate(prompt, expect_json=True)
            questions_data = json.loads(response)

            # Validate and structure the response
            return self._validate_and_structure(questions_data, goals, conditions)
        except Exception as e:
            print(f"Error generating onboarding questions: {e}")
            return self._get_fallback_questions(goals, conditions)

    def _build_prompt(self, profile: Dict, lifestyle: Dict, goals: List[str], conditions: List[str]) -> str:
        """Build the AI prompt for question generation"""

        # Calculate age from DOB if provided
        age = profile.get('age', 'Not specified')

        # Format goals nicely
        goals_text = ', '.join(goals) if goals else 'General fitness'
        conditions_text = ', '.join(conditions) if conditions else 'None reported'

        prompt = f"""You are an expert health and fitness consultant. Generate personalized onboarding questions for a new user.

USER PROFILE:
- Age: {age} years
- Gender: {profile.get('gender', 'Not specified')}
- Height: {profile.get('heightCm', 'Not specified')} cm
- Weight: {profile.get('weightKg', 'Not specified')} kg
- Diet Type: {profile.get('dietType', 'Not specified')}
- Activity Level: {profile.get('activityLevel', 'Not specified')}

LIFESTYLE:
- Sleep Hours: {lifestyle.get('sleepHours', 'Not specified')}
- Work Type: {lifestyle.get('workType', 'Not specified')}
- Stress Level: {lifestyle.get('stressLevel', 'Not specified')}
- Water Intake: {lifestyle.get('waterIntake', 'Not specified')} glasses/day

HEALTH GOALS: {goals_text}
MEDICAL CONDITIONS/CONCERNS: {conditions_text}

Generate 15-20 highly relevant questions organized into categories. Each question should:
1. Be directly relevant to their goals and conditions
2. Help create a personalized fitness/nutrition plan
3. Identify any safety concerns or limitations
4. Understand their preferences and constraints

CRITICAL - NO DUPLICATE OR SIMILAR QUESTIONS:
- NEVER ask the same question twice, even in different categories
- NEVER ask similar questions (e.g., don't ask about "training experience" AND "workout history" - pick ONE)
- Each question must gather UNIQUE information not covered by any other question
- If two goals need similar info (e.g., both need to know about exercise), ask ONCE in a shared category
- Before adding a question, mentally check: "Have I already asked something similar?"

IMPORTANT RULES:
- For heart-related goals: Include cardiovascular health, family history, symptoms during exercise
- For muscle gain: Include training experience, gym access, protein intake, target physique
- For weight loss: Include eating habits, emotional eating, previous attempts, metabolic factors
- For diabetes: Include blood sugar monitoring, medication, diet patterns
- For PCOD/PCOS: Include hormonal symptoms, menstrual cycle, insulin resistance signs
- For vegetarian diet: Include protein sources, supplements, dairy consumption
- DO NOT create separate categories for each goal - COMBINE related questions into unified categories
- Keep total question count between 15-20 to avoid overwhelming the user

Return ONLY valid JSON in this exact format:
{{
  "categories": [
    {{
      "id": "fitness_background",
      "title": "Fitness & Training Background",
      "icon": "dumbbell",
      "questions": [
        {{
          "id": "training_experience",
          "question": "Have you done strength training or gym workouts before?",
          "type": "select",
          "options": ["Never", "Beginner (0-6 months)", "Intermediate (6-24 months)", "Advanced (2+ years)"],
          "required": true,
          "rationale": "To customize workout intensity and complexity"
        }},
        {{
          "id": "comfortable_movements",
          "question": "Can you comfortably perform basic movements?",
          "type": "multiselect",
          "options": ["Push-ups", "Squats", "Lunges", "Plank hold", "Jogging"],
          "required": false,
          "rationale": "To assess baseline fitness level"
        }}
      ]
    }},
    {{
      "id": "health_assessment",
      "title": "Health & Safety Assessment",
      "icon": "heart",
      "questions": [
        {{
          "id": "exercise_symptoms",
          "question": "Do you experience any of these during exercise?",
          "type": "multiselect",
          "options": ["Shortness of breath", "Chest tightness", "Dizziness", "Joint pain", "None of these"],
          "required": true,
          "rationale": "To identify safety concerns and exercise limitations"
        }}
      ]
    }}
  ],
  "totalQuestions": 20,
  "estimatedTime": "5-7 minutes"
}}

Question types allowed:
- "select": Single choice from options
- "multiselect": Multiple choices allowed
- "text": Free text input
- "number": Numeric input
- "boolean": Yes/No toggle
- "scale": 1-10 rating scale

Generate questions that are:
1. Specific to their goals ({goals_text})
2. Consider their conditions ({conditions_text})
3. Appropriate for their diet type ({profile.get('dietType', 'any')})
4. Relevant to their activity level ({profile.get('activityLevel', 'moderate')})

Make questions conversational and user-friendly."""

        return prompt

    def _validate_and_structure(self, data: Dict, goals: List[str], conditions: List[str]) -> Dict[str, Any]:
        """Validate and ensure proper structure of AI response"""

        categories = data.get('categories', [])

        # Track seen question IDs and similar questions to remove duplicates
        seen_ids = set()
        seen_questions = set()  # Normalized question text

        # Process and deduplicate questions
        for category in categories:
            unique_questions = []
            for question in category.get('questions', []):
                # Generate ID if missing
                if 'id' not in question:
                    question['id'] = f"q_{hash(question.get('question', ''))}"

                # Skip if we've seen this ID
                if question['id'] in seen_ids:
                    continue

                # Normalize question text for similarity check
                q_text = question.get('question', '').lower().strip()
                # Extract key words for similarity matching
                q_normalized = ' '.join(sorted(set(q_text.split())))

                # Skip very similar questions
                if q_normalized in seen_questions:
                    continue

                seen_ids.add(question['id'])
                seen_questions.add(q_normalized)

                # Set defaults
                if 'type' not in question:
                    question['type'] = 'text'
                if 'required' not in question:
                    question['required'] = False

                # Handle options field - must be list or None
                options = question.get('options')
                if options is not None:
                    if isinstance(options, dict):
                        # Scale type or invalid - set to None
                        question['options'] = None
                    elif not isinstance(options, list):
                        question['options'] = None
                    else:
                        # Ensure all options are strings
                        question['options'] = [str(opt) for opt in options]

                unique_questions.append(question)

            category['questions'] = unique_questions

        # Remove empty categories
        categories = [c for c in categories if c.get('questions')]

        return {
            'categories': categories,
            'totalQuestions': sum(len(c.get('questions', [])) for c in categories),
            'estimatedTime': data.get('estimatedTime', '5-7 minutes'),
            'generatedFor': {
                'goals': goals,
                'conditions': conditions
            }
        }

    def _get_fallback_questions(self, goals: List[str], conditions: List[str]) -> Dict[str, Any]:
        """Return comprehensive fallback questions when AI fails"""

        categories = [
            {
                "id": "fitness_background",
                "title": "Fitness & Training Background",
                "icon": "dumbbell",
                "questions": [
                    {
                        "id": "training_experience",
                        "question": "What is your workout/training experience?",
                        "type": "select",
                        "options": ["Complete beginner", "Some experience (0-6 months)", "Intermediate (6-24 months)", "Advanced (2+ years)"],
                        "required": True,
                        "rationale": "To customize workout intensity"
                    },
                    {
                        "id": "workout_frequency",
                        "question": "How many days per week can you commit to exercise?",
                        "type": "select",
                        "options": ["1-2 days", "3-4 days", "5-6 days", "Every day"],
                        "required": True,
                        "rationale": "To plan workout schedule"
                    },
                    {
                        "id": "workout_location",
                        "question": "Where will you primarily work out?",
                        "type": "select",
                        "options": ["Home (no equipment)", "Home (some equipment)", "Gym", "Outdoor"],
                        "required": True,
                        "rationale": "To recommend suitable exercises"
                    },
                    {
                        "id": "comfortable_exercises",
                        "question": "Which exercises can you perform comfortably?",
                        "type": "multiselect",
                        "options": ["Push-ups", "Squats", "Lunges", "Plank", "Jogging", "None of these"],
                        "required": False,
                        "rationale": "To assess baseline fitness"
                    }
                ]
            },
            {
                "id": "health_safety",
                "title": "Health & Safety Assessment",
                "icon": "heart",
                "questions": [
                    {
                        "id": "exercise_symptoms",
                        "question": "Do you experience any of these during physical activity?",
                        "type": "multiselect",
                        "options": ["Shortness of breath", "Chest pain/tightness", "Dizziness", "Excessive fatigue", "Joint pain", "None of these"],
                        "required": True,
                        "rationale": "To identify safety concerns"
                    },
                    {
                        "id": "injuries",
                        "question": "Do you have any current or past injuries?",
                        "type": "multiselect",
                        "options": ["Back pain", "Knee issues", "Shoulder problems", "Ankle/foot issues", "Neck pain", "None"],
                        "required": True,
                        "rationale": "To avoid exercises that may cause harm"
                    },
                    {
                        "id": "medical_clearance",
                        "question": "Have you consulted a doctor before starting an exercise program?",
                        "type": "select",
                        "options": ["Yes, recently", "Yes, but long ago", "No, but I'm healthy", "No, I have concerns"],
                        "required": True,
                        "rationale": "To ensure safe exercise prescription"
                    },
                    {
                        "id": "family_history",
                        "question": "Any family history of these conditions?",
                        "type": "multiselect",
                        "options": ["Heart disease", "Diabetes", "High blood pressure", "High cholesterol", "None of these"],
                        "required": False,
                        "rationale": "To identify genetic risk factors"
                    }
                ]
            },
            {
                "id": "nutrition_habits",
                "title": "Nutrition & Eating Habits",
                "icon": "utensils",
                "questions": [
                    {
                        "id": "meals_per_day",
                        "question": "How many meals do you typically eat per day?",
                        "type": "select",
                        "options": ["1-2 meals", "3 meals", "4-5 meals", "6+ small meals"],
                        "required": True,
                        "rationale": "To plan meal timing"
                    },
                    {
                        "id": "protein_sources",
                        "question": "What are your main protein sources?",
                        "type": "multiselect",
                        "options": ["Dal/Lentils", "Paneer", "Tofu", "Eggs", "Chicken", "Fish", "Whey protein", "Soy products"],
                        "required": True,
                        "rationale": "To ensure adequate protein intake"
                    },
                    {
                        "id": "water_intake_actual",
                        "question": "How many glasses of water do you drink daily?",
                        "type": "select",
                        "options": ["Less than 4", "4-6 glasses", "6-8 glasses", "8-10 glasses", "More than 10"],
                        "required": True,
                        "rationale": "Hydration is crucial for fitness"
                    },
                    {
                        "id": "unhealthy_foods",
                        "question": "How often do you consume these?",
                        "type": "multiselect",
                        "options": ["Sugary drinks/sodas", "Fried foods", "Packaged snacks", "Sweets/desserts", "Fast food", "Rarely any of these"],
                        "required": False,
                        "rationale": "To identify dietary improvements"
                    },
                    {
                        "id": "supplements",
                        "question": "Do you currently take any supplements?",
                        "type": "multiselect",
                        "options": ["Protein powder", "Multivitamins", "Omega-3", "Creatine", "BCAA", "None"],
                        "required": False,
                        "rationale": "To avoid redundant recommendations"
                    }
                ]
            },
            {
                "id": "lifestyle_recovery",
                "title": "Lifestyle & Recovery",
                "icon": "moon",
                "questions": [
                    {
                        "id": "sleep_quality",
                        "question": "How would you rate your sleep quality?",
                        "type": "select",
                        "options": ["Poor - I struggle to sleep", "Fair - I wake up often", "Good - Mostly restful", "Excellent - Deep sleep"],
                        "required": True,
                        "rationale": "Sleep affects recovery and results"
                    },
                    {
                        "id": "wake_feeling",
                        "question": "How do you feel when you wake up?",
                        "type": "select",
                        "options": ["Tired and groggy", "Somewhat tired", "Fairly refreshed", "Energized and ready"],
                        "required": True,
                        "rationale": "Indicates recovery quality"
                    },
                    {
                        "id": "sitting_hours",
                        "question": "How many hours do you sit continuously each day?",
                        "type": "select",
                        "options": ["Less than 2 hours", "2-4 hours", "4-6 hours", "6-8 hours", "More than 8 hours"],
                        "required": True,
                        "rationale": "Sedentary time affects posture and health"
                    },
                    {
                        "id": "stress_management",
                        "question": "How do you currently manage stress?",
                        "type": "multiselect",
                        "options": ["Exercise", "Meditation/yoga", "Hobbies", "Talking to friends/family", "Not actively managing", "Other"],
                        "required": False,
                        "rationale": "Stress impacts fitness progress"
                    }
                ]
            },
            {
                "id": "goals_preferences",
                "title": "Goals & Preferences",
                "icon": "target",
                "questions": [
                    {
                        "id": "timeline",
                        "question": "What is your expected timeline for visible results?",
                        "type": "select",
                        "options": ["1-3 months", "3-6 months", "6-12 months", "Long-term lifestyle change"],
                        "required": True,
                        "rationale": "To set realistic expectations"
                    },
                    {
                        "id": "motivation",
                        "question": "What motivates you most to achieve your goals?",
                        "type": "select",
                        "options": ["Health improvement", "Physical appearance", "More energy", "Sports/performance", "Confidence boost", "Medical necessity"],
                        "required": True,
                        "rationale": "To provide personalized motivation"
                    },
                    {
                        "id": "past_attempts",
                        "question": "Have you tried fitness programs before?",
                        "type": "select",
                        "options": ["No, this is my first time", "Yes, but gave up early", "Yes, with some success", "Yes, multiple times"],
                        "required": True,
                        "rationale": "To understand barriers and challenges"
                    },
                    {
                        "id": "preferred_workout_time",
                        "question": "When do you prefer to exercise?",
                        "type": "select",
                        "options": ["Early morning", "Morning", "Afternoon", "Evening", "Night", "Flexible"],
                        "required": True,
                        "rationale": "To optimize workout scheduling"
                    }
                ]
            },
            {
                "id": "personalization",
                "title": "Personalization & Support",
                "icon": "sparkles",
                "questions": [
                    {
                        "id": "tracking_preference",
                        "question": "How would you like to track your progress?",
                        "type": "multiselect",
                        "options": ["Daily workout logs", "Weekly weigh-ins", "Progress photos", "Measurements", "Fitness tests", "Minimal tracking"],
                        "required": False,
                        "rationale": "To customize tracking experience"
                    },
                    {
                        "id": "reminder_preference",
                        "question": "Would you like workout and meal reminders?",
                        "type": "select",
                        "options": ["Yes, daily reminders", "Yes, but only important ones", "No reminders needed"],
                        "required": True,
                        "rationale": "To set up notifications"
                    },
                    {
                        "id": "ai_comfort",
                        "question": "Are you comfortable following AI-generated fitness and nutrition plans?",
                        "type": "select",
                        "options": ["Yes, fully comfortable", "Yes, but want expert review option", "Somewhat hesitant", "Prefer human-created plans"],
                        "required": True,
                        "rationale": "To understand trust level and adjust recommendations"
                    }
                ]
            }
        ]

        # Add goal-specific categories
        if 'muscle_gain' in goals:
            categories.insert(2, self._get_muscle_gain_category())

        if any(g in goals for g in ['improve_heart_health', 'heart_condition']) or \
           any(c in conditions for c in ['heart_condition', 'hypertension']):
            categories.insert(2, self._get_heart_health_category())

        if 'weight_loss' in goals:
            categories.insert(2, self._get_weight_loss_category())

        if 'diabetes' in goals or 'diabetes' in conditions:
            categories.insert(2, self._get_diabetes_category())

        if 'pcod' in goals or 'pcod' in conditions:
            categories.insert(2, self._get_pcod_category())

        return {
            'categories': categories,
            'totalQuestions': sum(len(c.get('questions', [])) for c in categories),
            'estimatedTime': '5-8 minutes',
            'generatedFor': {
                'goals': goals,
                'conditions': conditions
            }
        }

    def _get_muscle_gain_category(self) -> Dict:
        return {
            "id": "muscle_goals",
            "title": "Muscle Building Goals",
            "icon": "dumbbell",
            "questions": [
                {
                    "id": "muscle_goal_type",
                    "question": "What type of physique are you aiming for?",
                    "type": "select",
                    "options": ["Lean and toned", "Athletic build", "Muscular/Bulky", "Strength-focused"],
                    "required": True,
                    "rationale": "To customize training approach"
                },
                {
                    "id": "target_weight",
                    "question": "Do you have a target body weight in mind?",
                    "type": "text",
                    "placeholder": "e.g., 75 kg or 'No specific target'",
                    "required": False,
                    "rationale": "To set measurable goals"
                },
                {
                    "id": "gym_access",
                    "question": "What equipment do you have access to?",
                    "type": "multiselect",
                    "options": ["Full gym", "Dumbbells", "Barbells", "Resistance bands", "Pull-up bar", "Bodyweight only"],
                    "required": True,
                    "rationale": "To design appropriate exercises"
                },
                {
                    "id": "protein_knowledge",
                    "question": "Do you know your daily protein requirements?",
                    "type": "select",
                    "options": ["Yes, I track protein", "Somewhat aware", "No idea", "Would like to learn"],
                    "required": True,
                    "rationale": "Protein is crucial for muscle building"
                }
            ]
        }

    def _get_heart_health_category(self) -> Dict:
        return {
            "id": "cardiovascular_health",
            "title": "Cardiovascular Health Assessment",
            "icon": "heart",
            "questions": [
                {
                    "id": "heart_conditions",
                    "question": "Have you ever been diagnosed with any heart-related conditions?",
                    "type": "multiselect",
                    "options": ["High blood pressure", "High cholesterol", "Arrhythmia", "Heart murmur", "Previous heart issues", "None"],
                    "required": True,
                    "rationale": "Critical for safe exercise prescription"
                },
                {
                    "id": "cardio_symptoms",
                    "question": "Do you experience any of these during physical activity?",
                    "type": "multiselect",
                    "options": ["Rapid heartbeat", "Shortness of breath", "Chest discomfort", "Unusual fatigue", "Lightheadedness", "None"],
                    "required": True,
                    "rationale": "To identify potential cardiac concerns"
                },
                {
                    "id": "cardio_capacity",
                    "question": "What is your current cardiovascular capacity?",
                    "type": "select",
                    "options": ["Can walk 30 min easily", "Can jog 10-15 min", "Can run 20+ min", "Limited - get tired quickly"],
                    "required": True,
                    "rationale": "To determine starting intensity"
                },
                {
                    "id": "resting_heart_rate",
                    "question": "Do you know your resting heart rate?",
                    "type": "select",
                    "options": ["Yes, below 60 bpm", "Yes, 60-80 bpm", "Yes, above 80 bpm", "I don't know"],
                    "required": False,
                    "rationale": "Indicates cardiovascular fitness level"
                },
                {
                    "id": "last_checkup",
                    "question": "When was your last cardiovascular health check-up?",
                    "type": "select",
                    "options": ["Within last 6 months", "6-12 months ago", "1-2 years ago", "More than 2 years", "Never had one"],
                    "required": True,
                    "rationale": "To recommend medical consultation if needed"
                }
            ]
        }

    def _get_weight_loss_category(self) -> Dict:
        return {
            "id": "weight_loss",
            "title": "Weight Loss Journey",
            "icon": "scale",
            "questions": [
                {
                    "id": "target_weight_loss",
                    "question": "How much weight would you like to lose?",
                    "type": "select",
                    "options": ["1-5 kg", "5-10 kg", "10-20 kg", "More than 20 kg", "Not sure, want to feel healthier"],
                    "required": True,
                    "rationale": "To set realistic targets"
                },
                {
                    "id": "previous_diets",
                    "question": "Have you tried dieting before?",
                    "type": "select",
                    "options": ["No, first time", "Yes, with temporary success", "Yes, but weight came back", "Multiple attempts"],
                    "required": True,
                    "rationale": "To avoid past mistakes"
                },
                {
                    "id": "eating_patterns",
                    "question": "Which of these apply to your eating habits?",
                    "type": "multiselect",
                    "options": ["Emotional eating", "Late night snacking", "Skipping meals", "Eating too fast", "Large portions", "None of these"],
                    "required": True,
                    "rationale": "To address behavioral patterns"
                },
                {
                    "id": "weight_loss_barriers",
                    "question": "What has stopped you from losing weight before?",
                    "type": "multiselect",
                    "options": ["Lack of time", "Cravings", "Social eating", "Lack of motivation", "Slow metabolism", "Health issues", "First attempt"],
                    "required": False,
                    "rationale": "To provide targeted support"
                }
            ]
        }

    def _get_diabetes_category(self) -> Dict:
        return {
            "id": "diabetes_management",
            "title": "Diabetes Management",
            "icon": "activity",
            "questions": [
                {
                    "id": "diabetes_type",
                    "question": "What type of diabetes do you have?",
                    "type": "select",
                    "options": ["Type 1", "Type 2", "Pre-diabetic", "Gestational", "Not sure"],
                    "required": True,
                    "rationale": "Different types need different approaches"
                },
                {
                    "id": "diabetes_management",
                    "question": "How do you currently manage your diabetes?",
                    "type": "multiselect",
                    "options": ["Diet control", "Oral medication", "Insulin", "Exercise", "No active management"],
                    "required": True,
                    "rationale": "To understand current treatment"
                },
                {
                    "id": "blood_sugar_monitoring",
                    "question": "How often do you check your blood sugar?",
                    "type": "select",
                    "options": ["Multiple times daily", "Once daily", "Few times a week", "Rarely", "Never"],
                    "required": True,
                    "rationale": "To recommend safe exercise timing"
                },
                {
                    "id": "hypoglycemia",
                    "question": "Do you experience low blood sugar (hypoglycemia)?",
                    "type": "select",
                    "options": ["Frequently", "Sometimes", "Rarely", "Never"],
                    "required": True,
                    "rationale": "Important for exercise safety"
                }
            ]
        }

    def _get_pcod_category(self) -> Dict:
        return {
            "id": "pcod_management",
            "title": "PCOD/PCOS Assessment",
            "icon": "heart",
            "questions": [
                {
                    "id": "pcod_symptoms",
                    "question": "Which PCOD symptoms do you experience?",
                    "type": "multiselect",
                    "options": ["Irregular periods", "Weight gain", "Acne", "Hair loss", "Excess facial hair", "Mood swings", "Fatigue"],
                    "required": True,
                    "rationale": "To tailor recommendations for symptoms"
                },
                {
                    "id": "pcod_medication",
                    "question": "Are you on any medication for PCOD?",
                    "type": "select",
                    "options": ["Yes, hormonal", "Yes, Metformin", "Yes, both", "No medication", "Herbal/natural remedies"],
                    "required": True,
                    "rationale": "Medications affect exercise and diet"
                },
                {
                    "id": "insulin_resistance",
                    "question": "Have you been diagnosed with insulin resistance?",
                    "type": "select",
                    "options": ["Yes", "No", "Not tested", "Not sure"],
                    "required": True,
                    "rationale": "Affects dietary recommendations"
                },
                {
                    "id": "conception_plans",
                    "question": "Are you planning to conceive in the near future?",
                    "type": "select",
                    "options": ["Yes, actively trying", "Yes, in the future", "No", "Not sure"],
                    "required": False,
                    "rationale": "Affects exercise intensity recommendations"
                }
            ]
        }
