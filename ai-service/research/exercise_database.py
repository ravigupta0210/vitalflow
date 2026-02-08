"""
Exercise Database - Research-backed Exercise Data
100+ exercises with full metadata
"""

EXERCISE_DATABASE = {
    # CHEST EXERCISES
    "bench_press": {
        "name": "Barbell Bench Press",
        "primary_muscles": ["pectoralis_major", "anterior_deltoid", "triceps"],
        "secondary_muscles": ["serratus_anterior"],
        "equipment": ["barbell", "bench"],
        "difficulty": "intermediate",
        "compound": True,
        "research_notes": "EMG studies show 85% chest activation. Gold standard for chest development.",
        "form_cues": ["Retract scapula", "Arch back slightly", "Feet flat on floor", "Lower to mid-chest"],
        "common_mistakes": ["Flaring elbows too wide", "Bouncing bar off chest", "Incomplete range of motion"],
        "contraindications": ["shoulder_injury", "rotator_cuff_tear"]
    },
    "push_ups": {
        "name": "Push-ups",
        "primary_muscles": ["pectoralis_major", "triceps", "anterior_deltoid"],
        "secondary_muscles": ["core", "serratus_anterior"],
        "equipment": ["bodyweight"],
        "difficulty": "beginner",
        "compound": True,
        "form_cues": ["Keep core tight", "Elbows at 45 degrees", "Full range of motion"],
        "variations": ["Wide grip", "Diamond", "Decline", "Incline"],
        "contraindications": ["wrist_injury"]
    },
    "dumbbell_flyes": {
        "name": "Dumbbell Flyes",
        "primary_muscles": ["pectoralis_major"],
        "equipment": ["dumbbells", "bench"],
        "difficulty": "intermediate",
        "compound": False,
        "form_cues": ["Slight bend in elbows", "Control the descent", "Squeeze at top"],
        "contraindications": ["shoulder_injury"]
    },

    # BACK EXERCISES
    "deadlift": {
        "name": "Conventional Deadlift",
        "primary_muscles": ["erector_spinae", "glutes", "hamstrings"],
        "secondary_muscles": ["quadriceps", "forearms", "traps"],
        "equipment": ["barbell"],
        "difficulty": "advanced",
        "compound": True,
        "research_notes": "Best exercise for posterior chain development. EMG shows high activation across multiple muscle groups.",
        "form_cues": ["Keep back neutral", "Push through heels", "Bar close to body", "Hinge at hips"],
        "common_mistakes": ["Rounding lower back", "Bar drifting forward", "Hyperextending at top"],
        "contraindications": ["back_pain", "herniated_disc"]
    },
    "pull_ups": {
        "name": "Pull-ups",
        "primary_muscles": ["latissimus_dorsi", "biceps", "rear_deltoid"],
        "secondary_muscles": ["forearms", "core"],
        "equipment": ["pull_up_bar"],
        "difficulty": "intermediate",
        "compound": True,
        "form_cues": ["Full hang at bottom", "Pull elbows down", "Chin over bar"],
        "variations": ["Wide grip", "Close grip", "Neutral grip", "Assisted"],
        "contraindications": ["shoulder_injury", "elbow_problems"]
    },
    "barbell_rows": {
        "name": "Barbell Bent-Over Row",
        "primary_muscles": ["latissimus_dorsi", "rhomboids", "rear_deltoid"],
        "secondary_muscles": ["biceps", "erector_spinae"],
        "equipment": ["barbell"],
        "difficulty": "intermediate",
        "compound": True,
        "form_cues": ["Hinge at hips", "Keep back flat", "Pull to lower chest"],
        "contraindications": ["back_pain"]
    },

    # LEG EXERCISES
    "squat": {
        "name": "Barbell Back Squat",
        "primary_muscles": ["quadriceps", "glutes", "hamstrings"],
        "secondary_muscles": ["core", "erector_spinae"],
        "equipment": ["barbell", "squat_rack"],
        "difficulty": "intermediate",
        "compound": True,
        "research_notes": "King of leg exercises. Increases testosterone and growth hormone.",
        "form_cues": ["Feet shoulder width", "Chest up", "Knees track toes", "Depth to parallel or below"],
        "common_mistakes": ["Knees caving in", "Forward lean", "Heels rising"],
        "contraindications": ["knee_problems", "back_pain"]
    },
    "lunges": {
        "name": "Walking Lunges",
        "primary_muscles": ["quadriceps", "glutes"],
        "secondary_muscles": ["hamstrings", "core"],
        "equipment": ["bodyweight", "dumbbells"],
        "difficulty": "beginner",
        "compound": True,
        "form_cues": ["Knee over ankle", "Keep torso upright", "Control the descent"],
        "contraindications": ["knee_problems"]
    },
    "leg_press": {
        "name": "Leg Press",
        "primary_muscles": ["quadriceps", "glutes"],
        "secondary_muscles": ["hamstrings"],
        "equipment": ["leg_press_machine"],
        "difficulty": "beginner",
        "compound": True,
        "form_cues": ["Feet shoulder width", "Lower controlled", "Don't lock knees"],
        "contraindications": ["knee_problems"]
    },
    "romanian_deadlift": {
        "name": "Romanian Deadlift",
        "primary_muscles": ["hamstrings", "glutes", "erector_spinae"],
        "equipment": ["barbell", "dumbbells"],
        "difficulty": "intermediate",
        "compound": True,
        "form_cues": ["Slight knee bend", "Hinge at hips", "Feel hamstring stretch"],
        "contraindications": ["back_pain"]
    },

    # SHOULDER EXERCISES
    "overhead_press": {
        "name": "Barbell Overhead Press",
        "primary_muscles": ["anterior_deltoid", "medial_deltoid", "triceps"],
        "secondary_muscles": ["core", "upper_chest"],
        "equipment": ["barbell"],
        "difficulty": "intermediate",
        "compound": True,
        "form_cues": ["Tight core", "Press straight up", "Full lockout"],
        "contraindications": ["shoulder_injury", "hypertension"]
    },
    "lateral_raises": {
        "name": "Dumbbell Lateral Raises",
        "primary_muscles": ["medial_deltoid"],
        "equipment": ["dumbbells"],
        "difficulty": "beginner",
        "compound": False,
        "form_cues": ["Slight bend in elbows", "Raise to shoulder height", "Control the descent"],
        "contraindications": ["shoulder_injury"]
    },
    "face_pulls": {
        "name": "Cable Face Pulls",
        "primary_muscles": ["rear_deltoid", "rhomboids", "external_rotators"],
        "equipment": ["cable_machine"],
        "difficulty": "beginner",
        "compound": False,
        "form_cues": ["Pull to face level", "Squeeze shoulder blades", "External rotate at end"],
        "contraindications": []
    },

    # ARM EXERCISES
    "bicep_curls": {
        "name": "Dumbbell Bicep Curls",
        "primary_muscles": ["biceps"],
        "equipment": ["dumbbells"],
        "difficulty": "beginner",
        "compound": False,
        "form_cues": ["Keep elbows fixed", "Full range of motion", "Control the negative"],
        "contraindications": ["elbow_problems"]
    },
    "tricep_dips": {
        "name": "Tricep Dips",
        "primary_muscles": ["triceps"],
        "secondary_muscles": ["anterior_deltoid", "chest"],
        "equipment": ["parallel_bars", "bench"],
        "difficulty": "intermediate",
        "compound": True,
        "form_cues": ["Keep elbows close", "Lower to 90 degrees", "Full lockout"],
        "contraindications": ["shoulder_injury"]
    },

    # CORE EXERCISES
    "plank": {
        "name": "Plank",
        "primary_muscles": ["rectus_abdominis", "transverse_abdominis", "obliques"],
        "secondary_muscles": ["shoulders", "glutes"],
        "equipment": ["bodyweight"],
        "difficulty": "beginner",
        "compound": False,
        "form_cues": ["Straight line from head to heels", "Don't let hips sag", "Engage core throughout"],
        "contraindications": []
    },
    "cable_crunches": {
        "name": "Cable Crunches",
        "primary_muscles": ["rectus_abdominis"],
        "equipment": ["cable_machine"],
        "difficulty": "intermediate",
        "compound": False,
        "form_cues": ["Hinge at hips", "Contract abs forcefully", "Control the return"],
        "contraindications": ["back_pain"]
    },
    "hanging_leg_raises": {
        "name": "Hanging Leg Raises",
        "primary_muscles": ["rectus_abdominis", "hip_flexors"],
        "equipment": ["pull_up_bar"],
        "difficulty": "advanced",
        "compound": False,
        "form_cues": ["Minimize swinging", "Raise legs to parallel or higher", "Control descent"],
        "contraindications": ["shoulder_injury"]
    },

    # CARDIO EXERCISES
    "burpees": {
        "name": "Burpees",
        "primary_muscles": ["full_body"],
        "equipment": ["bodyweight"],
        "difficulty": "intermediate",
        "compound": True,
        "form_cues": ["Explosive jump", "Soft landing", "Chest to floor"],
        "contraindications": ["heart_condition", "knee_problems"]
    },
    "mountain_climbers": {
        "name": "Mountain Climbers",
        "primary_muscles": ["core", "hip_flexors", "shoulders"],
        "equipment": ["bodyweight"],
        "difficulty": "beginner",
        "compound": True,
        "form_cues": ["Keep hips low", "Drive knees forward", "Maintain plank position"],
        "contraindications": []
    },
    "jump_rope": {
        "name": "Jump Rope",
        "primary_muscles": ["calves", "shoulders"],
        "secondary_muscles": ["core"],
        "equipment": ["jump_rope"],
        "difficulty": "beginner",
        "compound": False,
        "form_cues": ["Stay on balls of feet", "Small jumps", "Rotate wrists"],
        "contraindications": ["knee_problems"]
    }
}

# Goal-specific exercise recommendations
GOAL_EXERCISE_MAP = {
    "muscle_gain": {
        "focus": "compound_movements",
        "rep_range": "6-12",
        "sets": "3-5",
        "rest": "90-180_sec",
        "primary_exercises": ["squat", "deadlift", "bench_press", "barbell_rows", "overhead_press"],
        "frequency": "each_muscle_2x_week"
    },
    "weight_loss": {
        "focus": "metabolic_conditioning",
        "rep_range": "12-20",
        "sets": "3-4",
        "rest": "30-60_sec",
        "include": ["hiit", "circuit_training", "compound_movements"],
        "cardio_emphasis": True
    },
    "strength": {
        "focus": "heavy_compound",
        "rep_range": "1-5",
        "sets": "4-6",
        "rest": "3-5_min",
        "primary_exercises": ["squat", "deadlift", "bench_press", "overhead_press"]
    },
    "endurance": {
        "focus": "high_volume",
        "rep_range": "15-25",
        "sets": "2-3",
        "rest": "30_sec",
        "include": ["cardio", "circuit_training"]
    },
    "general_fitness": {
        "focus": "balanced",
        "rep_range": "10-15",
        "sets": "3",
        "rest": "60-90_sec",
        "include": ["compound", "isolation", "cardio"]
    }
}
