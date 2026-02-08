"""
Health Rules Engine - Medical Guidelines and Benchmarks
Based on WHO, CDC, and research-backed standards
"""

# BMI Categories (WHO Classification)
HEALTH_RULES = {
    "bmi": {
        "severely_underweight": {
            "range": (0, 16),
            "risk": "very_high",
            "advice": "Seek medical attention. Severely low BMI can indicate malnutrition."
        },
        "underweight": {
            "range": (16, 18.5),
            "risk": "moderate",
            "advice": "Consider increasing caloric intake with nutrient-dense foods."
        },
        "normal": {
            "range": (18.5, 25),
            "risk": "low",
            "advice": "Maintain current healthy lifestyle."
        },
        "overweight": {
            "range": (25, 30),
            "risk": "moderate",
            "advice": "Focus on balanced diet and regular physical activity."
        },
        "obese_class_1": {
            "range": (30, 35),
            "risk": "high",
            "advice": "Consider structured weight management with healthcare guidance."
        },
        "obese_class_2": {
            "range": (35, 40),
            "risk": "very_high",
            "advice": "Medical supervision recommended for weight management."
        },
        "obese_class_3": {
            "range": (40, 100),
            "risk": "extremely_high",
            "advice": "Seek medical consultation for comprehensive weight management."
        }
    },

    "blood_pressure": {
        "normal": {
            "systolic": (90, 120),
            "diastolic": (60, 80),
            "risk": "low"
        },
        "elevated": {
            "systolic": (120, 130),
            "diastolic": (60, 80),
            "risk": "moderate"
        },
        "high_stage_1": {
            "systolic": (130, 140),
            "diastolic": (80, 90),
            "risk": "high"
        },
        "high_stage_2": {
            "systolic": (140, 180),
            "diastolic": (90, 120),
            "risk": "very_high"
        },
        "crisis": {
            "systolic": (180, 300),
            "diastolic": (120, 200),
            "risk": "emergency"
        }
    },

    "blood_sugar": {
        "normal_fasting": {
            "range": (70, 100),
            "unit": "mg/dL",
            "risk": "low"
        },
        "prediabetic": {
            "range": (100, 126),
            "unit": "mg/dL",
            "risk": "moderate"
        },
        "diabetic": {
            "range": (126, 500),
            "unit": "mg/dL",
            "risk": "high"
        }
    },

    "sleep": {
        "insufficient": {
            "hours": (0, 6),
            "risk": "high",
            "advice": "Aim for 7-9 hours. Poor sleep affects metabolism, immunity, and mental health."
        },
        "optimal": {
            "hours": (7, 9),
            "risk": "low",
            "advice": "Great! Maintain consistent sleep schedule."
        },
        "excessive": {
            "hours": (10, 24),
            "risk": "moderate",
            "advice": "Sleeping too much may indicate underlying issues. Consider consulting a doctor."
        }
    },

    "water_intake": {
        "low": {
            "liters": (0, 1.5),
            "risk": "moderate",
            "advice": "Increase water intake. Aim for at least 2L daily."
        },
        "optimal": {
            "liters": (2, 3),
            "risk": "low",
            "advice": "Good hydration level!"
        },
        "high": {
            "liters": (4, 10),
            "risk": "low",
            "advice": "High intake is generally fine unless you have kidney issues."
        }
    }
}

# Age-based activity recommendations
AGE_ACTIVITY_RULES = {
    "18-30": {
        "max_intensity": "high",
        "recovery_days": 1,
        "cardio_mins_week": 150,
        "strength_sessions_week": 3
    },
    "31-45": {
        "max_intensity": "high",
        "recovery_days": 2,
        "cardio_mins_week": 150,
        "strength_sessions_week": 2
    },
    "46-60": {
        "max_intensity": "moderate_high",
        "recovery_days": 2,
        "cardio_mins_week": 150,
        "strength_sessions_week": 2
    },
    "60+": {
        "max_intensity": "moderate",
        "recovery_days": 3,
        "cardio_mins_week": 150,
        "strength_sessions_week": 2
    }
}


def get_age_category(age: int) -> str:
    """Get age category for rule lookup"""
    if age < 31:
        return "18-30"
    elif age < 46:
        return "31-45"
    elif age < 60:
        return "46-60"
    else:
        return "60+"


def evaluate_bmi_risk(bmi: float) -> list:
    """Evaluate BMI-related risks"""
    risks = []

    if bmi < 18.5:
        risks.append("Underweight - may need to increase caloric intake")
    elif bmi >= 25 and bmi < 30:
        risks.append("Overweight - increased risk of metabolic issues")
    elif bmi >= 30:
        risks.append("Obesity - elevated risk of chronic diseases")

    return risks


def evaluate_lifestyle_risks(profile) -> list:
    """Evaluate lifestyle-related risks"""
    risks = []
    p = profile.profile

    # Activity level risks
    if p.activityLevel == "sedentary":
        risks.append("Sedentary lifestyle increases cardiovascular risk")

    # Check questionnaire for additional risks
    questionnaire = profile.questionnaire

    # Smoking risk
    if questionnaire.get("smoking") or any("smoking" in str(v).lower() for v in questionnaire.values()):
        risks.append("Smoking significantly increases health risks")

    # Stress risk
    stress_indicators = ["high", "very_high", "often", "severe"]
    for key, value in questionnaire.items():
        if "stress" in key.lower() and str(value).lower() in stress_indicators:
            risks.append("High stress levels can impact overall health")
            break

    return risks
