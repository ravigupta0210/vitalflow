"""
Food Database - Nutritional Research Data
Comprehensive food database with Indian and international foods
"""

FOOD_DATABASE = {
    # PROTEINS - Vegetarian
    "paneer": {
        "name": "Paneer (Cottage Cheese)",
        "category": "protein",
        "diet_types": ["vegetarian", "eggetarian"],
        "per_100g": {
            "calories": 265,
            "protein": 18.3,
            "carbs": 1.2,
            "fats": 20.8,
            "fiber": 0
        },
        "glycemic_index": 0,
        "benefits": ["high_protein", "calcium_rich", "complete_protein"],
        "good_for": ["muscle_gain", "vegetarian_protein"]
    },
    "dal_tadka": {
        "name": "Dal Tadka (Yellow Lentils)",
        "category": "protein",
        "diet_types": ["vegetarian", "vegan"],
        "per_100g": {
            "calories": 116,
            "protein": 7.6,
            "carbs": 15.7,
            "fats": 2.7,
            "fiber": 4.2
        },
        "glycemic_index": 28,
        "benefits": ["high_protein", "high_fiber", "blood_sugar_stable"],
        "good_for": ["weight_loss", "diabetes", "muscle_gain"]
    },
    "tofu": {
        "name": "Tofu",
        "category": "protein",
        "diet_types": ["vegetarian", "vegan"],
        "per_100g": {
            "calories": 76,
            "protein": 8,
            "carbs": 1.9,
            "fats": 4.8,
            "fiber": 0.3
        },
        "glycemic_index": 15,
        "benefits": ["plant_protein", "low_calorie", "versatile"],
        "good_for": ["weight_loss", "vegan_protein"]
    },
    "greek_yogurt": {
        "name": "Greek Yogurt",
        "category": "protein",
        "diet_types": ["vegetarian", "eggetarian"],
        "per_100g": {
            "calories": 97,
            "protein": 9,
            "carbs": 3.6,
            "fats": 5,
            "fiber": 0
        },
        "glycemic_index": 11,
        "benefits": ["probiotics", "high_protein", "calcium"],
        "good_for": ["muscle_gain", "gut_health"]
    },
    "chickpeas": {
        "name": "Chickpeas (Chole)",
        "category": "protein",
        "diet_types": ["vegetarian", "vegan"],
        "per_100g": {
            "calories": 164,
            "protein": 8.9,
            "carbs": 27.4,
            "fats": 2.6,
            "fiber": 7.6
        },
        "glycemic_index": 28,
        "benefits": ["high_fiber", "plant_protein", "complex_carbs"],
        "good_for": ["weight_loss", "diabetes", "heart_health"]
    },

    # PROTEINS - Non-Vegetarian
    "chicken_breast": {
        "name": "Grilled Chicken Breast",
        "category": "protein",
        "diet_types": ["non_vegetarian", "eggetarian"],
        "per_100g": {
            "calories": 165,
            "protein": 31,
            "carbs": 0,
            "fats": 3.6,
            "fiber": 0
        },
        "glycemic_index": 0,
        "benefits": ["lean_protein", "muscle_building", "low_fat"],
        "good_for": ["muscle_gain", "weight_loss"]
    },
    "eggs": {
        "name": "Whole Eggs",
        "category": "protein",
        "diet_types": ["non_vegetarian", "eggetarian"],
        "per_100g": {
            "calories": 155,
            "protein": 13,
            "carbs": 1.1,
            "fats": 11,
            "fiber": 0
        },
        "glycemic_index": 0,
        "benefits": ["complete_protein", "choline", "vitamin_d"],
        "good_for": ["muscle_gain", "brain_health"]
    },
    "salmon": {
        "name": "Salmon",
        "category": "protein",
        "diet_types": ["non_vegetarian"],
        "per_100g": {
            "calories": 208,
            "protein": 20,
            "carbs": 0,
            "fats": 13,
            "fiber": 0
        },
        "glycemic_index": 0,
        "benefits": ["omega_3", "heart_healthy", "anti_inflammatory"],
        "good_for": ["heart_health", "brain_health", "muscle_gain"]
    },

    # CARBOHYDRATES
    "brown_rice": {
        "name": "Brown Rice",
        "category": "carbohydrate",
        "diet_types": ["vegetarian", "vegan", "non_vegetarian", "eggetarian"],
        "per_100g": {
            "calories": 111,
            "protein": 2.6,
            "carbs": 23,
            "fats": 0.9,
            "fiber": 1.8
        },
        "glycemic_index": 50,
        "benefits": ["complex_carbs", "fiber", "sustained_energy"],
        "good_for": ["general_health", "diabetes"]
    },
    "oats": {
        "name": "Oats",
        "category": "carbohydrate",
        "diet_types": ["vegetarian", "vegan", "non_vegetarian", "eggetarian"],
        "per_100g": {
            "calories": 389,
            "protein": 16.9,
            "carbs": 66.3,
            "fats": 6.9,
            "fiber": 10.6
        },
        "glycemic_index": 55,
        "benefits": ["high_fiber", "beta_glucan", "heart_healthy"],
        "good_for": ["weight_loss", "heart_health", "diabetes"]
    },
    "quinoa": {
        "name": "Quinoa",
        "category": "carbohydrate",
        "diet_types": ["vegetarian", "vegan", "non_vegetarian", "eggetarian"],
        "per_100g": {
            "calories": 120,
            "protein": 4.4,
            "carbs": 21.3,
            "fats": 1.9,
            "fiber": 2.8
        },
        "glycemic_index": 53,
        "benefits": ["complete_protein", "gluten_free", "high_fiber"],
        "good_for": ["muscle_gain", "general_health"]
    },
    "sweet_potato": {
        "name": "Sweet Potato",
        "category": "carbohydrate",
        "diet_types": ["vegetarian", "vegan", "non_vegetarian", "eggetarian"],
        "per_100g": {
            "calories": 86,
            "protein": 1.6,
            "carbs": 20,
            "fats": 0.1,
            "fiber": 3
        },
        "glycemic_index": 63,
        "benefits": ["vitamin_a", "fiber", "complex_carbs"],
        "good_for": ["muscle_gain", "general_health"]
    },

    # VEGETABLES
    "spinach": {
        "name": "Spinach",
        "category": "vegetable",
        "diet_types": ["vegetarian", "vegan", "non_vegetarian", "eggetarian"],
        "per_100g": {
            "calories": 23,
            "protein": 2.9,
            "carbs": 3.6,
            "fats": 0.4,
            "fiber": 2.2
        },
        "glycemic_index": 15,
        "benefits": ["iron", "vitamin_k", "antioxidants"],
        "good_for": ["weight_loss", "general_health"]
    },
    "broccoli": {
        "name": "Broccoli",
        "category": "vegetable",
        "diet_types": ["vegetarian", "vegan", "non_vegetarian", "eggetarian"],
        "per_100g": {
            "calories": 34,
            "protein": 2.8,
            "carbs": 7,
            "fats": 0.4,
            "fiber": 2.6
        },
        "glycemic_index": 10,
        "benefits": ["fiber", "vitamin_c", "cancer_protective"],
        "good_for": ["weight_loss", "general_health"]
    },

    # FRUITS
    "banana": {
        "name": "Banana",
        "category": "fruit",
        "diet_types": ["vegetarian", "vegan", "non_vegetarian", "eggetarian"],
        "per_100g": {
            "calories": 89,
            "protein": 1.1,
            "carbs": 23,
            "fats": 0.3,
            "fiber": 2.6
        },
        "glycemic_index": 51,
        "benefits": ["potassium", "quick_energy", "pre_workout"],
        "good_for": ["pre_workout", "muscle_cramps"]
    },
    "apple": {
        "name": "Apple",
        "category": "fruit",
        "diet_types": ["vegetarian", "vegan", "non_vegetarian", "eggetarian"],
        "per_100g": {
            "calories": 52,
            "protein": 0.3,
            "carbs": 14,
            "fats": 0.2,
            "fiber": 2.4
        },
        "glycemic_index": 36,
        "benefits": ["fiber", "antioxidants", "low_calorie"],
        "good_for": ["weight_loss", "general_health"]
    },
    "berries": {
        "name": "Mixed Berries",
        "category": "fruit",
        "diet_types": ["vegetarian", "vegan", "non_vegetarian", "eggetarian"],
        "per_100g": {
            "calories": 57,
            "protein": 0.7,
            "carbs": 14,
            "fats": 0.3,
            "fiber": 2
        },
        "glycemic_index": 25,
        "benefits": ["antioxidants", "low_sugar", "anti_inflammatory"],
        "good_for": ["weight_loss", "diabetes", "anti_aging"]
    },

    # HEALTHY FATS
    "almonds": {
        "name": "Almonds",
        "category": "fat",
        "diet_types": ["vegetarian", "vegan", "non_vegetarian", "eggetarian"],
        "per_100g": {
            "calories": 579,
            "protein": 21,
            "carbs": 22,
            "fats": 50,
            "fiber": 12.5
        },
        "glycemic_index": 0,
        "benefits": ["healthy_fats", "protein", "vitamin_e"],
        "good_for": ["heart_health", "snacking"]
    },
    "avocado": {
        "name": "Avocado",
        "category": "fat",
        "diet_types": ["vegetarian", "vegan", "non_vegetarian", "eggetarian"],
        "per_100g": {
            "calories": 160,
            "protein": 2,
            "carbs": 9,
            "fats": 15,
            "fiber": 7
        },
        "glycemic_index": 15,
        "benefits": ["healthy_fats", "potassium", "fiber"],
        "good_for": ["heart_health", "weight_loss"]
    }
}

# Meal templates by cuisine and meal type
MEAL_TEMPLATES = {
    "indian_vegetarian_breakfast": [
        {"name": "Poha", "calories": 250, "protein": 6, "description": "Flattened rice with vegetables"},
        {"name": "Upma", "calories": 200, "protein": 5, "description": "Semolina with vegetables"},
        {"name": "Idli Sambar", "calories": 180, "protein": 7, "description": "Steamed rice cakes with lentil soup"},
        {"name": "Besan Chilla", "calories": 220, "protein": 10, "description": "Gram flour pancake"},
        {"name": "Moong Dal Cheela", "calories": 200, "protein": 12, "description": "Lentil pancake"}
    ],
    "indian_vegetarian_lunch": [
        {"name": "Dal Rice", "calories": 400, "protein": 15, "description": "Lentils with rice"},
        {"name": "Rajma Rice", "calories": 450, "protein": 18, "description": "Kidney beans with rice"},
        {"name": "Chole Rice", "calories": 420, "protein": 16, "description": "Chickpea curry with rice"},
        {"name": "Paneer Tikka with Roti", "calories": 480, "protein": 25, "description": "Grilled cottage cheese with whole wheat bread"}
    ],
    "indian_non_veg_dinner": [
        {"name": "Grilled Chicken with Vegetables", "calories": 350, "protein": 35, "description": "Lean protein with fiber"},
        {"name": "Fish Curry with Rice", "calories": 400, "protein": 28, "description": "Omega-3 rich meal"},
        {"name": "Egg Curry with Roti", "calories": 380, "protein": 22, "description": "Budget-friendly protein"}
    ],
    "healthy_snacks": [
        {"name": "Greek Yogurt with Berries", "calories": 150, "protein": 15},
        {"name": "Handful of Almonds", "calories": 160, "protein": 6},
        {"name": "Apple with Peanut Butter", "calories": 180, "protein": 5},
        {"name": "Boiled Eggs (2)", "calories": 140, "protein": 12},
        {"name": "Protein Shake", "calories": 200, "protein": 25}
    ]
}
