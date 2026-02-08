"""
Health Benchmarks - WHO/Medical Standards
Evidence-based health targets and recommendations
"""

HEALTH_BENCHMARKS = {
    "daily_water_intake": {
        "formula": "weight_kg * 30ml",
        "minimum_ml": 2000,
        "maximum_ml": 4000,
        "adjustment": {
            "active": "+500ml",
            "hot_weather": "+500ml",
            "exercise": "+500-1000ml per hour"
        },
        "source": "WHO Guidelines, National Academies of Sciences"
    },

    "sleep_recommendations": {
        "18-25": {"hours_min": 7, "hours_max": 9, "ideal": 8},
        "26-64": {"hours_min": 7, "hours_max": 9, "ideal": 8},
        "65+": {"hours_min": 7, "hours_max": 8, "ideal": 7.5},
        "source": "National Sleep Foundation"
    },

    "step_goals": {
        "sedentary": 5000,
        "low_active": 7500,
        "active": 10000,
        "highly_active": 12500,
        "source": "CDC Physical Activity Guidelines"
    },

    "protein_requirements": {
        "sedentary": {"per_kg": 0.8, "source": "RDA"},
        "lightly_active": {"per_kg": 1.0, "source": "ISSN"},
        "active": {"per_kg": 1.2, "source": "ISSN"},
        "athlete": {"per_kg": 1.6, "source": "ISSN Position Stand"},
        "muscle_building": {"per_kg": 2.0, "source": "ISSN Position Stand"},
        "weight_loss": {"per_kg": 2.2, "source": "Higher to preserve muscle"}
    },

    "exercise_guidelines": {
        "cardio": {
            "moderate_intensity": "150 minutes/week",
            "vigorous_intensity": "75 minutes/week",
            "or_combination": True,
            "source": "WHO, CDC"
        },
        "strength": {
            "frequency": "2+ days/week",
            "muscle_groups": "all major groups",
            "source": "WHO, ACSM"
        }
    },

    "bmi_categories": {
        "severely_underweight": {"range": [0, 16], "risk": "very_high"},
        "underweight": {"range": [16, 18.5], "risk": "moderate"},
        "normal": {"range": [18.5, 25], "risk": "low"},
        "overweight": {"range": [25, 30], "risk": "moderate"},
        "obese_class_1": {"range": [30, 35], "risk": "high"},
        "obese_class_2": {"range": [35, 40], "risk": "very_high"},
        "obese_class_3": {"range": [40, 100], "risk": "extremely_high"},
        "source": "WHO"
    },

    "waist_circumference": {
        "male": {
            "healthy": {"max_cm": 94},
            "increased_risk": {"range_cm": [94, 102]},
            "high_risk": {"min_cm": 102}
        },
        "female": {
            "healthy": {"max_cm": 80},
            "increased_risk": {"range_cm": [80, 88]},
            "high_risk": {"min_cm": 88}
        },
        "source": "WHO"
    },

    "blood_pressure": {
        "optimal": {"systolic": [90, 120], "diastolic": [60, 80]},
        "normal": {"systolic": [120, 130], "diastolic": [80, 85]},
        "high_normal": {"systolic": [130, 140], "diastolic": [85, 90]},
        "hypertension_stage_1": {"systolic": [140, 160], "diastolic": [90, 100]},
        "hypertension_stage_2": {"systolic": [160, 180], "diastolic": [100, 110]},
        "hypertension_stage_3": {"systolic": [180, 300], "diastolic": [110, 200]},
        "source": "American Heart Association"
    },

    "heart_rate": {
        "resting": {
            "excellent": {"bpm": [40, 60]},
            "good": {"bpm": [60, 70]},
            "average": {"bpm": [70, 80]},
            "below_average": {"bpm": [80, 100]}
        },
        "max_formula": "220 - age",
        "target_zones": {
            "fat_burn": "50-70% of max",
            "cardio": "70-85% of max",
            "peak": "85-100% of max"
        },
        "source": "American Heart Association"
    },

    "blood_sugar": {
        "fasting": {
            "normal": {"mg_dl": [70, 100]},
            "prediabetes": {"mg_dl": [100, 126]},
            "diabetes": {"mg_dl": [126, 500]}
        },
        "post_meal_2hr": {
            "normal": {"mg_dl": [0, 140]},
            "prediabetes": {"mg_dl": [140, 200]},
            "diabetes": {"mg_dl": [200, 500]}
        },
        "hba1c": {
            "normal": {"percent": [0, 5.7]},
            "prediabetes": {"percent": [5.7, 6.5]},
            "diabetes": {"percent": [6.5, 15]}
        },
        "source": "American Diabetes Association"
    },

    "cholesterol": {
        "total": {
            "desirable": {"mg_dl": [0, 200]},
            "borderline_high": {"mg_dl": [200, 240]},
            "high": {"mg_dl": [240, 500]}
        },
        "ldl": {
            "optimal": {"mg_dl": [0, 100]},
            "near_optimal": {"mg_dl": [100, 130]},
            "borderline_high": {"mg_dl": [130, 160]},
            "high": {"mg_dl": [160, 190]},
            "very_high": {"mg_dl": [190, 500]}
        },
        "hdl": {
            "low_risk_male": {"mg_dl": [60, 200]},
            "low_risk_female": {"mg_dl": [60, 200]},
            "high_risk": {"mg_dl": [0, 40]}
        },
        "source": "American Heart Association"
    },

    "calorie_guidelines": {
        "weight_loss": {
            "safe_deficit": "500-750 kcal/day",
            "max_deficit": "1000 kcal/day",
            "expected_loss": "0.5-1 kg/week"
        },
        "muscle_gain": {
            "surplus": "200-400 kcal/day",
            "expected_gain": "0.25-0.5 kg/week"
        },
        "minimum_intake": {
            "female": 1200,
            "male": 1500
        },
        "source": "Various - ACSM, CDC"
    }
}
