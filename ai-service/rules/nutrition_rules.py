"""
Nutrition Rules Engine - Dietary Guidelines
Based on research and medical standards
"""

# Macro distribution by goal
MACRO_RULES = {
    "weight_loss": {
        "protein_per_kg": (1.6, 2.2),
        "carbs": "moderate",
        "fats_per_kg": (0.8, 1.0),
        "calorie_deficit": (-500, -300),
        "fiber_min": 25,
        "meal_frequency": "4-5 meals",
        "focus": ["high_protein", "high_fiber", "low_calorie_dense"]
    },
    "muscle_gain": {
        "protein_per_kg": (1.8, 2.4),
        "carbs": "high",
        "fats_per_kg": (0.8, 1.0),
        "calorie_surplus": (200, 400),
        "fiber_min": 25,
        "meal_frequency": "5-6 meals",
        "focus": ["protein_timing", "post_workout_nutrition", "calorie_surplus"]
    },
    "maintenance": {
        "protein_per_kg": (1.2, 1.6),
        "carbs": "moderate",
        "fats_per_kg": (0.8, 1.0),
        "calorie_adjustment": 0,
        "fiber_min": 25,
        "meal_frequency": "3-5 meals",
        "focus": ["balanced_nutrition", "whole_foods"]
    },
    "diabetes": {
        "protein_per_kg": (1.4, 1.8),
        "carbs": "low_gi_only",
        "fats_per_kg": (1.0, 1.2),
        "fiber_min": 30,
        "meal_frequency": "5-6 small meals",
        "focus": ["blood_sugar_stable", "complex_carbs", "fiber"],
        "avoid": ["refined_sugar", "white_rice", "white_bread", "sugary_drinks"]
    },
    "pcod": {
        "protein_per_kg": (1.4, 1.8),
        "carbs": "low_gi",
        "fats_per_kg": (1.0, 1.2),
        "fiber_min": 28,
        "meal_frequency": "5-6 meals",
        "focus": ["anti_inflammatory", "insulin_sensitivity"],
        "avoid": ["dairy_excess", "processed_foods", "refined_carbs"]
    },
    "heart_health": {
        "protein_per_kg": (1.0, 1.4),
        "carbs": "moderate_complex",
        "fats_per_kg": (0.7, 0.9),
        "fiber_min": 30,
        "focus": ["omega_3", "low_sodium", "whole_grains"],
        "avoid": ["saturated_fats", "trans_fats", "excess_sodium"]
    }
}

# Diet type food mappings
DIET_FOODS = {
    "vegetarian": {
        "protein_sources": [
            "paneer", "tofu", "legumes", "dal", "nuts", "seeds",
            "greek_yogurt", "cottage_cheese", "quinoa", "tempeh"
        ],
        "avoid": ["meat", "fish", "poultry", "seafood"]
    },
    "eggetarian": {
        "protein_sources": [
            "eggs", "paneer", "tofu", "legumes", "dal",
            "nuts", "seeds", "greek_yogurt", "cottage_cheese"
        ],
        "avoid": ["meat", "fish", "poultry", "seafood"]
    },
    "non_vegetarian": {
        "protein_sources": [
            "chicken_breast", "fish", "eggs", "paneer", "legumes",
            "lean_beef", "turkey", "shrimp", "greek_yogurt"
        ],
        "avoid": []
    },
    "vegan": {
        "protein_sources": [
            "tofu", "tempeh", "legumes", "nuts", "seeds",
            "quinoa", "seitan", "edamame", "chickpeas"
        ],
        "avoid": ["all_animal_products", "dairy", "eggs", "honey"]
    }
}

# Condition-specific nutrition rules
CONDITION_NUTRITION = {
    "diabetes": {
        "carb_timing": "spread_throughout_day",
        "glycemic_index": "low_only",
        "fiber_importance": "critical",
        "foods_to_include": [
            "leafy_greens", "berries", "nuts", "beans",
            "whole_grains", "fish", "lean_protein"
        ],
        "foods_to_avoid": [
            "white_bread", "white_rice", "sugary_drinks",
            "fruit_juice", "candy", "pastries"
        ]
    },
    "hypertension": {
        "sodium_limit": 1500,  # mg/day
        "potassium_rich": True,
        "dash_diet": True,
        "foods_to_include": [
            "bananas", "spinach", "sweet_potato", "fish",
            "nuts", "beans", "low_fat_dairy"
        ],
        "foods_to_avoid": [
            "processed_foods", "canned_soups", "pickles",
            "bacon", "deli_meats", "excess_salt"
        ]
    },
    "pcod": {
        "insulin_friendly": True,
        "anti_inflammatory": True,
        "foods_to_include": [
            "fatty_fish", "leafy_greens", "berries", "nuts",
            "olive_oil", "turmeric", "ginger"
        ],
        "foods_to_avoid": [
            "refined_carbs", "sugary_foods", "excess_dairy",
            "processed_foods", "inflammatory_oils"
        ]
    },
    "thyroid_hypo": {
        "iodine_adequate": True,
        "selenium_rich": True,
        "foods_to_include": [
            "fish", "eggs", "dairy", "brazil_nuts",
            "spinach", "chicken"
        ],
        "foods_to_limit": [
            "raw_cruciferous_vegetables", "soy_products",
            "gluten_if_sensitive"
        ]
    }
}


def get_nutrition_rules_for_conditions(conditions: list) -> dict:
    """Get combined nutrition rules for user's conditions"""
    combined = {
        "foods_to_include": set(),
        "foods_to_avoid": set(),
        "special_considerations": []
    }

    for condition in conditions:
        condition_lower = condition.lower().replace(" ", "_")
        rules = CONDITION_NUTRITION.get(condition_lower, {})

        combined["foods_to_include"].update(rules.get("foods_to_include", []))
        combined["foods_to_avoid"].update(rules.get("foods_to_avoid", []))

        if rules.get("sodium_limit"):
            combined["special_considerations"].append(f"Limit sodium to {rules['sodium_limit']}mg/day")
        if rules.get("glycemic_index") == "low_only":
            combined["special_considerations"].append("Focus on low glycemic index foods")
        if rules.get("anti_inflammatory"):
            combined["special_considerations"].append("Include anti-inflammatory foods")

    # Convert sets to lists for JSON serialization
    combined["foods_to_include"] = list(combined["foods_to_include"])
    combined["foods_to_avoid"] = list(combined["foods_to_avoid"])

    return combined
