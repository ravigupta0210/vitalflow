"""
Condition-Specific Rules - Guidelines for Health Conditions
Comprehensive rules for managing health conditions through lifestyle
"""

CONDITION_RULES = {
    "diabetes": {
        "overview": "Blood sugar management through diet, exercise, and lifestyle",
        "nutrition": {
            "focus": ["low_gi_foods", "high_fiber", "portion_control"],
            "avoid": ["refined_sugar", "white_bread", "sugary_drinks", "fruit_juice"],
            "meal_timing": "5-6 small meals throughout the day",
            "carb_strategy": "Spread carbs evenly, prefer complex carbs"
        },
        "exercise": {
            "recommended": ["walking", "swimming", "cycling", "resistance_training"],
            "timing": "1-3 hours after meals",
            "precautions": [
                "Check blood sugar before and after exercise",
                "Carry fast-acting carbs",
                "Stay hydrated",
                "Wear medical ID"
            ],
            "avoid": ["exercising if blood sugar is very high or low"]
        },
        "lifestyle": {
            "sleep": "7-8 hours for better insulin sensitivity",
            "stress": "Manage stress as it affects blood sugar",
            "monitoring": "Regular blood sugar checks"
        }
    },

    "hypertension": {
        "overview": "Blood pressure management through DASH diet and lifestyle",
        "nutrition": {
            "focus": ["potassium_rich", "low_sodium", "whole_grains", "lean_protein"],
            "sodium_limit": "1500-2300 mg/day",
            "dash_diet": True,
            "avoid": ["processed_foods", "canned_soups", "pickles", "excess_salt"]
        },
        "exercise": {
            "recommended": ["walking", "swimming", "cycling", "light_weights"],
            "avoid": ["heavy_lifting", "isometric_exercises", "breath_holding"],
            "precautions": [
                "Monitor blood pressure before exercise",
                "Avoid sudden position changes",
                "Stay hydrated"
            ]
        },
        "lifestyle": {
            "alcohol": "Limit or avoid",
            "caffeine": "Moderate",
            "stress": "Practice relaxation techniques"
        }
    },

    "heart_condition": {
        "overview": "Heart health through gentle exercise and heart-healthy diet",
        "requires_clearance": True,
        "nutrition": {
            "focus": ["omega_3", "fiber", "antioxidants", "plant_based"],
            "avoid": ["saturated_fats", "trans_fats", "excess_sodium", "processed_meats"]
        },
        "exercise": {
            "recommended": ["walking", "light_swimming", "gentle_yoga"],
            "avoid": ["high_intensity", "heavy_weights", "competitive_sports"],
            "precautions": [
                "Get medical clearance first",
                "Monitor heart rate continuously",
                "Stop if experiencing symptoms"
            ]
        },
        "warning_signs": ["chest_pain", "shortness_of_breath", "dizziness", "irregular_heartbeat"]
    },

    "pcod": {
        "overview": "PCOD management through insulin-sensitive diet and exercise",
        "nutrition": {
            "focus": ["low_gi", "anti_inflammatory", "protein_rich", "healthy_fats"],
            "avoid": ["refined_carbs", "excess_dairy", "processed_foods"],
            "supplements": ["inositol", "vitamin_d", "omega_3"]
        },
        "exercise": {
            "recommended": ["strength_training", "hiit", "yoga", "pilates"],
            "benefits": "Improves insulin sensitivity and hormone balance",
            "frequency": "4-5 times per week"
        },
        "lifestyle": {
            "sleep": "Critical for hormone regulation",
            "stress": "Manage cortisol levels",
            "weight": "Even 5% weight loss can improve symptoms"
        }
    },

    "thyroid_hypo": {
        "overview": "Hypothyroidism management - support metabolism",
        "nutrition": {
            "focus": ["iodine_adequate", "selenium_rich", "zinc"],
            "helpful_foods": ["fish", "eggs", "dairy", "brazil_nuts"],
            "limit": ["raw_cruciferous_vegetables", "soy_products"],
            "timing": "Take medication on empty stomach, wait before eating"
        },
        "exercise": {
            "recommended": ["strength_training", "moderate_cardio", "yoga"],
            "benefits": "Boosts metabolism, improves energy",
            "caution": "Listen to fatigue, don't overtrain"
        },
        "lifestyle": {
            "sleep": "May need more than average",
            "energy": "Plan activities for when energy is highest"
        }
    },

    "thyroid_hyper": {
        "overview": "Hyperthyroidism management - calm the system",
        "nutrition": {
            "focus": ["calorie_adequate", "calcium_rich", "vitamin_d"],
            "helpful_foods": ["dairy", "leafy_greens", "nuts"],
            "limit": ["iodine_rich_foods", "caffeine", "processed_foods"]
        },
        "exercise": {
            "recommended": ["moderate_exercise", "yoga", "swimming"],
            "avoid": ["high_intensity_prolonged"],
            "caution": "Avoid overheating, stay hydrated"
        },
        "lifestyle": {
            "stress": "Critical to manage",
            "rest": "Allow for adequate recovery"
        }
    },

    "weight_loss": {
        "overview": "Sustainable weight loss through calorie deficit",
        "nutrition": {
            "deficit": "300-500 kcal/day for safe loss",
            "protein": "High to preserve muscle (1.6-2.2g/kg)",
            "fiber": "High for satiety (25-30g/day)",
            "focus": ["whole_foods", "lean_protein", "vegetables"]
        },
        "exercise": {
            "recommended": ["strength_training", "hiit", "walking"],
            "cardio": "150-300 minutes/week",
            "strength": "2-3 sessions/week"
        },
        "lifestyle": {
            "sleep": "7-9 hours - sleep deprivation increases hunger",
            "stress": "High cortisol promotes fat storage",
            "tracking": "Food diary improves results"
        },
        "expectations": {
            "safe_rate": "0.5-1 kg per week",
            "initial": "First week may show more due to water loss"
        }
    },

    "muscle_gain": {
        "overview": "Hypertrophy through progressive overload and nutrition",
        "nutrition": {
            "surplus": "200-400 kcal/day",
            "protein": "1.8-2.4g/kg body weight",
            "carbs": "High for energy and recovery",
            "timing": "Protein every 3-4 hours"
        },
        "exercise": {
            "focus": ["compound_movements", "progressive_overload"],
            "frequency": "Each muscle 2x/week",
            "rep_range": "6-12 for hypertrophy",
            "rest": "90-180 seconds between sets"
        },
        "lifestyle": {
            "sleep": "8+ hours - growth hormone release during deep sleep",
            "stress": "Manage to optimize testosterone",
            "recovery": "At least 48 hours between same muscle groups"
        }
    },

    "mental_wellness": {
        "overview": "Mental health support through lifestyle",
        "nutrition": {
            "focus": ["omega_3", "b_vitamins", "magnesium", "probiotics"],
            "gut_brain": "Gut health affects mental health",
            "avoid": ["excess_sugar", "processed_foods", "excess_alcohol"]
        },
        "exercise": {
            "benefits": "Releases endorphins, reduces anxiety",
            "recommended": ["any_enjoyable_activity", "yoga", "walking"],
            "minimum": "150 minutes/week of moderate activity"
        },
        "lifestyle": {
            "sleep": "Critical for mental health",
            "sunlight": "10-30 minutes daily",
            "social": "Maintain connections",
            "professional": "Seek help if needed"
        }
    },

    "sleep_improvement": {
        "overview": "Better sleep through sleep hygiene",
        "nutrition": {
            "avoid_evening": ["caffeine", "alcohol", "heavy_meals"],
            "helpful": ["magnesium_rich_foods", "tart_cherry", "chamomile"]
        },
        "exercise": {
            "timing": "Not within 3 hours of bedtime",
            "benefits": "Regular exercise improves sleep quality"
        },
        "lifestyle": {
            "schedule": "Consistent sleep and wake times",
            "environment": "Cool, dark, quiet bedroom",
            "screens": "Avoid 1 hour before bed",
            "routine": "Relaxing pre-sleep routine"
        }
    }
}
