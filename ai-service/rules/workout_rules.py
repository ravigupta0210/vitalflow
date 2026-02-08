"""
Workout Rules Engine - Exercise Safety and Progression
Based on research and medical guidelines
"""

# Condition-specific exercise restrictions
EXERCISE_RESTRICTIONS = {
    "diabetes": {
        "avoid": ["extreme_fasting_cardio", "very_high_intensity_without_prep"],
        "recommended": ["moderate_cardio", "resistance_training", "walking", "swimming"],
        "precautions": ["Check blood sugar before and after", "Carry fast-acting carbs", "Stay hydrated"],
        "max_intensity": "moderate_high"
    },
    "hypertension": {
        "avoid": ["heavy_lifting", "isometric_holds_long", "valsalva_maneuver", "overhead_press_heavy"],
        "recommended": ["walking", "swimming", "cycling", "light_resistance"],
        "precautions": ["Avoid holding breath", "Monitor heart rate", "Cool down gradually"],
        "max_intensity": "moderate"
    },
    "heart_condition": {
        "avoid": ["high_intensity", "heavy_weights", "explosive_movements"],
        "recommended": ["light_cardio", "walking", "gentle_stretching"],
        "precautions": ["Get medical clearance first", "Monitor heart rate closely"],
        "requires_clearance": True,
        "max_intensity": "low_moderate"
    },
    "pcod": {
        "avoid": [],
        "recommended": ["strength_training", "hiit", "yoga", "pilates"],
        "benefits": ["Improves insulin sensitivity", "Helps hormone balance"],
        "focus": "metabolism_boosting"
    },
    "thyroid_hypo": {
        "avoid": ["very_long_cardio_sessions"],
        "recommended": ["strength_training", "moderate_cardio", "yoga"],
        "focus": ["metabolism_boosting", "strength"],
        "caution": "Manage fatigue - don't overtrain"
    },
    "thyroid_hyper": {
        "avoid": ["high_intensity_long_duration"],
        "recommended": ["moderate_exercise", "yoga", "swimming"],
        "caution": "Avoid overheating, stay hydrated"
    },
    "back_pain": {
        "avoid": ["heavy_deadlifts", "sit_ups", "leg_press_heavy", "running"],
        "recommended": ["swimming", "walking", "core_strengthening", "stretching"],
        "precautions": ["Focus on form", "Avoid rounding back"]
    },
    "knee_problems": {
        "avoid": ["deep_squats", "lunges_heavy", "running", "jumping"],
        "recommended": ["swimming", "cycling", "leg_press_partial", "step_ups_low"],
        "precautions": ["Keep knees aligned", "Avoid locking joints"]
    },
    "shoulder_injury": {
        "avoid": ["overhead_press", "behind_neck_press", "upright_rows", "dips"],
        "recommended": ["front_raises_light", "lateral_raises_light", "face_pulls"],
        "precautions": ["Start with light weights", "Focus on rotator cuff"]
    }
}

# Progressive overload rules by experience
PROGRESSION_RULES = {
    "beginner": {
        "weekly_volume_increase": "5-10%",
        "deload_frequency": "every_6_weeks",
        "rep_range": "10-15",
        "sets_per_muscle": "6-10",
        "focus": "form_and_technique"
    },
    "intermediate": {
        "weekly_volume_increase": "2-5%",
        "deload_frequency": "every_4_weeks",
        "rep_range": "6-12",
        "sets_per_muscle": "10-15",
        "focus": "progressive_overload"
    },
    "advanced": {
        "weekly_volume_increase": "1-2%",
        "deload_frequency": "every_3_weeks",
        "rep_range": "varies_by_goal",
        "sets_per_muscle": "15-20",
        "focus": "periodization"
    }
}

# Workout split templates
WORKOUT_SPLITS = {
    "2_days": ["Full Body", "Full Body"],
    "3_days": ["Upper Body", "Lower Body", "Full Body"],
    "4_days": ["Upper Body Push", "Lower Body", "Upper Body Pull", "Full Body"],
    "5_days": ["Upper Body Push", "Lower Body (Quad)", "Upper Body Pull", "Lower Body (Hamstring)", "Full Body/Core"],
    "6_days": ["Push", "Pull", "Legs", "Push", "Pull", "Legs"],
    "7_days": ["Push", "Pull", "Legs", "Upper Body", "Lower Body", "Full Body", "Rest"]
}


def filter_safe_exercises(exercises: dict, conditions: list) -> dict:
    """Filter exercises based on user's medical conditions"""
    if not conditions:
        return exercises

    unsafe_exercises = set()

    for condition in conditions:
        condition_lower = condition.lower().replace(" ", "_")
        restrictions = EXERCISE_RESTRICTIONS.get(condition_lower, {})
        avoid_list = restrictions.get("avoid", [])

        for exercise_key, exercise_data in exercises.items():
            # Check if exercise is in avoid list
            if any(avoid in exercise_key.lower() for avoid in avoid_list):
                unsafe_exercises.add(exercise_key)

            # Check contraindications in exercise data
            contraindications = exercise_data.get("contraindications", [])
            if any(condition_lower in c.lower() for c in contraindications):
                unsafe_exercises.add(exercise_key)

    # Return filtered exercises
    return {k: v for k, v in exercises.items() if k not in unsafe_exercises}


def get_workout_split(goals: list, days_per_week: int) -> list:
    """Get appropriate workout split based on goals and availability"""
    key = f"{days_per_week}_days"
    base_split = WORKOUT_SPLITS.get(key, WORKOUT_SPLITS["3_days"])

    # Modify based on goals
    if "muscle_gain" in goals:
        # More volume-focused split
        if days_per_week >= 5:
            return ["Chest/Triceps", "Back/Biceps", "Legs", "Shoulders/Arms", "Full Body"][:days_per_week]
    elif "weight_loss" in goals:
        # More cardio-focused split
        if days_per_week >= 4:
            return ["Full Body + Cardio", "Upper Body + HIIT", "Lower Body + Cardio", "Full Body + HIIT"][:days_per_week]

    return base_split[:days_per_week]


def get_rest_recommendations(conditions: list) -> dict:
    """Get rest recommendations based on conditions"""
    base_rest = {
        "between_sets": 60,
        "between_exercises": 90,
        "between_workouts": 48  # hours
    }

    # Increase rest for certain conditions
    for condition in conditions:
        condition_lower = condition.lower()
        if condition_lower in ["heart_condition", "hypertension"]:
            base_rest["between_sets"] = 90
            base_rest["between_exercises"] = 120
        elif condition_lower in ["thyroid_hypo"]:
            base_rest["between_workouts"] = 72

    return base_rest
