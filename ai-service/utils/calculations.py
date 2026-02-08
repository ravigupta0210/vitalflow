"""
Health Calculations - Research-backed formulas
"""

# Activity level multipliers for TDEE calculation
ACTIVITY_MULTIPLIERS = {
    "sedentary": 1.2,
    "light": 1.375,
    "moderate": 1.55,
    "active": 1.725,
    "very_active": 1.9
}


def calculate_bmi(weight_kg: float, height_cm: float) -> float:
    """
    Calculate BMI (Body Mass Index)
    Formula: weight (kg) / height (m)^2
    Source: WHO Guidelines
    """
    height_m = height_cm / 100
    bmi = weight_kg / (height_m * height_m)
    return round(bmi, 1)


def calculate_bmr(weight_kg: float, height_cm: float, age: int, gender: str) -> int:
    """
    Calculate BMR using Mifflin-St Jeor Equation
    More accurate than Harris-Benedict for modern populations
    Source: Mifflin MD, et al. Am J Clin Nutr. 1990

    Men: BMR = (10 × weight) + (6.25 × height) - (5 × age) + 5
    Women: BMR = (10 × weight) + (6.25 × height) - (5 × age) - 161
    """
    base_bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age)

    if gender.lower() == "male":
        bmr = base_bmr + 5
    else:
        bmr = base_bmr - 161

    return round(bmr)


def calculate_tdee(bmr: int, activity_level: str) -> int:
    """
    Calculate TDEE (Total Daily Energy Expenditure)
    TDEE = BMR × Activity Multiplier
    """
    multiplier = ACTIVITY_MULTIPLIERS.get(activity_level.lower(), 1.55)
    return round(bmr * multiplier)


def calculate_target_calories(tdee: int, goals: list) -> int:
    """
    Calculate target calories based on goals
    - Weight loss: -500 kcal/day (safe 0.5 kg/week loss)
    - Muscle gain: +300 kcal/day
    - Maintenance: TDEE
    """
    adjustment = 0

    if "weight_loss" in goals:
        adjustment = -500
    elif "muscle_gain" in goals:
        adjustment = 300

    # Ensure minimum calories for safety
    target = max(tdee + adjustment, 1200)
    return round(target)


def calculate_ideal_weight(height_cm: float) -> dict:
    """
    Calculate ideal weight range based on healthy BMI (18.5-24.9)
    """
    height_m = height_cm / 100
    min_weight = round(18.5 * height_m * height_m, 1)
    max_weight = round(24.9 * height_m * height_m, 1)

    return {"min": min_weight, "max": max_weight}


def calculate_water_intake(weight_kg: float, activity_level: str) -> float:
    """
    Calculate recommended daily water intake
    Formula: ~30-35ml per kg of body weight
    Source: National Academies of Sciences
    """
    base_intake = weight_kg * 30  # ml

    # Increase for active individuals
    if activity_level.lower() in ["active", "very_active"]:
        base_intake = weight_kg * 35

    # Convert to liters and round
    return round(base_intake / 1000, 1)


def calculate_macros(target_calories: int, weight_kg: float, goals: list) -> dict:
    """
    Calculate macro distribution based on goals
    Returns grams of protein, carbs, and fats
    """
    protein_per_kg = 1.6  # Default moderate protein
    fat_percentage = 0.25  # 25% of calories from fat

    # Adjust based on goals
    if "muscle_gain" in goals:
        protein_per_kg = 2.0
        fat_percentage = 0.25
    elif "weight_loss" in goals:
        protein_per_kg = 2.2  # Higher for satiety and muscle preservation
        fat_percentage = 0.30
    elif "diabetes" in goals:
        protein_per_kg = 1.8
        fat_percentage = 0.35  # Lower carb, higher fat

    protein_grams = round(weight_kg * protein_per_kg)
    protein_calories = protein_grams * 4

    fat_calories = round(target_calories * fat_percentage)
    fat_grams = round(fat_calories / 9)

    carb_calories = target_calories - protein_calories - fat_calories
    carb_grams = max(round(carb_calories / 4), 50)  # Minimum 50g carbs

    fiber = round(target_calories / 100)  # ~25-30g fiber per 2500 cal

    return {
        "protein": protein_grams,
        "carbs": carb_grams,
        "fats": fat_grams,
        "fiber": fiber
    }
