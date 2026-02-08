"""
Diet Generator Service - AI-Powered Dynamic Recipe Generation
"""

from models.health_profile import (
    DietRequest, DietPlanResponse, MealDay, Meal
)
from services.gemini_client import GeminiClient
from rules.nutrition_rules import (
    MACRO_RULES, DIET_FOODS, get_nutrition_rules_for_conditions
)
from research.nutrition_data import FOOD_DATABASE, MEAL_TEMPLATES
from utils.calculations import calculate_macros
import json
import random
from datetime import datetime


class DietGenerator:
    """Generates personalized diet plans using rules + AI"""

    def __init__(self, gemini_client: GeminiClient):
        self.gemini = gemini_client

    async def generate(self, request: DietRequest) -> DietPlanResponse:
        """Generate a complete diet plan"""

        # Step 1: Calculate macro targets
        target_calories = request.profile.targetCalories or 2000
        macros = calculate_macros(target_calories, request.profile.weight, request.goals)

        # Step 2: Get nutrition rules for conditions
        nutrition_rules = get_nutrition_rules_for_conditions(request.conditions)

        # Step 3: Get allowed foods based on diet type
        allowed_foods = self._get_allowed_foods(
            request.profile.dietType,
            request.preferences.restrictions
        )

        # Step 4: Generate plan with AI
        plan = await self._generate_ai_plan(
            request, target_calories, macros, nutrition_rules, allowed_foods
        )

        return plan

    def _get_allowed_foods(self, diet_type: str, restrictions: list) -> list:
        """Get list of allowed foods based on diet type and restrictions"""
        diet_type = diet_type or "non_vegetarian"
        diet_rules = DIET_FOODS.get(diet_type.lower(), DIET_FOODS["non_vegetarian"])

        allowed = []
        avoid = set(diet_rules.get("avoid", []))
        avoid.update(restrictions)

        for food_id, food_data in FOOD_DATABASE.items():
            food_diets = food_data.get("diet_types", [])

            # Check if food is compatible with diet type
            if diet_type.lower() in [d.lower() for d in food_diets]:
                # Check if not in restrictions
                if not any(r.lower() in food_id.lower() for r in avoid):
                    allowed.append({
                        "id": food_id,
                        "name": food_data.get("name"),
                        "calories": food_data.get("per_100g", {}).get("calories", 0),
                        "protein": food_data.get("per_100g", {}).get("protein", 0),
                        "category": food_data.get("category")
                    })

        return allowed

    async def _generate_ai_plan(
        self,
        request: DietRequest,
        target_calories: int,
        macros: dict,
        nutrition_rules: dict,
        allowed_foods: list
    ) -> DietPlanResponse:
        """Generate diet plan using AI with detailed recipes - fully dynamic"""

        diet_type = request.profile.dietType or 'non-vegetarian'
        meals_per_day = request.preferences.mealsPerDay or 5
        cuisine = request.preferences.cuisine or 'indian'

        # Add variety seeds for unique plans each time
        variety_seed = random.randint(1, 1000)
        today = datetime.now().strftime("%Y-%m-%d")

        # Cuisine-specific dish suggestions for variety
        cuisine_dishes = {
            "indian": ["poha", "upma", "idli", "dosa", "paratha", "dal", "sabzi", "biryani", "pulao", "khichdi", "roti", "curry", "raita", "chutney"],
            "continental": ["pasta", "salad", "soup", "sandwich", "wrap", "steak", "grilled chicken", "roasted vegetables", "quinoa bowl", "risotto"],
            "chinese": ["fried rice", "noodles", "stir fry", "manchurian", "spring rolls", "dim sum", "soup"],
            "mediterranean": ["hummus", "falafel", "pita", "tabbouleh", "greek salad", "grilled fish", "olive oil dishes"],
            "mixed": ["oatmeal", "smoothie bowl", "grilled protein", "rice bowl", "salad", "soup", "stir fry"]
        }

        dish_suggestions = cuisine_dishes.get(cuisine.lower(), cuisine_dishes["mixed"])
        random.shuffle(dish_suggestions)
        variety_hint = ", ".join(dish_suggestions[:6])

        prompt = f"""You are a professional nutritionist creating a UNIQUE personalized meal plan. Generate variety #{variety_seed} for {today}.

USER PROFILE:
- Age: {request.profile.age} years
- Gender: {request.profile.gender}
- Weight: {request.profile.weight} kg
- Diet Type: {diet_type}
- Cuisine Preference: {cuisine}

GOALS: {', '.join(request.goals) if request.goals else 'general wellness'}
HEALTH CONDITIONS: {', '.join(request.conditions) if request.conditions else 'none'}

DAILY NUTRITIONAL TARGETS:
- Calories: {target_calories} kcal
- Protein: {macros['protein']}g
- Carbs: {macros['carbs']}g
- Fats: {macros['fats']}g

REQUIREMENTS:
1. Create 7 UNIQUE days - NO repetition of meals across days
2. Each day must have exactly {meals_per_day} meals (breakfast, mid_morning_snack, lunch, evening_snack, dinner)
3. Every recipe MUST have 6-10 DETAILED cooking steps
4. Include specific ingredient quantities (cups, tbsp, grams)
5. Make recipes practical and easy to follow
6. Consider {cuisine} cuisine dishes like: {variety_hint}
7. Vary cooking methods: grilling, baking, steaming, sauteing, raw

Return ONLY valid JSON in this exact format:
{{
  "title": "Personalized {diet_type.title()} Meal Plan",
  "description": "Customized 7-day nutrition plan with {target_calories} calories daily",
  "daily_calories": {target_calories},
  "protein_grams": {macros['protein']},
  "carbs_grams": {macros['carbs']},
  "fats_grams": {macros['fats']},
  "fiber_grams": 30,
  "days": [
    {{
      "day_number": 1,
      "day_name": "Monday",
      "total_calories": {target_calories},
      "meals": [
        {{
          "meal_type": "breakfast",
          "name": "Recipe Name Here",
          "description": "Brief description of the dish",
          "calories": 450,
          "protein_grams": 20,
          "carbs_grams": 50,
          "fats_grams": 15,
          "fiber_grams": 5,
          "ingredients": [
            "1 cup ingredient with exact quantity",
            "2 tbsp another ingredient",
            "100g protein source"
          ],
          "recipe_instructions": "STEP 1: First action with details.\\nSTEP 2: Second action.\\nSTEP 3: Continue steps.\\nSTEP 4: More instructions.\\nSTEP 5: Almost done.\\nSTEP 6: Final step and serving.",
          "prep_time_mins": 10,
          "cook_time_mins": 15
        }}
      ]
    }}
  ],
  "grocery_list": ["item1", "item2", "item3"],
  "meal_prep_tips": ["Tip 1", "Tip 2"]
}}

CRITICAL RULES:
- Generate ALL 7 days with ALL {meals_per_day} meals each
- Each recipe_instructions MUST have numbered STEP 1, STEP 2, etc.
- Use \\n for newlines in recipe_instructions
- Make each day's meals DIFFERENT from other days
- Ensure macros roughly match targets for each meal"""

        try:
            response = await self.gemini.generate(prompt, expect_json=True)
            plan_data = json.loads(response)

            # Validate and convert to response model
            days = []
            for day_data in plan_data.get("days", []):
                meals = []
                for meal_data in day_data.get("meals", []):
                    meals.append(Meal(
                        meal_type=meal_data.get("meal_type", "meal"),
                        name=meal_data.get("name", "Meal"),
                        description=meal_data.get("description", ""),
                        calories=meal_data.get("calories", 0),
                        protein_grams=meal_data.get("protein_grams", 0),
                        carbs_grams=meal_data.get("carbs_grams", 0),
                        fats_grams=meal_data.get("fats_grams", 0),
                        fiber_grams=meal_data.get("fiber_grams"),
                        ingredients=meal_data.get("ingredients", []),
                        recipe_instructions=meal_data.get("recipe_instructions"),
                        prep_time_mins=meal_data.get("prep_time_mins"),
                        cook_time_mins=meal_data.get("cook_time_mins"),
                        image_url=meal_data.get("image_url")
                    ))

                days.append(MealDay(
                    day_number=day_data.get("day_number", 1),
                    day_name=day_data.get("day_name", "Day"),
                    total_calories=day_data.get("total_calories", target_calories),
                    meals=meals
                ))

            # If AI returned empty days, use fallback
            if not days:
                print("AI returned empty days, using fallback")
                return self._generate_fallback_plan(request, target_calories, macros)

            return DietPlanResponse(
                title=plan_data.get("title", "Custom Diet Plan"),
                description=plan_data.get("description", "AI-generated meal plan"),
                daily_calories=plan_data.get("daily_calories", target_calories),
                protein_grams=plan_data.get("protein_grams", macros['protein']),
                carbs_grams=plan_data.get("carbs_grams", macros['carbs']),
                fats_grams=plan_data.get("fats_grams", macros['fats']),
                fiber_grams=plan_data.get("fiber_grams", 25),
                days=days,
                grocery_list=plan_data.get("grocery_list", []),
                meal_prep_tips=plan_data.get("meal_prep_tips", [])
            )

        except Exception as e:
            print(f"Error generating AI diet plan: {e}")
            return self._generate_fallback_plan(request, target_calories, macros)

    def _generate_fallback_plan(self, request: DietRequest, target_calories: int, macros: dict) -> DietPlanResponse:
        """Generate comprehensive fallback plan with detailed recipes"""

        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        diet_type = (request.profile.dietType or "non_vegetarian").lower()

        # Determine diet category
        # vegetarian/vegan = no meat, no fish, no eggs
        # eggetarian = no meat, no fish, but eggs allowed
        # non_vegetarian = everything allowed
        is_veg = diet_type in ["vegetarian", "vegan"]
        is_eggetarian = diet_type == "eggetarian"

        days = []
        for i in range(7):
            meals = self._get_detailed_meals(target_calories, diet_type, i)
            days.append(MealDay(
                day_number=i + 1,
                day_name=day_names[i],
                total_calories=target_calories,
                meals=meals
            ))

        # Set title based on diet type
        diet_titles = {
            "vegetarian": "Vegetarian",
            "vegan": "Vegan",
            "eggetarian": "Eggetarian",
            "non_vegetarian": "Balanced"
        }
        plan_title = diet_titles.get(diet_type, "Balanced")

        # Grocery list based on diet type
        grocery_list = [
            "Brown rice (1kg)",
            "Whole wheat bread",
            "Mixed vegetables",
            "Spinach",
            "Tomatoes",
            "Onions",
            "Garlic",
            "Olive oil",
            "Greek yogurt",
            "Mixed nuts",
            "Bananas",
            "Apples",
            "Oats",
            "Dal/Lentils",
            "Spices (cumin, turmeric, coriander)"
        ]

        if diet_type == "non_vegetarian":
            grocery_list.insert(0, "Chicken breast (1kg)")
            grocery_list.insert(1, "Fish fillet (500g)")
            grocery_list.insert(2, "Eggs (2 dozen)")
        elif diet_type == "eggetarian":
            grocery_list.insert(0, "Eggs (2 dozen)")
            grocery_list.insert(1, "Paneer (500g)")
            grocery_list.insert(2, "Tofu (300g)")
        else:  # vegetarian/vegan
            grocery_list.insert(0, "Paneer (500g)")
            grocery_list.insert(1, "Tofu (500g)")
            grocery_list.insert(2, "Soy chunks (300g)")

        return DietPlanResponse(
            title=f"{plan_title} Nutrition Plan",
            description=f"A comprehensive 7-day {plan_title.lower()} meal plan with {target_calories} calories daily.",
            daily_calories=target_calories,
            protein_grams=macros['protein'],
            carbs_grams=macros['carbs'],
            fats_grams=macros['fats'],
            fiber_grams=25,
            days=days,
            grocery_list=grocery_list,
            meal_prep_tips=[
                "Prep all vegetables on Sunday evening",
                "Cook a big batch of rice/quinoa for the week",
                "Pre-portion snacks in containers",
                "Keep boiled eggs ready for quick protein" if diet_type in ["eggetarian", "non_vegetarian"] else "Soak lentils overnight for faster cooking"
            ]
        )

    def _get_detailed_meals(self, target_calories: int, diet_type: str, day_index: int) -> list:
        """Get detailed meals based on diet type"""

        # Determine which meal set to use
        # vegetarian/vegan = no meat, no fish, no eggs
        # eggetarian = no meat, no fish, but eggs allowed
        # non_vegetarian = everything allowed

        if diet_type in ["vegetarian", "vegan"]:
            return self._get_veg_meals(target_calories, day_index)
        elif diet_type == "eggetarian":
            return self._get_eggetarian_meals(target_calories, day_index)
        else:
            return self._get_nonveg_meals(target_calories, day_index)

    def _get_veg_meals(self, target_calories: int, day_index: int) -> list:
        """Get vegetarian meals (no eggs, no meat, no fish)"""

        # Different meals for variety across the week
        veg_meals = [
            # Day 1
            [
                Meal(
                    meal_type="breakfast",
                    name="Masala Oats with Vegetables",
                    description="Savory oatmeal with Indian spices and fresh vegetables",
                    calories=round(target_calories * 0.25),
                    protein_grams=12,
                    carbs_grams=45,
                    fats_grams=8,
                    fiber_grams=8,
                    ingredients=[
                        "1 cup rolled oats",
                        "1/4 cup diced onions",
                        "1/4 cup diced tomatoes",
                        "2 tbsp green peas",
                        "1/4 cup carrots, diced",
                        "1 tsp cumin seeds",
                        "1/2 tsp turmeric",
                        "1 tsp oil",
                        "Salt to taste",
                        "Fresh coriander for garnish"
                    ],
                    recipe_instructions="STEP 1: Heat oil in a pan over medium heat.\nSTEP 2: Add cumin seeds and let them splutter for 30 seconds.\nSTEP 3: Add diced onions and saute for 2-3 minutes until golden.\nSTEP 4: Add carrots and peas, cook for 2 minutes.\nSTEP 5: Add tomatoes, turmeric, and salt. Mix well.\nSTEP 6: Pour in 2 cups of water and bring to a boil.\nSTEP 7: Add oats and stir continuously for 3-4 minutes.\nSTEP 8: Reduce heat and cook until oats reach desired consistency.\nSTEP 9: Garnish with fresh coriander and serve hot.",
                    prep_time_mins=5,
                    cook_time_mins=12
                ),
                Meal(
                    meal_type="mid_morning_snack",
                    name="Greek Yogurt Parfait",
                    description="Protein-rich yogurt layered with fruits and nuts",
                    calories=round(target_calories * 0.1),
                    protein_grams=15,
                    carbs_grams=20,
                    fats_grams=6,
                    fiber_grams=3,
                    ingredients=[
                        "1 cup Greek yogurt",
                        "1/2 banana, sliced",
                        "2 tbsp mixed nuts (almonds, walnuts)",
                        "1 tbsp honey",
                        "2 tbsp granola"
                    ],
                    recipe_instructions="STEP 1: Take a glass or bowl.\nSTEP 2: Add half of the Greek yogurt as the base layer.\nSTEP 3: Add a layer of sliced banana.\nSTEP 4: Sprinkle half the nuts and granola.\nSTEP 5: Add remaining yogurt on top.\nSTEP 6: Top with remaining banana, nuts, and granola.\nSTEP 7: Drizzle honey over the top.\nSTEP 8: Serve immediately or refrigerate for up to 2 hours.",
                    prep_time_mins=5,
                    cook_time_mins=0
                ),
                Meal(
                    meal_type="lunch",
                    name="Dal Tadka with Brown Rice & Salad",
                    description="Protein-rich lentils with aromatic tempering",
                    calories=round(target_calories * 0.3),
                    protein_grams=18,
                    carbs_grams=55,
                    fats_grams=10,
                    fiber_grams=12,
                    ingredients=[
                        "1/2 cup yellow dal (toor/moong)",
                        "1 cup brown rice",
                        "1 medium onion, sliced",
                        "2 tomatoes, chopped",
                        "4 garlic cloves, minced",
                        "1 tsp cumin seeds",
                        "1/2 tsp turmeric",
                        "1 tsp red chili powder",
                        "2 tbsp ghee or oil",
                        "Fresh coriander",
                        "Mixed salad greens"
                    ],
                    recipe_instructions="FOR DAL:\nSTEP 1: Wash dal thoroughly and soak for 15 minutes.\nSTEP 2: Pressure cook dal with turmeric and 2 cups water for 3 whistles.\nSTEP 3: Once cooked, mash lightly and set aside.\n\nFOR TADKA:\nSTEP 4: Heat ghee in a small pan.\nSTEP 5: Add cumin seeds, let them crackle.\nSTEP 6: Add sliced onions, saute until golden brown (5-7 mins).\nSTEP 7: Add minced garlic, cook for 1 minute.\nSTEP 8: Add tomatoes and cook until soft (3-4 mins).\nSTEP 9: Add red chili powder, mix well.\nSTEP 10: Pour this tadka over the cooked dal.\nSTEP 11: Simmer for 5 minutes. Garnish with coriander.\n\nFOR RICE:\nSTEP 12: Cook brown rice with 2 cups water for 20-25 minutes.\nSTEP 13: Serve dal over rice with fresh salad.",
                    prep_time_mins=20,
                    cook_time_mins=35
                ),
                Meal(
                    meal_type="evening_snack",
                    name="Roasted Chana & Cucumber Salad",
                    description="High-fiber crunchy snack",
                    calories=round(target_calories * 0.1),
                    protein_grams=8,
                    carbs_grams=15,
                    fats_grams=4,
                    fiber_grams=5,
                    ingredients=[
                        "1/2 cup roasted chana (chickpeas)",
                        "1 cucumber, diced",
                        "1/2 onion, finely chopped",
                        "1 small tomato, diced",
                        "Juice of 1/2 lemon",
                        "1/4 tsp chaat masala",
                        "Fresh mint leaves",
                        "Salt to taste"
                    ],
                    recipe_instructions="STEP 1: Dice cucumber, tomato, and onion into small pieces.\nSTEP 2: Combine all vegetables in a bowl.\nSTEP 3: Add roasted chana.\nSTEP 4: Squeeze fresh lemon juice over the mixture.\nSTEP 5: Add chaat masala and salt.\nSTEP 6: Toss everything together.\nSTEP 7: Garnish with fresh mint leaves.\nSTEP 8: Serve immediately for best crunch.",
                    prep_time_mins=10,
                    cook_time_mins=0
                ),
                Meal(
                    meal_type="dinner",
                    name="Palak Paneer with Whole Wheat Roti",
                    description="Creamy spinach curry with cottage cheese",
                    calories=round(target_calories * 0.25),
                    protein_grams=22,
                    carbs_grams=35,
                    fats_grams=14,
                    fiber_grams=6,
                    ingredients=[
                        "200g paneer, cubed",
                        "3 cups spinach leaves",
                        "1 onion, chopped",
                        "2 tomatoes, chopped",
                        "3 garlic cloves",
                        "1 inch ginger",
                        "2 green chilies",
                        "1/2 cup cream or cashew paste",
                        "1 tsp cumin seeds",
                        "1/2 tsp garam masala",
                        "2 whole wheat rotis",
                        "2 tbsp oil"
                    ],
                    recipe_instructions="FOR SPINACH PUREE:\nSTEP 1: Blanch spinach in boiling water for 2 minutes.\nSTEP 2: Immediately transfer to ice water to retain color.\nSTEP 3: Blend spinach with ginger, garlic, and green chilies into smooth puree.\n\nFOR CURRY:\nSTEP 4: Heat oil in a pan. Add cumin seeds.\nSTEP 5: Add onions, saute until golden (5 minutes).\nSTEP 6: Add tomatoes, cook until mushy (4-5 minutes).\nSTEP 7: Add spinach puree and mix well.\nSTEP 8: Cook on low heat for 8-10 minutes.\nSTEP 9: Add cream/cashew paste and garam masala.\nSTEP 10: Gently fold in paneer cubes.\nSTEP 11: Simmer for 5 minutes. Don't stir too much.\nSTEP 12: Serve hot with whole wheat rotis.",
                    prep_time_mins=15,
                    cook_time_mins=30
                ),
            ],
            # Day 2
            [
                Meal(
                    meal_type="breakfast",
                    name="Moong Dal Chilla with Mint Chutney",
                    description="Protein-packed savory pancakes",
                    calories=round(target_calories * 0.25),
                    protein_grams=18,
                    carbs_grams=40,
                    fats_grams=8,
                    fiber_grams=6,
                    ingredients=[
                        "1 cup moong dal, soaked overnight",
                        "1/4 cup chopped onions",
                        "2 tbsp chopped coriander",
                        "1 green chili, chopped",
                        "1/2 inch ginger",
                        "1/4 tsp turmeric",
                        "Salt to taste",
                        "Oil for cooking",
                        "Fresh mint chutney"
                    ],
                    recipe_instructions="FOR BATTER:\nSTEP 1: Drain soaked moong dal.\nSTEP 2: Blend dal with ginger and minimal water to smooth batter.\nSTEP 3: Add salt, turmeric, green chili, and mix.\nSTEP 4: Fold in onions and coriander.\n\nFOR CHILLA:\nSTEP 5: Heat a non-stick pan over medium heat.\nSTEP 6: Brush with oil.\nSTEP 7: Pour 1/4 cup batter and spread into thin circle.\nSTEP 8: Cook for 2-3 minutes until bottom is golden.\nSTEP 9: Flip and cook other side for 2 minutes.\nSTEP 10: Repeat with remaining batter.\nSTEP 11: Serve hot with mint chutney.",
                    prep_time_mins=10,
                    cook_time_mins=20
                ),
                Meal(
                    meal_type="mid_morning_snack",
                    name="Mixed Fruit Bowl",
                    description="Fresh seasonal fruits",
                    calories=round(target_calories * 0.1),
                    protein_grams=2,
                    carbs_grams=25,
                    fats_grams=1,
                    fiber_grams=4,
                    ingredients=[
                        "1/2 apple, diced",
                        "1/2 banana, sliced",
                        "1/4 cup pomegranate seeds",
                        "5-6 grapes",
                        "1 tbsp lemon juice",
                        "Pinch of chaat masala"
                    ],
                    recipe_instructions="STEP 1: Wash all fruits thoroughly.\nSTEP 2: Dice apple into bite-sized pieces.\nSTEP 3: Slice banana.\nSTEP 4: Combine all fruits in a bowl.\nSTEP 5: Squeeze lemon juice to prevent browning.\nSTEP 6: Sprinkle chaat masala if desired.\nSTEP 7: Toss gently and serve immediately.",
                    prep_time_mins=8,
                    cook_time_mins=0
                ),
                Meal(
                    meal_type="lunch",
                    name="Rajma Chawal (Kidney Beans Rice)",
                    description="North Indian comfort food rich in protein",
                    calories=round(target_calories * 0.3),
                    protein_grams=16,
                    carbs_grams=58,
                    fats_grams=8,
                    fiber_grams=14,
                    ingredients=[
                        "1 cup rajma (kidney beans), soaked overnight",
                        "1 cup basmati rice",
                        "2 onions, finely chopped",
                        "3 tomatoes, pureed",
                        "2 tbsp ginger-garlic paste",
                        "1 tsp cumin seeds",
                        "1 tsp coriander powder",
                        "1/2 tsp red chili powder",
                        "1/2 tsp garam masala",
                        "2 tbsp oil",
                        "Fresh coriander"
                    ],
                    recipe_instructions="FOR RAJMA:\nSTEP 1: Pressure cook soaked rajma with salt for 6-7 whistles until soft.\nSTEP 2: Heat oil in a pan, add cumin seeds.\nSTEP 3: Add onions, saute until golden brown (8-10 mins).\nSTEP 4: Add ginger-garlic paste, cook for 2 minutes.\nSTEP 5: Add tomato puree, cook until oil separates (5-7 mins).\nSTEP 6: Add coriander powder and red chili powder.\nSTEP 7: Add cooked rajma with its water.\nSTEP 8: Simmer for 15-20 minutes, mashing some beans.\nSTEP 9: Add garam masala, garnish with coriander.\n\nFOR RICE:\nSTEP 10: Cook rice with 2 cups water until fluffy.\nSTEP 11: Serve rajma over rice.",
                    prep_time_mins=15,
                    cook_time_mins=45
                ),
                Meal(
                    meal_type="evening_snack",
                    name="Sprouts Chaat",
                    description="Nutritious sprouted legumes salad",
                    calories=round(target_calories * 0.1),
                    protein_grams=10,
                    carbs_grams=18,
                    fats_grams=2,
                    fiber_grams=6,
                    ingredients=[
                        "1 cup mixed sprouts",
                        "1 small onion, chopped",
                        "1 small tomato, chopped",
                        "1/4 cup cucumber, diced",
                        "2 tbsp coriander, chopped",
                        "Juice of 1 lemon",
                        "1/2 tsp chaat masala",
                        "Salt to taste"
                    ],
                    recipe_instructions="STEP 1: Steam sprouts for 5-7 minutes until tender but crunchy.\nSTEP 2: Let sprouts cool to room temperature.\nSTEP 3: Chop onion, tomato, and cucumber finely.\nSTEP 4: Combine sprouts and vegetables in a bowl.\nSTEP 5: Add lemon juice, chaat masala, and salt.\nSTEP 6: Toss everything together.\nSTEP 7: Garnish with fresh coriander.\nSTEP 8: Serve immediately.",
                    prep_time_mins=10,
                    cook_time_mins=7
                ),
                Meal(
                    meal_type="dinner",
                    name="Vegetable Khichdi with Raita",
                    description="Light, easy-to-digest comfort meal",
                    calories=round(target_calories * 0.25),
                    protein_grams=14,
                    carbs_grams=45,
                    fats_grams=8,
                    fiber_grams=5,
                    ingredients=[
                        "1/2 cup rice",
                        "1/4 cup moong dal",
                        "1/2 cup mixed vegetables",
                        "1 tsp cumin seeds",
                        "1/2 tsp turmeric",
                        "1 tbsp ghee",
                        "Salt to taste",
                        "1 cup yogurt",
                        "1/4 cucumber, grated",
                        "1/4 tsp roasted cumin powder"
                    ],
                    recipe_instructions="FOR KHICHDI:\nSTEP 1: Wash rice and dal together 2-3 times.\nSTEP 2: Heat ghee in a pressure cooker.\nSTEP 3: Add cumin seeds, let them crackle.\nSTEP 4: Add mixed vegetables, saute for 2 minutes.\nSTEP 5: Add rice, dal, turmeric, and salt.\nSTEP 6: Add 3 cups water and mix well.\nSTEP 7: Pressure cook for 3 whistles.\nSTEP 8: Let pressure release naturally.\nSTEP 9: Mash lightly for creamy texture.\n\nFOR RAITA:\nSTEP 10: Whisk yogurt until smooth.\nSTEP 11: Add grated cucumber and salt.\nSTEP 12: Sprinkle roasted cumin powder.\nSTEP 13: Serve khichdi hot with raita.",
                    prep_time_mins=10,
                    cook_time_mins=20
                ),
            ]
        ]

        # Return veg meals for this method
        return veg_meals[day_index % len(veg_meals)]

    def _get_nonveg_meals(self, target_calories: int, day_index: int) -> list:
        """Get non-vegetarian meals (chicken, fish, eggs allowed)"""
        non_veg_meals = [
            # Day 1
            [
                Meal(meal_type="breakfast", name="Egg White Omelette with Avocado Toast", description="High protein, healthy fats breakfast", calories=round(target_calories * 0.25), protein_grams=28, carbs_grams=35, fats_grams=16, fiber_grams=7, ingredients=["4 egg whites + 1 whole egg", "1/4 cup bell peppers, diced", "1/4 cup mushrooms", "2 slices whole grain bread", "1/2 avocado", "1 tsp olive oil"], recipe_instructions="STEP 1: Whisk eggs. STEP 2: Cook vegetables. STEP 3: Make omelette. STEP 4: Toast bread with avocado.", prep_time_mins=8, cook_time_mins=10),
                Meal(meal_type="mid_morning_snack", name="Protein Smoothie", description="Quick muscle-building shake", calories=round(target_calories * 0.1), protein_grams=20, carbs_grams=22, fats_grams=5, fiber_grams=3, ingredients=["1 scoop whey protein", "1 banana", "1 cup milk", "1 tbsp peanut butter"], recipe_instructions="Blend all ingredients together.", prep_time_mins=5, cook_time_mins=0),
                Meal(meal_type="lunch", name="Grilled Chicken Breast with Quinoa", description="Lean protein with complete grain", calories=round(target_calories * 0.3), protein_grams=42, carbs_grams=45, fats_grams=12, fiber_grams=6, ingredients=["200g chicken breast", "1 cup quinoa", "Mixed vegetables", "Olive oil", "Lemon"], recipe_instructions="STEP 1: Grill chicken. STEP 2: Cook quinoa. STEP 3: Steam vegetables. STEP 4: Plate together.", prep_time_mins=20, cook_time_mins=25),
                Meal(meal_type="evening_snack", name="Boiled Eggs with Hummus", description="Protein-rich snack", calories=round(target_calories * 0.1), protein_grams=14, carbs_grams=8, fats_grams=10, fiber_grams=2, ingredients=["2 boiled eggs", "3 tbsp hummus", "Cucumber slices"], recipe_instructions="Boil eggs. Serve with hummus and vegetables.", prep_time_mins=5, cook_time_mins=15),
                Meal(meal_type="dinner", name="Baked Fish with Sweet Potato", description="Omega-3 rich dinner", calories=round(target_calories * 0.25), protein_grams=35, carbs_grams=40, fats_grams=10, fiber_grams=6, ingredients=["200g fish fillet", "1 medium sweet potato", "Green vegetables", "Lemon", "Herbs"], recipe_instructions="STEP 1: Bake sweet potato. STEP 2: Season and bake fish. STEP 3: Steam vegetables.", prep_time_mins=15, cook_time_mins=30),
            ],
            # Day 2
            [
                Meal(meal_type="breakfast", name="Chicken Keema Paratha", description="Protein-packed Indian breakfast", calories=round(target_calories * 0.25), protein_grams=25, carbs_grams=40, fats_grams=14, fiber_grams=4, ingredients=["100g chicken keema", "2 whole wheat parathas", "Onion, ginger, spices", "Yogurt"], recipe_instructions="Cook spiced keema. Serve with paratha and yogurt.", prep_time_mins=15, cook_time_mins=20),
                Meal(meal_type="mid_morning_snack", name="Greek Yogurt with Nuts", description="Probiotics and protein", calories=round(target_calories * 0.1), protein_grams=15, carbs_grams=15, fats_grams=8, fiber_grams=2, ingredients=["1 cup Greek yogurt", "Mixed nuts", "Honey"], recipe_instructions="Top yogurt with nuts and honey.", prep_time_mins=2, cook_time_mins=0),
                Meal(meal_type="lunch", name="Chicken Biryani with Raita", description="Flavorful Indian rice dish", calories=round(target_calories * 0.3), protein_grams=35, carbs_grams=55, fats_grams=15, fiber_grams=4, ingredients=["150g chicken", "1 cup basmati rice", "Biryani spices", "Yogurt, onions, mint"], recipe_instructions="Layer rice and chicken. Dum cook. Serve with raita.", prep_time_mins=30, cook_time_mins=45),
                Meal(meal_type="evening_snack", name="Egg Bhurji on Toast", description="Scrambled eggs Indian style", calories=round(target_calories * 0.1), protein_grams=14, carbs_grams=18, fats_grams=10, fiber_grams=2, ingredients=["2 eggs", "1 slice bread", "Onion, tomato, green chili"], recipe_instructions="Make spiced scrambled eggs. Serve on toast.", prep_time_mins=5, cook_time_mins=8),
                Meal(meal_type="dinner", name="Grilled Fish Tikka with Salad", description="Low-carb protein dinner", calories=round(target_calories * 0.25), protein_grams=38, carbs_grams=15, fats_grams=12, fiber_grams=5, ingredients=["200g fish", "Tikka marinade", "Mixed salad greens", "Lemon dressing"], recipe_instructions="Marinate fish. Grill until done. Serve with fresh salad.", prep_time_mins=20, cook_time_mins=15),
            ]
        ]
        return non_veg_meals[day_index % len(non_veg_meals)]

    def _get_eggetarian_meals(self, target_calories: int, day_index: int) -> list:
        """Get eggetarian meals (eggs allowed, but NO chicken, fish, or meat)"""
        egg_meals = [
            # Day 1
            [
                Meal(meal_type="breakfast", name="Masala Egg Bhurji with Paratha", description="Spiced scrambled eggs with Indian bread", calories=round(target_calories * 0.25), protein_grams=22, carbs_grams=38, fats_grams=16, fiber_grams=4, ingredients=["3 eggs", "1 whole wheat paratha", "1/4 cup onions", "1/4 cup tomatoes", "Green chili, turmeric, cumin"], recipe_instructions="STEP 1: Heat oil. STEP 2: Saute onions and tomatoes. STEP 3: Add spices. STEP 4: Add beaten eggs and scramble. STEP 5: Serve with paratha.", prep_time_mins=10, cook_time_mins=10),
                Meal(meal_type="mid_morning_snack", name="Boiled Eggs with Fruit", description="Simple protein snack", calories=round(target_calories * 0.1), protein_grams=14, carbs_grams=15, fats_grams=10, fiber_grams=2, ingredients=["2 boiled eggs", "1 apple or banana", "Pinch of salt and pepper"], recipe_instructions="Boil eggs for 10 mins. Serve with fruit.", prep_time_mins=2, cook_time_mins=12),
                Meal(meal_type="lunch", name="Paneer Butter Masala with Egg Fried Rice", description="Rich curry with protein rice", calories=round(target_calories * 0.3), protein_grams=28, carbs_grams=52, fats_grams=18, fiber_grams=5, ingredients=["150g paneer", "1 cup rice", "2 eggs", "Butter, cream, tomato gravy", "Peas, carrots"], recipe_instructions="STEP 1: Make paneer curry with tomato-cream gravy. STEP 2: Cook rice. STEP 3: Scramble eggs with rice and vegetables.", prep_time_mins=20, cook_time_mins=30),
                Meal(meal_type="evening_snack", name="Egg Sandwich", description="Quick protein snack", calories=round(target_calories * 0.1), protein_grams=15, carbs_grams=22, fats_grams=10, fiber_grams=3, ingredients=["2 boiled eggs, mashed", "2 slices whole wheat bread", "Mayonnaise, mustard", "Lettuce, tomato"], recipe_instructions="Mash eggs with mayo and mustard. Layer on bread with veggies.", prep_time_mins=8, cook_time_mins=0),
                Meal(meal_type="dinner", name="Egg Curry with Brown Rice", description="Protein-rich Indian dinner", calories=round(target_calories * 0.25), protein_grams=22, carbs_grams=48, fats_grams=14, fiber_grams=5, ingredients=["4 boiled eggs", "1 cup brown rice", "Onion-tomato gravy", "Garam masala, turmeric"], recipe_instructions="STEP 1: Make onion-tomato gravy. STEP 2: Add spices. STEP 3: Add halved boiled eggs. STEP 4: Simmer. STEP 5: Serve with rice.", prep_time_mins=15, cook_time_mins=25),
            ],
            # Day 2
            [
                Meal(meal_type="breakfast", name="Vegetable Omelette with Toast", description="Loaded veggie omelette", calories=round(target_calories * 0.25), protein_grams=24, carbs_grams=32, fats_grams=16, fiber_grams=5, ingredients=["3 eggs", "Bell peppers, onions, spinach", "2 slices whole wheat toast", "Butter, salt, pepper"], recipe_instructions="Beat eggs. Cook vegetables. Pour eggs over and fold. Serve with toast.", prep_time_mins=8, cook_time_mins=10),
                Meal(meal_type="mid_morning_snack", name="Egg White Protein Shake", description="Low-fat protein boost", calories=round(target_calories * 0.1), protein_grams=18, carbs_grams=20, fats_grams=3, fiber_grams=2, ingredients=["4 pasteurized egg whites", "1 banana", "1 cup milk", "1 tbsp honey"], recipe_instructions="Blend all ingredients until smooth.", prep_time_mins=5, cook_time_mins=0),
                Meal(meal_type="lunch", name="Dal Makhani with Egg Paratha", description="Creamy lentils with egg-stuffed bread", calories=round(target_calories * 0.3), protein_grams=26, carbs_grams=55, fats_grams=16, fiber_grams=10, ingredients=["1 cup dal makhani", "2 egg parathas", "Butter, cream", "Onion, ginger-garlic"], recipe_instructions="STEP 1: Make dal makhani. STEP 2: Make paratha dough. STEP 3: Stuff with beaten egg and cook.", prep_time_mins=25, cook_time_mins=40),
                Meal(meal_type="evening_snack", name="Deviled Eggs", description="Classic protein snack", calories=round(target_calories * 0.1), protein_grams=12, carbs_grams=4, fats_grams=12, fiber_grams=0, ingredients=["3 boiled eggs", "Mayonnaise", "Mustard", "Paprika, chives"], recipe_instructions="Halve eggs. Mix yolks with mayo and mustard. Fill whites. Garnish.", prep_time_mins=10, cook_time_mins=12),
                Meal(meal_type="dinner", name="Palak Paneer with Egg Rice", description="Spinach curry with protein rice", calories=round(target_calories * 0.25), protein_grams=26, carbs_grams=45, fats_grams=14, fiber_grams=6, ingredients=["100g paneer", "2 cups spinach", "1 cup rice", "2 eggs", "Spices, cream"], recipe_instructions="STEP 1: Make palak puree. STEP 2: Add paneer cubes. STEP 3: Cook rice with scrambled eggs mixed in.", prep_time_mins=20, cook_time_mins=25),
            ]
        ]
        return egg_meals[day_index % len(egg_meals)]
