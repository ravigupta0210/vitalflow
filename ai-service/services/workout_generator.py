"""
Workout Generator Service - AI-Powered Dynamic Workout Generation
"""

from models.health_profile import (
    WorkoutRequest, WorkoutPlanResponse, WorkoutDay, Exercise
)
from services.gemini_client import GeminiClient
from rules.workout_rules import (
    EXERCISE_RESTRICTIONS, PROGRESSION_RULES,
    filter_safe_exercises, get_workout_split
)
from research.exercise_database import EXERCISE_DATABASE, GOAL_EXERCISE_MAP
import json
import httpx
import random
from datetime import datetime

# Free exercise video database (wger.de API is free)
EXERCISE_VIDEOS = {
    "push-ups": "https://www.youtube.com/watch?v=IODxDxX7oi4",
    "bench press": "https://www.youtube.com/watch?v=rT7DgCr-3pg",
    "barbell bench press": "https://www.youtube.com/watch?v=rT7DgCr-3pg",
    "incline bench press": "https://www.youtube.com/watch?v=jPLdzuHckI8",
    "dumbbell press": "https://www.youtube.com/watch?v=VmB1G1K7v94",
    "squats": "https://www.youtube.com/watch?v=aclHkVaku9U",
    "barbell squats": "https://www.youtube.com/watch?v=aclHkVaku9U",
    "goblet squats": "https://www.youtube.com/watch?v=MeIiIdhvXT4",
    "lunges": "https://www.youtube.com/watch?v=QOVaHwm-Q6U",
    "deadlift": "https://www.youtube.com/watch?v=op9kVnSso6Q",
    "romanian deadlift": "https://www.youtube.com/watch?v=JCXUYuzwNrM",
    "pull-ups": "https://www.youtube.com/watch?v=eGo4IYlbE5g",
    "lat pulldown": "https://www.youtube.com/watch?v=CAwf7n6Luuc",
    "bent over rows": "https://www.youtube.com/watch?v=FWJR5Ve8bnQ",
    "barbell rows": "https://www.youtube.com/watch?v=FWJR5Ve8bnQ",
    "dumbbell rows": "https://www.youtube.com/watch?v=pYcpY20QaE8",
    "shoulder press": "https://www.youtube.com/watch?v=qEwKCR5JCog",
    "overhead press": "https://www.youtube.com/watch?v=2yjwXTZQDDI",
    "lateral raises": "https://www.youtube.com/watch?v=3VcKaXpzqRo",
    "bicep curls": "https://www.youtube.com/watch?v=ykJmrZ5v0Oo",
    "hammer curls": "https://www.youtube.com/watch?v=zC3nLlEvin4",
    "tricep dips": "https://www.youtube.com/watch?v=0326dy_-CzM",
    "tricep pushdowns": "https://www.youtube.com/watch?v=2-LAMcpzODU",
    "skull crushers": "https://www.youtube.com/watch?v=d_KZxkY_0cM",
    "plank": "https://www.youtube.com/watch?v=pSHjTRCQxIw",
    "crunches": "https://www.youtube.com/watch?v=Xyd_fa5zoEU",
    "leg raises": "https://www.youtube.com/watch?v=JB2oyawG9KI",
    "mountain climbers": "https://www.youtube.com/watch?v=nmwgirgXLYM",
    "burpees": "https://www.youtube.com/watch?v=dZgVxmf6jkA",
    "leg press": "https://www.youtube.com/watch?v=IZxyjW7MPJQ",
    "leg curls": "https://www.youtube.com/watch?v=1Tq3QdYUuHs",
    "leg extensions": "https://www.youtube.com/watch?v=YyvSfVjQeL0",
    "calf raises": "https://www.youtube.com/watch?v=gwLzBJYoWlI",
    "hip thrusts": "https://www.youtube.com/watch?v=xDmFkJxPzeM",
    "glute bridges": "https://www.youtube.com/watch?v=8bbE64NuDTU",
    "face pulls": "https://www.youtube.com/watch?v=rep-qVOkqgk",
    "cable flyes": "https://www.youtube.com/watch?v=Iwe6AmxVf7o",
    "chest flyes": "https://www.youtube.com/watch?v=eozdVDA78K0",
    "front raises": "https://www.youtube.com/watch?v=-t7fuZ0KhDA",
    "rear delt flyes": "https://www.youtube.com/watch?v=EA7u4Q_8HQ0",
    "shrugs": "https://www.youtube.com/watch?v=cJRVVxmytaM",
    "russian twists": "https://www.youtube.com/watch?v=wkD8rjkodUI",
    "bicycle crunches": "https://www.youtube.com/watch?v=9FGilxCbdz8",
    "cable crunches": "https://www.youtube.com/watch?v=AV5PmZJIrrw",
}


def get_video_url(exercise_name: str) -> str:
    """Get video URL for an exercise"""
    name_lower = exercise_name.lower()
    for key, url in EXERCISE_VIDEOS.items():
        if key in name_lower or name_lower in key:
            return url
    return None


class WorkoutGenerator:
    """Generates personalized workout plans using rules + AI"""

    def __init__(self, gemini_client: GeminiClient):
        self.gemini = gemini_client

    async def generate(self, request: WorkoutRequest) -> WorkoutPlanResponse:
        """Generate a complete workout plan"""

        # Step 1: Filter safe exercises based on conditions
        safe_exercises = filter_safe_exercises(
            EXERCISE_DATABASE,
            request.conditions
        )

        # Step 2: Get workout split based on goals and preferences
        split = get_workout_split(
            request.goals,
            request.preferences.daysPerWeek
        )

        # Step 3: Get progression rules
        experience = self._determine_experience(request.questionnaire)
        progression = PROGRESSION_RULES.get(experience, PROGRESSION_RULES["beginner"])

        # Step 4: Generate plan with AI
        plan = await self._generate_ai_plan(request, safe_exercises, split, progression)

        return plan

    def _determine_experience(self, questionnaire: dict) -> str:
        """Determine user's experience level from questionnaire"""
        for key, value in questionnaire.items():
            if "experience" in key.lower() or "training" in key.lower():
                value_lower = str(value).lower()
                if "beginner" in value_lower or "0-6" in value_lower:
                    return "beginner"
                elif "intermediate" in value_lower:
                    return "intermediate"
                elif "advanced" in value_lower:
                    return "advanced"
        return "beginner"

    async def _generate_ai_plan(
        self,
        request: WorkoutRequest,
        safe_exercises: dict,
        split: list,
        progression: dict
    ) -> WorkoutPlanResponse:
        """Generate workout plan using AI - fully dynamic"""

        days_per_week = request.preferences.daysPerWeek
        duration = request.preferences.durationMins
        equipment = request.preferences.equipment

        # Add variety seeds for unique plans each time
        variety_seed = random.randint(1, 1000)
        today = datetime.now().strftime("%Y-%m-%d")

        # Exercise variety suggestions based on goals
        goal_exercises = {
            "muscle_gain": ["compound movements", "progressive overload", "hypertrophy rep ranges", "isolation exercises"],
            "weight_loss": ["circuit training", "supersets", "HIIT elements", "metabolic conditioning"],
            "strength": ["heavy compounds", "low rep ranges", "powerlifting movements", "accessory work"],
            "general_fitness": ["balanced approach", "functional movements", "cardio elements", "flexibility work"]
        }

        primary_goal = request.goals[0] if request.goals else "general_fitness"
        exercise_hints = goal_exercises.get(primary_goal, goal_exercises["general_fitness"])
        random.shuffle(exercise_hints)

        # Determine split type
        if days_per_week <= 3:
            split_suggestion = "Full Body split (3 different full body workouts)"
        elif days_per_week == 4:
            split_suggestion = "Upper/Lower split or Push/Pull/Legs/Full Body"
        elif days_per_week == 5:
            split_suggestion = "Push/Pull/Legs/Upper/Lower or Bro split"
        else:
            split_suggestion = "Body part split (Chest, Back, Legs, Shoulders, Arms, Core)"

        prompt = f"""You are an expert personal trainer creating a UNIQUE workout program. Generate variety #{variety_seed} for {today}.

USER PROFILE:
- Age: {request.profile.age} years
- Gender: {request.profile.gender}
- Weight: {request.profile.weight} kg
- Activity Level: {request.profile.activityLevel}
- Available Equipment: {equipment}
- Session Duration: {duration} minutes

TRAINING GOALS: {', '.join(request.goals) if request.goals else 'general fitness'}
HEALTH CONDITIONS TO CONSIDER: {', '.join(request.conditions) if request.conditions else 'none'}

PROGRAMMING REQUIREMENTS:
1. Create exactly {days_per_week} workout days
2. Each day needs 5-6 exercises
3. Focus on: {', '.join(exercise_hints[:3])}
4. Recommended split: {split_suggestion}
5. Include warm-up and cool-down notes
6. Vary exercises - don't repeat the same exercise on multiple days

EXERCISE DESCRIPTION REQUIREMENTS:
- Each exercise MUST have detailed form cues
- Include breathing instructions where relevant
- Mention common mistakes to avoid in notes

Return ONLY valid JSON in this exact format:
{{
  "title": "Custom {primary_goal.replace('_', ' ').title()} Program",
  "description": "Personalized {days_per_week}-day program designed for {primary_goal.replace('_', ' ')}",
  "duration_weeks": 4,
  "difficulty_level": "intermediate",
  "goal_focus": "{primary_goal}",
  "equipment": ["{equipment}"],
  "days": [
    {{
      "day_number": 1,
      "day_name": "Monday",
      "focus_area": "Focus Area Name",
      "estimated_duration_mins": {duration},
      "exercises": [
        {{
          "name": "Exercise Name",
          "description": "Detailed form description with 2-3 sentences on proper execution",
          "sets": 4,
          "reps": "8-10",
          "rest_seconds": 90,
          "weight_suggestion": "moderate",
          "notes": "Form tips and common mistakes to avoid"
        }}
      ]
    }}
  ],
  "weekly_tips": [
    "Tip 1 for progression",
    "Tip 2 for recovery",
    "Tip 3 for nutrition"
  ],
  "safety_notes": [
    "Warm up requirement",
    "Form note",
    "Recovery note"
  ]
}}

CRITICAL RULES:
- Generate ALL {days_per_week} days with 5-6 exercises EACH
- Each day MUST have a unique focus_area
- Exercises should vary between days
- Include specific sets, reps, and rest times
- Make descriptions detailed with proper form cues"""

        try:
            response = await self.gemini.generate(prompt, expect_json=True)
            plan_data = json.loads(response)

            # Validate and convert to response model
            days = []
            for day_data in plan_data.get("days", []):
                exercises = []
                for ex_data in day_data.get("exercises", []):
                    video_url = get_video_url(ex_data.get("name", ""))
                    exercises.append(Exercise(
                        name=ex_data.get("name", "Exercise"),
                        description=ex_data.get("description", ""),
                        sets=ex_data.get("sets", 3),
                        reps=ex_data.get("reps", "10-12"),
                        rest_seconds=ex_data.get("rest_seconds", 60),
                        weight_suggestion=ex_data.get("weight_suggestion", "bodyweight"),
                        video_url=video_url,
                        image_url=ex_data.get("image_url"),
                        notes=ex_data.get("notes")
                    ))

                days.append(WorkoutDay(
                    day_number=day_data.get("day_number", 1),
                    day_name=day_data.get("day_name", "Day"),
                    focus_area=day_data.get("focus_area", "Full Body"),
                    estimated_duration_mins=day_data.get("estimated_duration_mins", duration),
                    exercises=exercises
                ))

            # If AI returned empty days, use fallback
            if not days:
                print("AI returned empty days, using fallback")
                return self._generate_fallback_plan(request, split)

            return WorkoutPlanResponse(
                title=plan_data.get("title", "Custom Workout Plan"),
                description=plan_data.get("description", "AI-generated workout plan"),
                duration_weeks=plan_data.get("duration_weeks", 4),
                difficulty_level=plan_data.get("difficulty_level", "intermediate"),
                goal_focus=plan_data.get("goal_focus", request.goals[0] if request.goals else "general_fitness"),
                equipment=plan_data.get("equipment", [equipment]),
                days=days,
                weekly_tips=plan_data.get("weekly_tips", []),
                safety_notes=plan_data.get("safety_notes", [])
            )

        except Exception as e:
            print(f"Error generating AI workout plan: {e}")
            return self._generate_fallback_plan(request, split)

    def _generate_fallback_plan(self, request: WorkoutRequest, split: list) -> WorkoutPlanResponse:
        """Generate a comprehensive fallback plan when AI is unavailable"""

        days = []
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        days_per_week = request.preferences.daysPerWeek
        equipment = request.preferences.equipment
        duration = request.preferences.durationMins

        # Define comprehensive workout splits
        if days_per_week <= 3:
            focus_areas = ["Full Body A", "Full Body B", "Full Body C"]
        elif days_per_week == 4:
            focus_areas = ["Upper Body Push", "Lower Body", "Upper Body Pull", "Full Body"]
        elif days_per_week == 5:
            focus_areas = ["Chest & Triceps", "Back & Biceps", "Legs", "Shoulders & Arms", "Full Body HIIT"]
        else:
            focus_areas = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core & Cardio"]

        for i in range(min(days_per_week, len(focus_areas))):
            focus = focus_areas[i]
            exercises = self._get_detailed_exercises(focus, equipment)

            days.append(WorkoutDay(
                day_number=i + 1,
                day_name=day_names[i],
                focus_area=focus,
                estimated_duration_mins=duration,
                exercises=exercises
            ))

        goal_focus = request.goals[0] if request.goals else "general_fitness"

        return WorkoutPlanResponse(
            title=f"{goal_focus.replace('_', ' ').title()} Training Program",
            description=f"A structured {days_per_week}-day workout program designed for {goal_focus.replace('_', ' ')}. Follow this plan consistently for 4 weeks.",
            duration_weeks=4,
            difficulty_level="intermediate",
            goal_focus=goal_focus,
            equipment=[equipment] if equipment else ["gym"],
            days=days,
            weekly_tips=[
                "Increase weight by 2.5-5% when you can complete all reps with good form",
                "Track your workouts to monitor progress",
                "Get 7-8 hours of sleep for optimal recovery",
                "Eat protein within 2 hours post-workout"
            ],
            safety_notes=[
                "Always warm up for 5-10 minutes before lifting",
                "Use proper form - reduce weight if form breaks down",
                "Stay hydrated throughout your workout"
            ]
        )

    def _get_detailed_exercises(self, focus: str, equipment: str) -> list:
        """Get detailed exercises for a focus area with video links"""

        exercise_library = {
            "Chest & Triceps": [
                Exercise(name="Barbell Bench Press", description="Lie flat on bench. Grip bar slightly wider than shoulders. Lower bar to mid-chest, press up explosively.", sets=4, reps="8-10", rest_seconds=90, weight_suggestion="heavy", video_url=get_video_url("bench press"), notes="Keep shoulder blades retracted throughout"),
                Exercise(name="Incline Dumbbell Press", description="Set bench to 30-45 degrees. Press dumbbells from shoulders to full extension.", sets=3, reps="10-12", rest_seconds=75, weight_suggestion="moderate", video_url=get_video_url("incline bench press"), notes="Focus on upper chest squeeze"),
                Exercise(name="Cable Flyes", description="Stand between cables set at shoulder height. Bring handles together in front of chest with slight elbow bend.", sets=3, reps="12-15", rest_seconds=60, weight_suggestion="light", video_url=get_video_url("cable flyes"), notes="Squeeze chest at the peak contraction"),
                Exercise(name="Tricep Pushdowns", description="Use rope or bar attachment. Keep elbows pinned to sides. Extend arms fully and squeeze triceps.", sets=3, reps="12-15", rest_seconds=60, weight_suggestion="moderate", video_url=get_video_url("tricep pushdowns"), notes="Don't let elbows flare out"),
                Exercise(name="Skull Crushers", description="Lie on bench with EZ bar. Lower bar to forehead by bending elbows only. Extend back up.", sets=3, reps="10-12", rest_seconds=60, weight_suggestion="moderate", video_url=get_video_url("skull crushers"), notes="Keep upper arms stationary"),
            ],
            "Back & Biceps": [
                Exercise(name="Lat Pulldown", description="Grip bar wider than shoulders. Pull down to upper chest while squeezing lats. Control the release.", sets=4, reps="10-12", rest_seconds=75, weight_suggestion="moderate", video_url=get_video_url("lat pulldown"), notes="Lean back slightly, don't swing"),
                Exercise(name="Barbell Rows", description="Bend at hips to 45 degrees. Pull bar to lower chest. Squeeze shoulder blades together.", sets=4, reps="8-10", rest_seconds=90, weight_suggestion="heavy", video_url=get_video_url("barbell rows"), notes="Keep back flat, core tight"),
                Exercise(name="Dumbbell Rows", description="Place one hand and knee on bench. Row dumbbell to hip, keeping elbow close to body.", sets=3, reps="10-12 each", rest_seconds=60, weight_suggestion="moderate", video_url=get_video_url("dumbbell rows"), notes="Full stretch at bottom"),
                Exercise(name="Face Pulls", description="Set cable at face height. Pull rope to face while externally rotating shoulders. Squeeze rear delts.", sets=3, reps="15-20", rest_seconds=45, weight_suggestion="light", video_url=get_video_url("face pulls"), notes="Great for posture and shoulder health"),
                Exercise(name="Barbell Bicep Curls", description="Stand with barbell at thighs. Curl to shoulders keeping elbows stationary. Lower slowly.", sets=3, reps="10-12", rest_seconds=60, weight_suggestion="moderate", video_url=get_video_url("bicep curls"), notes="Don't swing the weight"),
                Exercise(name="Hammer Curls", description="Hold dumbbells with neutral grip. Curl to shoulders alternating arms. Targets brachialis.", sets=3, reps="12 each", rest_seconds=45, weight_suggestion="moderate", video_url=get_video_url("hammer curls"), notes="Keep wrists straight"),
            ],
            "Legs": [
                Exercise(name="Barbell Squats", description="Bar on upper back. Feet shoulder-width. Squat until thighs parallel to floor. Drive through heels.", sets=4, reps="8-10", rest_seconds=120, weight_suggestion="heavy", video_url=get_video_url("squats"), notes="Keep chest up, knees tracking over toes"),
                Exercise(name="Romanian Deadlift", description="Hold bar at thighs. Hinge at hips pushing butt back. Lower until hamstring stretch. Drive hips forward.", sets=4, reps="10-12", rest_seconds=90, weight_suggestion="moderate", video_url=get_video_url("romanian deadlift"), notes="Keep bar close to legs, slight knee bend"),
                Exercise(name="Leg Press", description="Sit in machine with feet shoulder-width on platform. Lower until 90 degrees, press back up.", sets=3, reps="12-15", rest_seconds=75, weight_suggestion="heavy", video_url=get_video_url("leg press"), notes="Don't lock out knees at top"),
                Exercise(name="Leg Curls", description="Lie face down on machine. Curl heels toward glutes squeezing hamstrings. Lower slowly.", sets=3, reps="12-15", rest_seconds=60, weight_suggestion="moderate", video_url=get_video_url("leg curls"), notes="Control the negative"),
                Exercise(name="Calf Raises", description="Stand on edge of platform. Lower heels below platform level. Rise up onto toes and squeeze.", sets=4, reps="15-20", rest_seconds=45, weight_suggestion="moderate", video_url=get_video_url("calf raises"), notes="Full range of motion is key"),
            ],
            "Shoulders & Arms": [
                Exercise(name="Overhead Press", description="Start bar at shoulders. Press straight up overhead. Lock out arms at top.", sets=4, reps="8-10", rest_seconds=90, weight_suggestion="moderate", video_url=get_video_url("overhead press"), notes="Keep core braced, don't lean back"),
                Exercise(name="Lateral Raises", description="Hold dumbbells at sides. Raise arms out to sides until parallel to floor. Lower slowly.", sets=3, reps="12-15", rest_seconds=60, weight_suggestion="light", video_url=get_video_url("lateral raises"), notes="Lead with elbows, slight forward lean"),
                Exercise(name="Rear Delt Flyes", description="Bend forward at hips. Raise dumbbells out to sides squeezing rear delts.", sets=3, reps="15", rest_seconds=45, weight_suggestion="light", video_url=get_video_url("rear delt flyes"), notes="Keep slight bend in elbows"),
                Exercise(name="Barbell Bicep Curls", description="Stand with barbell. Curl weight to shoulders keeping elbows pinned.", sets=3, reps="10-12", rest_seconds=60, weight_suggestion="moderate", video_url=get_video_url("bicep curls"), notes="Full extension at bottom"),
                Exercise(name="Tricep Dips", description="Support yourself on parallel bars. Lower body until upper arms parallel. Press back up.", sets=3, reps="10-12", rest_seconds=75, weight_suggestion="bodyweight", video_url=get_video_url("tricep dips"), notes="Lean slightly forward for chest emphasis"),
            ],
            "Full Body A": [
                Exercise(name="Barbell Squats", description="Bar on upper back. Squat to parallel. Drive through heels to stand.", sets=4, reps="8-10", rest_seconds=120, weight_suggestion="heavy", video_url=get_video_url("squats"), notes="Chest up, core braced"),
                Exercise(name="Barbell Bench Press", description="Flat bench, grip bar shoulder-width plus. Lower to chest, press up.", sets=4, reps="8-10", rest_seconds=90, weight_suggestion="heavy", video_url=get_video_url("bench press"), notes="Retract shoulder blades"),
                Exercise(name="Barbell Rows", description="Hinge forward, pull bar to lower chest. Squeeze back at top.", sets=4, reps="8-10", rest_seconds=90, weight_suggestion="heavy", video_url=get_video_url("barbell rows"), notes="Keep back flat"),
                Exercise(name="Overhead Press", description="Press bar from shoulders to overhead. Lock out fully.", sets=3, reps="8-10", rest_seconds=75, weight_suggestion="moderate", video_url=get_video_url("overhead press"), notes="Core tight throughout"),
                Exercise(name="Plank", description="Forearms and toes on ground. Maintain straight line from head to heels.", sets=3, reps="45-60 sec", rest_seconds=45, weight_suggestion="bodyweight", video_url=get_video_url("plank"), notes="Don't let hips sag"),
            ],
            "Full Body B": [
                Exercise(name="Romanian Deadlift", description="Hinge at hips, lower bar along legs. Feel hamstring stretch. Stand tall.", sets=4, reps="10-12", rest_seconds=90, weight_suggestion="moderate", video_url=get_video_url("romanian deadlift"), notes="Slight knee bend"),
                Exercise(name="Incline Dumbbell Press", description="30-45 degree incline. Press dumbbells up and together.", sets=3, reps="10-12", rest_seconds=75, weight_suggestion="moderate", video_url=get_video_url("incline bench press"), notes="Upper chest focus"),
                Exercise(name="Lat Pulldown", description="Wide grip pulldown to upper chest. Squeeze lats at bottom.", sets=4, reps="10-12", rest_seconds=75, weight_suggestion="moderate", video_url=get_video_url("lat pulldown"), notes="Control the eccentric"),
                Exercise(name="Lunges", description="Step forward into lunge. Both knees at 90 degrees. Push back to start.", sets=3, reps="10 each leg", rest_seconds=60, weight_suggestion="moderate", video_url=get_video_url("lunges"), notes="Keep torso upright"),
                Exercise(name="Face Pulls", description="Cable at face height. Pull to face, externally rotate at end.", sets=3, reps="15-20", rest_seconds=45, weight_suggestion="light", video_url=get_video_url("face pulls"), notes="Great for shoulders"),
            ],
            "Full Body C": [
                Exercise(name="Goblet Squats", description="Hold dumbbell at chest. Squat deep keeping chest up. Stand tall.", sets=4, reps="12-15", rest_seconds=75, weight_suggestion="moderate", video_url=get_video_url("goblet squats"), notes="Great for mobility"),
                Exercise(name="Push-ups", description="Hands shoulder-width. Lower chest to ground. Press up fully.", sets=3, reps="15-20", rest_seconds=60, weight_suggestion="bodyweight", video_url=get_video_url("push-ups"), notes="Core tight throughout"),
                Exercise(name="Dumbbell Rows", description="One arm at a time. Pull to hip, squeeze back.", sets=3, reps="12 each", rest_seconds=60, weight_suggestion="moderate", video_url=get_video_url("dumbbell rows"), notes="Full stretch at bottom"),
                Exercise(name="Hip Thrusts", description="Upper back on bench. Drive hips up, squeeze glutes. Lower controlled.", sets=3, reps="12-15", rest_seconds=60, weight_suggestion="moderate", video_url=get_video_url("hip thrusts"), notes="Chin tucked, ribs down"),
                Exercise(name="Bicycle Crunches", description="Alternate elbow to opposite knee. Rotate torso, engage obliques.", sets=3, reps="20 each side", rest_seconds=45, weight_suggestion="bodyweight", video_url=get_video_url("bicycle crunches"), notes="Slow and controlled"),
            ],
            "Upper Body Push": [
                Exercise(name="Barbell Bench Press", description="Flat bench, grip bar shoulder-width plus. Lower to chest, press up.", sets=4, reps="8-10", rest_seconds=90, weight_suggestion="heavy", video_url=get_video_url("bench press"), notes="Retract shoulder blades"),
                Exercise(name="Overhead Press", description="Press bar from shoulders to overhead. Lock out fully.", sets=4, reps="8-10", rest_seconds=90, weight_suggestion="moderate", video_url=get_video_url("overhead press"), notes="Core tight"),
                Exercise(name="Incline Dumbbell Press", description="30-45 degree incline. Press dumbbells up and together.", sets=3, reps="10-12", rest_seconds=75, weight_suggestion="moderate", video_url=get_video_url("incline bench press"), notes="Upper chest focus"),
                Exercise(name="Lateral Raises", description="Raise dumbbells to sides until parallel to floor.", sets=3, reps="12-15", rest_seconds=60, weight_suggestion="light", video_url=get_video_url("lateral raises"), notes="Lead with elbows"),
                Exercise(name="Tricep Pushdowns", description="Cable pushdown, squeeze triceps at bottom.", sets=3, reps="12-15", rest_seconds=60, weight_suggestion="moderate", video_url=get_video_url("tricep pushdowns"), notes="Elbows pinned"),
            ],
            "Upper Body Pull": [
                Exercise(name="Lat Pulldown", description="Wide grip pulldown to upper chest. Squeeze lats.", sets=4, reps="10-12", rest_seconds=75, weight_suggestion="moderate", video_url=get_video_url("lat pulldown"), notes="Control the eccentric"),
                Exercise(name="Barbell Rows", description="Hinge forward, pull bar to lower chest. Squeeze back.", sets=4, reps="8-10", rest_seconds=90, weight_suggestion="heavy", video_url=get_video_url("barbell rows"), notes="Keep back flat"),
                Exercise(name="Face Pulls", description="Pull cable to face, externally rotate at end.", sets=3, reps="15-20", rest_seconds=45, weight_suggestion="light", video_url=get_video_url("face pulls"), notes="Great for posture"),
                Exercise(name="Barbell Bicep Curls", description="Curl bar to shoulders, elbows stationary.", sets=3, reps="10-12", rest_seconds=60, weight_suggestion="moderate", video_url=get_video_url("bicep curls"), notes="No swinging"),
                Exercise(name="Hammer Curls", description="Neutral grip dumbbell curls for brachialis.", sets=3, reps="12 each", rest_seconds=45, weight_suggestion="moderate", video_url=get_video_url("hammer curls"), notes="Alternate arms"),
            ],
            "Lower Body": [
                Exercise(name="Barbell Squats", description="Bar on upper back. Squat to parallel. Drive through heels.", sets=4, reps="8-10", rest_seconds=120, weight_suggestion="heavy", video_url=get_video_url("squats"), notes="Chest up, core braced"),
                Exercise(name="Romanian Deadlift", description="Hinge at hips, feel hamstring stretch. Stand tall.", sets=4, reps="10-12", rest_seconds=90, weight_suggestion="moderate", video_url=get_video_url("romanian deadlift"), notes="Slight knee bend"),
                Exercise(name="Leg Press", description="Feet shoulder-width on platform. Lower to 90 degrees, press up.", sets=3, reps="12-15", rest_seconds=75, weight_suggestion="heavy", video_url=get_video_url("leg press"), notes="Don't lock knees"),
                Exercise(name="Leg Curls", description="Curl heels to glutes, squeeze hamstrings.", sets=3, reps="12-15", rest_seconds=60, weight_suggestion="moderate", video_url=get_video_url("leg curls"), notes="Control negative"),
                Exercise(name="Calf Raises", description="Rise onto toes, squeeze calves at top.", sets=4, reps="15-20", rest_seconds=45, weight_suggestion="moderate", video_url=get_video_url("calf raises"), notes="Full ROM"),
            ],
            "Full Body": [
                Exercise(name="Goblet Squats", description="Hold dumbbell at chest. Squat deep keeping chest up.", sets=3, reps="12-15", rest_seconds=60, weight_suggestion="moderate", video_url=get_video_url("goblet squats"), notes="Great warm-up"),
                Exercise(name="Push-ups", description="Hands shoulder-width. Lower chest to ground. Press up.", sets=3, reps="15-20", rest_seconds=60, weight_suggestion="bodyweight", video_url=get_video_url("push-ups"), notes="Core tight"),
                Exercise(name="Dumbbell Rows", description="Pull dumbbell to hip, squeeze back.", sets=3, reps="12 each", rest_seconds=60, weight_suggestion="moderate", video_url=get_video_url("dumbbell rows"), notes="Full stretch"),
                Exercise(name="Lunges", description="Step forward, both knees 90 degrees. Alternate legs.", sets=3, reps="10 each", rest_seconds=60, weight_suggestion="moderate", video_url=get_video_url("lunges"), notes="Upright torso"),
                Exercise(name="Plank", description="Hold straight line from head to heels.", sets=3, reps="45-60 sec", rest_seconds=45, weight_suggestion="bodyweight", video_url=get_video_url("plank"), notes="Don't sag"),
            ],
            "Full Body HIIT": [
                Exercise(name="Burpees", description="Squat down, jump feet back, push-up, jump up. Full body power.", sets=4, reps="10", rest_seconds=45, weight_suggestion="bodyweight", video_url=get_video_url("burpees"), notes="Explosive movement"),
                Exercise(name="Mountain Climbers", description="Plank position. Drive knees to chest alternating rapidly.", sets=4, reps="30 sec", rest_seconds=30, weight_suggestion="bodyweight", video_url=get_video_url("mountain climbers"), notes="Keep hips low"),
                Exercise(name="Jump Squats", description="Squat down, explode up into jump. Land soft.", sets=3, reps="15", rest_seconds=45, weight_suggestion="bodyweight", video_url=get_video_url("squats"), notes="Land softly"),
                Exercise(name="Push-ups", description="Standard push-ups with controlled tempo.", sets=3, reps="15-20", rest_seconds=30, weight_suggestion="bodyweight", video_url=get_video_url("push-ups"), notes="Full ROM"),
                Exercise(name="Bicycle Crunches", description="Alternate elbow to opposite knee.", sets=3, reps="20 each", rest_seconds=30, weight_suggestion="bodyweight", video_url=get_video_url("bicycle crunches"), notes="Slow and controlled"),
            ],
            "Chest": [
                Exercise(name="Barbell Bench Press", description="Lower bar to mid-chest, press up explosively.", sets=4, reps="8-10", rest_seconds=90, weight_suggestion="heavy", video_url=get_video_url("bench press"), notes="Shoulder blades retracted"),
                Exercise(name="Incline Dumbbell Press", description="30-45 degree angle, press dumbbells up.", sets=4, reps="10-12", rest_seconds=75, weight_suggestion="moderate", video_url=get_video_url("incline bench press"), notes="Upper chest focus"),
                Exercise(name="Cable Flyes", description="Bring cables together in front of chest.", sets=3, reps="12-15", rest_seconds=60, weight_suggestion="light", video_url=get_video_url("cable flyes"), notes="Squeeze at peak"),
                Exercise(name="Dips", description="Lean forward slightly, lower body, press up.", sets=3, reps="10-12", rest_seconds=75, weight_suggestion="bodyweight", video_url=get_video_url("tricep dips"), notes="Chest focus with forward lean"),
            ],
            "Back": [
                Exercise(name="Pull-ups", description="Grip bar wide, pull chin over bar.", sets=4, reps="6-10", rest_seconds=90, weight_suggestion="bodyweight", video_url=get_video_url("pull-ups"), notes="Full extension at bottom"),
                Exercise(name="Barbell Rows", description="Pull bar to lower chest, squeeze lats.", sets=4, reps="8-10", rest_seconds=90, weight_suggestion="heavy", video_url=get_video_url("barbell rows"), notes="Keep back flat"),
                Exercise(name="Lat Pulldown", description="Wide grip, pull to upper chest.", sets=3, reps="10-12", rest_seconds=75, weight_suggestion="moderate", video_url=get_video_url("lat pulldown"), notes="Lean back slightly"),
                Exercise(name="Dumbbell Rows", description="One arm row, pull to hip.", sets=3, reps="12 each", rest_seconds=60, weight_suggestion="moderate", video_url=get_video_url("dumbbell rows"), notes="Full stretch"),
            ],
            "Shoulders": [
                Exercise(name="Overhead Press", description="Press bar from shoulders overhead.", sets=4, reps="8-10", rest_seconds=90, weight_suggestion="moderate", video_url=get_video_url("overhead press"), notes="Core braced"),
                Exercise(name="Lateral Raises", description="Raise dumbbells to sides.", sets=4, reps="12-15", rest_seconds=60, weight_suggestion="light", video_url=get_video_url("lateral raises"), notes="Lead with elbows"),
                Exercise(name="Front Raises", description="Raise dumbbells to front.", sets=3, reps="12-15", rest_seconds=60, weight_suggestion="light", video_url=get_video_url("front raises"), notes="Alternate arms"),
                Exercise(name="Rear Delt Flyes", description="Bend over, raise dumbbells out.", sets=3, reps="15", rest_seconds=45, weight_suggestion="light", video_url=get_video_url("rear delt flyes"), notes="Squeeze at top"),
            ],
            "Arms": [
                Exercise(name="Barbell Bicep Curls", description="Curl bar to shoulders.", sets=4, reps="10-12", rest_seconds=60, weight_suggestion="moderate", video_url=get_video_url("bicep curls"), notes="No swinging"),
                Exercise(name="Skull Crushers", description="Lower bar to forehead, extend.", sets=4, reps="10-12", rest_seconds=60, weight_suggestion="moderate", video_url=get_video_url("skull crushers"), notes="Upper arms stationary"),
                Exercise(name="Hammer Curls", description="Neutral grip curls.", sets=3, reps="12 each", rest_seconds=45, weight_suggestion="moderate", video_url=get_video_url("hammer curls"), notes="Alternate arms"),
                Exercise(name="Tricep Pushdowns", description="Cable pushdown, squeeze at bottom.", sets=3, reps="12-15", rest_seconds=45, weight_suggestion="moderate", video_url=get_video_url("tricep pushdowns"), notes="Elbows pinned"),
            ],
            "Core & Cardio": [
                Exercise(name="Plank", description="Hold straight line body position.", sets=4, reps="60 sec", rest_seconds=30, weight_suggestion="bodyweight", video_url=get_video_url("plank"), notes="Don't sag"),
                Exercise(name="Russian Twists", description="Rotate torso side to side with weight.", sets=3, reps="20 each", rest_seconds=45, weight_suggestion="light", video_url=get_video_url("russian twists"), notes="Keep feet elevated"),
                Exercise(name="Mountain Climbers", description="Drive knees to chest rapidly.", sets=4, reps="45 sec", rest_seconds=30, weight_suggestion="bodyweight", video_url=get_video_url("mountain climbers"), notes="Keep hips low"),
                Exercise(name="Leg Raises", description="Raise legs to vertical, lower slowly.", sets=3, reps="15", rest_seconds=45, weight_suggestion="bodyweight", video_url=get_video_url("leg raises"), notes="Lower back pressed down"),
            ],
        }

        # Match focus area or return full body default
        for key, exercises in exercise_library.items():
            if key.lower() in focus.lower() or focus.lower() in key.lower():
                return exercises

        return exercise_library.get("Full Body", [])
