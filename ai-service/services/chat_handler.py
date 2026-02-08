"""
AI Chat Handler - Context-aware Health Chatbot
"""

from models.health_profile import ChatRequest, ChatResponse
from services.gemini_client import GeminiClient, GeminiAPIError


# Comprehensive fallback responses for common health questions
FALLBACK_RESPONSES = {
    # Pre-workout nutrition
    "pre_workout_food": {
        "keywords": ["eat before", "before workout", "pre workout", "pre-workout", "before exercise", "before gym", "before training"],
        "response": """**Pre-Workout Nutrition Tips:**

🍌 **30-60 minutes before workout:**
- A banana or apple for quick energy
- Small handful of nuts
- Greek yogurt with berries

🍞 **2-3 hours before workout:**
- Oatmeal with fruits
- Whole grain toast with peanut butter
- Brown rice with lean protein

**Key principles:**
- Focus on easily digestible carbs for energy
- Include moderate protein
- Avoid high-fat and high-fiber foods right before
- Stay hydrated - drink 500ml water 2 hours before

Would you like more specific recommendations based on your workout type?"""
    },

    # Post-workout nutrition
    "post_workout_food": {
        "keywords": ["eat after", "after workout", "post workout", "post-workout", "after exercise", "after gym", "after training", "recovery meal"],
        "response": """**Post-Workout Nutrition Tips:**

⏰ **Within 30-45 minutes after workout:**
- Protein shake with banana
- Chocolate milk (great recovery drink!)
- Greek yogurt with granola

🍽️ **Full meal within 2 hours:**
- Grilled chicken with rice and vegetables
- Eggs with whole grain toast
- Fish with sweet potato

**Key principles:**
- Aim for 20-40g protein for muscle recovery
- Include carbs to replenish glycogen stores
- Ratio: 3:1 carbs to protein for endurance, 2:1 for strength
- Rehydrate with water or electrolyte drinks

What type of workout did you do? I can give more specific advice!"""
    },

    # Weight loss tips
    "weight_loss": {
        "keywords": ["lose weight", "weight loss", "fat loss", "burn fat", "cut weight", "slim down", "reduce weight"],
        "response": """**Effective Weight Loss Strategies:**

🎯 **Nutrition (80% of results):**
- Create a moderate calorie deficit (300-500 cal/day)
- Prioritize protein (1.6-2.2g per kg body weight)
- Eat more vegetables and fiber
- Reduce processed foods and sugary drinks
- Practice portion control

🏃 **Exercise (20% of results):**
- Combine cardio and strength training
- Aim for 150+ minutes of activity per week
- Include HIIT for efficient fat burning
- Don't neglect strength training - muscle burns calories!

⚖️ **Sustainable habits:**
- Aim for 0.5-1 kg loss per week
- Get 7-8 hours of sleep
- Manage stress (cortisol affects weight)
- Stay consistent - progress takes time

Would you like a personalized calorie target or meal plan suggestions?"""
    },

    # Muscle building
    "muscle_gain": {
        "keywords": ["build muscle", "gain muscle", "muscle growth", "bulk", "get bigger", "increase muscle", "hypertrophy"],
        "response": """**Muscle Building Fundamentals:**

🏋️ **Training:**
- Focus on progressive overload (gradually increase weight/reps)
- Train each muscle group 2x per week
- Rep range: 6-12 reps for hypertrophy
- Rest 60-90 seconds between sets
- Prioritize compound movements

🥩 **Nutrition:**
- Calorie surplus of 200-300 cal/day (lean bulk)
- Protein: 1.8-2.4g per kg body weight
- Spread protein across 4-5 meals
- Don't fear carbs - they fuel workouts!
- Stay hydrated

😴 **Recovery:**
- Sleep 7-9 hours (growth happens during rest!)
- Allow 48-72 hours between training same muscle
- Manage stress - high cortisol impairs gains

How long have you been training? I can adjust recommendations for your level!"""
    },

    # Protein requirements
    "protein": {
        "keywords": ["how much protein", "protein intake", "protein requirement", "daily protein", "protein need"],
        "response": """**Daily Protein Requirements:**

📊 **General guidelines (per kg body weight):**
- Sedentary adult: 0.8g/kg
- Active individual: 1.2-1.4g/kg
- Muscle building: 1.8-2.4g/kg
- Weight loss (preserve muscle): 1.6-2.2g/kg
- Athletes: 1.4-2.0g/kg

🥚 **Good protein sources:**
- **Non-veg:** Chicken (31g/100g), Fish (20-25g), Eggs (6g each)
- **Vegetarian:** Paneer (18g), Greek yogurt (10g), Tofu (8g)
- **Vegan:** Lentils (9g), Chickpeas (7g), Tempeh (19g)

⏰ **Timing tips:**
- Spread intake across 4-5 meals
- 20-40g per meal for optimal absorption
- Have protein within 2 hours post-workout

What's your current weight and goal? I can calculate your specific needs!"""
    },

    # Sleep
    "sleep": {
        "keywords": ["sleep", "insomnia", "can't sleep", "sleeping", "rest", "tired", "fatigue", "exhausted"],
        "response": """**Better Sleep Tips:**

🌙 **Sleep hygiene:**
- Keep consistent sleep/wake times
- Aim for 7-9 hours per night
- Create a dark, cool (18-20°C) bedroom
- Avoid screens 1 hour before bed

☕ **What to avoid:**
- Caffeine after 2 PM
- Large meals close to bedtime
- Intense exercise within 3 hours of sleep
- Alcohol (disrupts sleep quality)

✅ **What helps:**
- Light stretching or yoga before bed
- Warm bath/shower
- Reading (physical books)
- Relaxation techniques (deep breathing, meditation)
- Chamomile tea or warm milk

**For fitness:**
Sleep is when muscle recovery and growth hormone release happens. Poor sleep = poor gains!

Are you having trouble falling asleep or staying asleep?"""
    },

    # Stress management
    "stress": {
        "keywords": ["stress", "anxiety", "anxious", "overwhelmed", "mental health", "worried", "stressed"],
        "response": """**Managing Stress for Better Health:**

🧘 **Immediate relief techniques:**
- Deep breathing (4-7-8 technique)
- Progressive muscle relaxation
- Short walk in nature
- Grounding exercises (5-4-3-2-1 method)

🏃 **Regular practices:**
- Exercise 30+ minutes daily (natural stress reliever!)
- Yoga or meditation
- Adequate sleep (7-9 hours)
- Limit caffeine and alcohol

🎯 **Lifestyle adjustments:**
- Prioritize and organize tasks
- Set boundaries
- Connect with friends/family
- Take regular breaks
- Limit social media

**How stress affects fitness:**
- High cortisol can lead to weight gain (especially belly fat)
- Impairs muscle recovery
- Disrupts sleep quality
- Affects motivation and consistency

If stress persists, please consider speaking with a mental health professional. It's a sign of strength, not weakness!"""
    },

    # Water intake
    "hydration": {
        "keywords": ["water", "hydration", "drink", "dehydrated", "thirsty", "fluid"],
        "response": """**Hydration Guidelines:**

💧 **Daily water intake:**
- General: 2-3 liters (8-12 glasses)
- Formula: Weight (kg) × 30ml
- Active/hot climate: Add 500ml-1L more
- During exercise: 200-300ml every 15-20 minutes

🏋️ **Exercise hydration:**
- 2 hours before: 500ml
- During: 200ml every 15-20 minutes
- After: 500ml+ (replace lost fluids)

✅ **Signs of good hydration:**
- Pale yellow urine
- Regular bathroom visits
- No persistent thirst
- Good energy levels

⚠️ **Signs of dehydration:**
- Dark urine
- Headache
- Fatigue
- Dizziness
- Poor workout performance

**Pro tip:** Carry a water bottle and set reminders if you forget to drink!"""
    },

    # General workout advice
    "workout_general": {
        "keywords": ["workout", "exercise", "gym", "training", "fitness", "routine"],
        "response": """**General Workout Guidelines:**

📅 **Frequency:**
- Beginners: 3 days/week (full body)
- Intermediate: 4-5 days/week (split routine)
- Advanced: 5-6 days/week

🎯 **Key principles:**
- Always warm up (5-10 minutes)
- Focus on proper form over weight
- Progressive overload for results
- Include both cardio and strength
- Cool down and stretch

💪 **Effective split examples:**
- **3 days:** Full Body A, Full Body B, Full Body C
- **4 days:** Upper/Lower/Upper/Lower
- **5 days:** Push/Pull/Legs/Upper/Lower

⏰ **Session structure:**
1. Warm-up (5-10 min)
2. Main workout (30-45 min)
3. Cool-down/stretch (5-10 min)

What are your specific fitness goals? I can recommend a more targeted approach!"""
    },

    # Calories
    "calories": {
        "keywords": ["calorie", "calories", "how many calories", "calorie intake", "tdee", "maintenance"],
        "response": """**Understanding Your Calorie Needs:**

📊 **Estimating TDEE (Total Daily Energy Expenditure):**

Quick formula: Weight (kg) × Activity Factor
- Sedentary (desk job): × 22
- Lightly active: × 24
- Moderately active: × 26
- Very active: × 28
- Extremely active: × 30

🎯 **Adjust for goals:**
- **Weight loss:** TDEE minus 300-500 calories
- **Maintenance:** Eat at TDEE
- **Muscle gain:** TDEE plus 200-300 calories

**Example (70kg moderately active person):**
- TDEE: 70 × 26 = 1,820 calories
- For weight loss: 1,320-1,520 calories
- For muscle gain: 2,020-2,120 calories

📱 **Tips:**
- Track food for 1-2 weeks to understand portions
- Focus on nutrient-dense foods
- Don't go below 1,200 (women) or 1,500 (men) calories

Want me to help calculate your specific needs?"""
    },

    # PCOD/PCOS specific
    "pcod": {
        "keywords": ["pcod", "pcos", "polycystic", "ovarian", "hormonal"],
        "response": """**PCOD/PCOS Management Tips:**

🥗 **Nutrition:**
- Focus on low glycemic index (GI) foods
- Increase fiber intake
- Choose lean proteins
- Include anti-inflammatory foods (turmeric, omega-3)
- Limit refined carbs and sugar
- Consider reducing dairy

🏋️ **Exercise recommendations:**
- Strength training (improves insulin sensitivity)
- HIIT workouts (2-3x/week)
- Yoga (reduces stress, helps hormone balance)
- Walking (30+ minutes daily)

⚖️ **Lifestyle:**
- Maintain healthy weight (even 5-10% loss helps)
- Manage stress (cortisol worsens PCOD)
- Prioritize sleep
- Stay consistent with meals

**Foods to focus on:**
- Leafy greens, berries, fatty fish
- Legumes, nuts, seeds
- Whole grains (quinoa, brown rice)

Please consult your gynecologist for personalized medical advice!"""
    },

    # Diabetes specific
    "diabetes": {
        "keywords": ["diabetes", "diabetic", "blood sugar", "glucose", "insulin"],
        "response": """**Diabetes-Friendly Lifestyle Tips:**

🥗 **Nutrition:**
- Choose low glycemic index foods
- Control portion sizes
- Include fiber with every meal
- Lean proteins help stabilize blood sugar
- Healthy fats (nuts, avocado, olive oil)
- Avoid sugary drinks and refined carbs

🏃 **Exercise:**
- Regular activity improves insulin sensitivity
- Aim for 30+ minutes most days
- Check blood sugar before/after exercise
- Carry fast-acting glucose
- Best: Walking, swimming, cycling, strength training

⚠️ **Pre-workout precautions:**
- Don't exercise if blood sugar is <100 or >250 mg/dL
- Have a snack if needed
- Stay hydrated
- Monitor for hypoglycemia signs

**Meal timing:**
- Eat at consistent times
- Don't skip meals
- Balance carbs throughout day
- Have protein with each meal

Please work with your healthcare provider for medication adjustments!"""
    },
}


class ChatHandler:
    """Handles AI chat conversations with health context"""

    def __init__(self, gemini_client: GeminiClient):
        self.gemini = gemini_client

    async def respond(self, request: ChatRequest) -> ChatResponse:
        """Generate response to user message"""

        # Build context-aware system prompt
        system_prompt = self._build_system_prompt(request.context)

        # Build conversation messages
        messages = [{"role": m.role, "content": m.content} for m in request.history]
        messages.append({"role": "user", "content": request.message})

        # Generate response - try Gemini first, then fallback
        response = None
        if self.gemini.is_configured:
            try:
                response = await self._generate_ai_response(system_prompt, messages)
            except Exception as e:
                print(f"⚠️ Gemini failed, using smart fallback: {e}")
                response = None

        # Use intelligent fallback if Gemini failed or not configured
        if not response:
            response = self._get_smart_fallback_response(request.message, messages, request.context)

        # Generate suggested follow-up questions
        suggestions = self._get_suggestions(request.context, request.message)

        return ChatResponse(
            response=response,
            suggestedQuestions=suggestions
        )

    def _build_system_prompt(self, context) -> str:
        """Build system prompt with user context"""

        profile_info = ""
        if context.profile:
            profile_info = f"""
USER PROFILE:
- Age: {context.profile.get('age', 'Not specified')}
- Gender: {context.profile.get('gender', 'Not specified')}
- Diet Type: {context.profile.get('dietType', 'Not specified')}
- Activity Level: {context.profile.get('activityLevel', 'Not specified')}
- BMI: {context.profile.get('bmi', 'Not calculated')}
- Target Calories: {context.profile.get('targetCalories', 'Not set')}
"""

        goals_info = ""
        if context.goals:
            goals_info = f"\nHEALTH GOALS: {', '.join(context.goals)}"

        conditions_info = ""
        if context.conditions:
            conditions_info = f"\nMEDICAL CONDITIONS: {', '.join(context.conditions)}"

        return f"""You are VitalFlow AI, a knowledgeable and empathetic health assistant. You help users with:
- Fitness and workout questions
- Nutrition and diet advice
- General health and wellness guidance
- Motivation and accountability

{profile_info}
{goals_info}
{conditions_info}

IMPORTANT GUIDELINES:
1. Provide accurate, evidence-based health information
2. Always consider the user's health profile and conditions when giving advice
3. NEVER provide medical diagnosis - recommend consulting doctors for medical concerns
4. Be encouraging, supportive, and positive
5. Give specific, actionable advice when possible
6. Use simple language, avoid medical jargon
7. If asked about topics outside health/fitness, politely redirect
8. Keep responses concise but helpful (2-4 paragraphs max)

SAFETY RULES - Never recommend:
- Extreme diets or extended fasting without medical supervision
- Exercises contraindicated for their conditions
- Specific supplements or medications without professional guidance
- Ignoring symptoms that need medical attention

Remember: You are a wellness guide, not a doctor."""

    async def _generate_ai_response(self, system_prompt: str, messages: list) -> str:
        """Generate AI response using Gemini"""

        # Build conversation context summary if history exists
        context_summary = ""
        if len(messages) > 1:
            # Summarize what was discussed before
            topics_discussed = []
            for msg in messages[:-1]:
                content_lower = msg["content"].lower()
                if any(word in content_lower for word in ["protein", "whey", "supplement"]):
                    topics_discussed.append("protein/supplements")
                elif any(word in content_lower for word in ["weight loss", "lose weight", "fat loss"]):
                    topics_discussed.append("weight loss")
                elif any(word in content_lower for word in ["muscle", "bulk", "gain"]):
                    topics_discussed.append("muscle building")
                elif any(word in content_lower for word in ["workout", "exercise", "gym"]):
                    topics_discussed.append("workouts")
                elif any(word in content_lower for word in ["diet", "meal", "food", "eat"]):
                    topics_discussed.append("nutrition")

            if topics_discussed:
                unique_topics = list(set(topics_discussed))[-3:]  # Last 3 unique topics
                context_summary = f"\n\nCONVERSATION CONTEXT: The user has been asking about {', '.join(unique_topics)}. Maintain continuity and reference previous discussion when relevant."

        # Build full prompt
        full_prompt = f"""{system_prompt}{context_summary}

CONVERSATION HISTORY:
{self._format_messages(messages)}

IMPORTANT INSTRUCTIONS:
1. This is a CONTINUOUS conversation - remember what was discussed earlier
2. If the user asks a follow-up like "tell me more" or "what about X", refer to the previous topic
3. Don't restart the conversation or introduce yourself again
4. Be specific and actionable in your advice
5. If asked about products/brands, give specific Indian brand recommendations
6. Keep responses focused and relevant to the user's question

Respond naturally to the user's last message:"""

        try:
            response = await self.gemini.generate(full_prompt)
            return response
        except GeminiAPIError as e:
            print(f"⚠️ Chat using fallback (Gemini unavailable): {e}")
            raise  # Re-raise to trigger smart fallback
        except Exception as e:
            print(f"❌ Unexpected chat error: {e}")
            raise  # Re-raise to trigger smart fallback

    def _format_messages(self, messages: list) -> str:
        """Format messages for prompt"""
        formatted = []
        for msg in messages[-10:]:  # Last 10 messages for better context
            role = "User" if msg["role"] == "user" else "Assistant"
            formatted.append(f"{role}: {msg['content']}")
        return "\n\n".join(formatted)

    def _get_fallback_response(self, message: str) -> str:
        """Get comprehensive fallback response when AI is unavailable"""
        message_lower = message.lower()

        # Priority order for matching - most specific topics first
        priority_order = [
            "pre_workout_food",   # "eat before workout" - specific
            "post_workout_food",  # "eat after workout" - specific
            "protein",            # protein questions
            "calories",           # calorie questions
            "pcod",               # PCOD/PCOS specific
            "diabetes",           # diabetes specific
            "weight_loss",        # weight loss (before general workout)
            "muscle_gain",        # muscle building
            "hydration",          # water intake
            "sleep",              # sleep topics
            "stress",             # stress/anxiety
            "workout_general",    # general workout - last resort for workout keywords
        ]

        # Check in priority order
        for topic in priority_order:
            if topic not in FALLBACK_RESPONSES:
                continue
            data = FALLBACK_RESPONSES[topic]
            for keyword in data["keywords"]:
                if keyword in message_lower:
                    return data["response"]

        # If no specific match, return None to trigger smart fallback
        return None

    def _get_smart_fallback_response(self, message: str, history: list, context) -> str:
        """Smart fallback that considers conversation context"""
        message_lower = message.lower()

        # First try the basic keyword matching
        basic_response = self._get_fallback_response(message)
        if basic_response:
            return basic_response

        # Check if this is a follow-up question by looking at conversation history
        if history and len(history) > 1:
            # Get the context from previous messages
            prev_messages = [m["content"].lower() for m in history[:-1]]
            prev_combined = " ".join(prev_messages[-4:])  # Last 4 messages for context

            # Determine the topic from previous conversation
            topic_context = None
            for topic, data in FALLBACK_RESPONSES.items():
                for keyword in data["keywords"]:
                    if keyword in prev_combined:
                        topic_context = topic
                        break
                if topic_context:
                    break

            # If we found a topic from context, provide contextual response
            if topic_context:
                return self._get_contextual_follow_up(message_lower, topic_context, context)

        # Handle common follow-up patterns
        follow_up_patterns = {
            "tell me more": "Could you please be more specific about what aspect you'd like to learn more about? I can help with nutrition, workouts, supplements, or general health advice.",
            "more details": "I'd be happy to provide more details! What specific aspect would you like me to elaborate on?",
            "what else": "I can help you with many topics! Are you interested in:\n\n• **Nutrition** - meal plans, macros, timing\n• **Workouts** - exercises, routines, recovery\n• **Supplements** - protein powders, vitamins\n• **Lifestyle** - sleep, stress, hydration\n\nWhat interests you most?",
            "something else": "Sure! What would you like to know about? I can help with workouts, nutrition, weight management, muscle building, and overall wellness.",
            "recommend": "I'd be happy to make recommendations! Could you tell me more about what you're looking for? For example:\n\n• Protein supplements\n• Pre-workout snacks\n• Exercise routines\n• Meal plans",
            "suggest": "I'd love to help with suggestions! What area are you interested in?\n\n• **Diet** - meals, snacks, supplements\n• **Exercise** - routines, equipment\n• **Recovery** - sleep, rest days, stretching",
            "product": self._get_product_recommendations(context),
            "supplement": self._get_supplement_recommendations(context),
            "powder": self._get_protein_powder_recommendations(context),
            "brand": self._get_protein_powder_recommendations(context),
        }

        for pattern, response in follow_up_patterns.items():
            if pattern in message_lower:
                return response

        # Default helpful response (not the welcome message)
        return """I'd be happy to help you! However, I'm not sure I understood your question.

Could you try asking about:
• **Nutrition** - "What protein powder do you recommend?"
• **Workouts** - "What exercises help build muscle?"
• **Diet** - "How many calories should I eat?"
• **Health conditions** - "Tips for managing diabetes"

Or feel free to rephrase your question, and I'll do my best to assist!"""

    def _get_contextual_follow_up(self, message: str, topic: str, context) -> str:
        """Provide contextual follow-up based on previous topic"""
        contextual_responses = {
            "protein": """Based on our protein discussion, here are some additional tips:

**Popular protein supplements:**
• **Whey Protein** - Fast absorbing, great post-workout
• **Casein** - Slow release, good before bed
• **Plant-based** - Pea, hemp, or rice protein for vegetarians

**Recommended brands (India):**
• MuscleBlaze, Optimum Nutrition, MyProtein, Dymatize

**Timing:**
• Post-workout: 20-30g whey protein
• Before bed: 20g casein
• Morning: Protein-rich breakfast

Would you like specific brand recommendations for your goals?""",

            "weight_loss": """Building on our weight loss discussion:

**Supplements that may help:**
• Green tea extract (boosts metabolism)
• Protein powder (increases satiety)
• Fiber supplements (promotes fullness)

**Foods to add:**
• High-protein snacks
• Fiber-rich vegetables
• Healthy fats (nuts, avocado)

**Avoid:**
• Sugary drinks
• Processed snacks
• Late-night eating

Want me to create a sample meal plan?""",

            "muscle_gain": """Continuing our muscle building discussion:

**Key supplements:**
• Whey protein (essential)
• Creatine monohydrate (proven effective)
• BCAAs (optional, good during workouts)

**Nutrition priorities:**
• Calorie surplus (200-300 extra/day)
• 1.8-2.2g protein per kg bodyweight
• Carbs around workouts

**Training tips:**
• Progressive overload
• Compound movements first
• 48-72 hours recovery per muscle

What aspect would you like to explore further?"""
        }

        if topic in contextual_responses:
            return contextual_responses[topic]

        # Default contextual response
        return f"""I see you're continuing our conversation about {topic.replace('_', ' ')}.

What specific aspect would you like to know more about? I can help with:
• Product/supplement recommendations
• Detailed meal planning
• Exercise routines
• Scientific explanations

Just let me know what interests you!"""

    def _get_product_recommendations(self, context) -> str:
        """Get product recommendations based on user context"""
        return """**Popular Health & Fitness Products:**

🥤 **Protein Supplements:**
• **Whey Protein:** MuscleBlaze, Optimum Nutrition (ON), MyProtein
• **Plant-Based:** Oziva, Boldfit, Nutrabay
• **Budget-Friendly:** Asitis Whey, Big Muscles

💊 **Other Supplements:**
• **Multivitamins:** Centrum, HealthKart HK Vitals
• **Omega-3:** Healthvit, Now Foods
• **Creatine:** Optimum Nutrition, MuscleBlaze

🏋️ **Equipment:**
• Resistance bands, yoga mats, dumbbells
• Fitness trackers (Mi Band, Fitbit)

**Tips:**
• Always check for authenticity (buy from official stores)
• Start with basic supplements first
• Consult a doctor before starting new supplements

What specific product category interests you?"""

    def _get_supplement_recommendations(self, context) -> str:
        """Get supplement recommendations"""
        diet_type = context.profile.get('dietType', 'non_vegetarian') if context.profile else 'non_vegetarian'

        veg_note = ""
        if diet_type in ['vegetarian', 'vegan', 'eggetarian']:
            veg_note = "\n\n**Vegetarian-Friendly Options:**\n• Plant protein (pea, rice, hemp)\n• Vegan BCAAs\n• Algae-based Omega-3"

        return f"""**Recommended Supplements for Your Goals:**

💪 **For Muscle Building:**
• Whey/Plant Protein (essential)
• Creatine Monohydrate (5g/day)
• BCAAs (optional)

⚖️ **For Weight Loss:**
• Protein powder (increases satiety)
• Green tea extract
• L-Carnitine (optional)

🏃 **For Energy & Recovery:**
• Pre-workout (caffeine-based)
• Multivitamins
• Omega-3 fatty acids
• Electrolytes{veg_note}

**Indian Brands to Consider:**
• MuscleBlaze, Optimum Nutrition, MyProtein
• Oziva (plant-based), Boldfit
• HealthKart, Nutrabay

Would you like specific recommendations for any category?"""

    def _get_protein_powder_recommendations(self, context) -> str:
        """Get protein powder recommendations"""
        diet_type = context.profile.get('dietType', 'non_vegetarian') if context.profile else 'non_vegetarian'

        if diet_type in ['vegetarian', 'vegan']:
            return """**Vegetarian/Vegan Protein Powder Recommendations:**

🌱 **Top Plant-Based Options:**

1. **Oziva Protein & Herbs** (Women-focused)
   - 23g protein per serving
   - Added Ayurvedic herbs
   - Price: ₹1,500-2,000/kg

2. **MyProtein Vegan Blend**
   - 22g protein per serving
   - Pea + brown rice protein
   - Price: ₹2,000-2,500/kg

3. **Boldfit Plant Protein**
   - 25g protein per serving
   - Good taste, affordable
   - Price: ₹1,200-1,500/kg

4. **Nutrabay Pure Pea Protein**
   - 24g protein per serving
   - Single ingredient, no additives
   - Price: ₹800-1,000/kg

**Tips for Plant Protein:**
• Combine with rice/hemp for complete amino acids
• May need digestive adjustment period
• Best taken with meals

Would you like to know more about any specific brand?"""
        else:
            return """**Whey Protein Powder Recommendations:**

🥛 **Top Whey Protein Options:**

1. **Optimum Nutrition Gold Standard**
   - 24g protein per serving
   - Industry gold standard
   - Price: ₹4,000-5,000/kg

2. **MuscleBlaze Biozyme Whey**
   - 25g protein + digestive enzymes
   - Good for Indian stomachs
   - Price: ₹2,500-3,000/kg

3. **MyProtein Impact Whey**
   - 21g protein per serving
   - Great value, many flavors
   - Price: ₹2,000-2,500/kg

4. **Asitis Whey Protein**
   - 24g protein per serving
   - Budget-friendly, unflavored
   - Price: ₹1,500-2,000/kg

5. **Dymatize ISO 100**
   - 25g hydrolyzed whey
   - Fast absorption, premium
   - Price: ₹5,000-6,000/kg

**Buying Tips:**
• Check authenticity codes
• Buy from authorized sellers (Amazon, official sites)
• Start with 1kg to test tolerance

Would you like details about any specific product?"""

    def _get_suggestions(self, context, current_message: str) -> list:
        """Generate suggested follow-up questions"""
        suggestions = []

        # Generic suggestions
        base_suggestions = [
            "What should I eat before a workout?",
            "How can I improve my sleep quality?",
            "What exercises are best for my goals?"
        ]

        # Goal-specific suggestions
        if context.goals:
            if "weight_loss" in context.goals:
                suggestions.append("How can I break through a weight loss plateau?")
                suggestions.append("What are the best fat-burning exercises?")
            if "muscle_gain" in context.goals:
                suggestions.append("How much protein do I need daily?")
                suggestions.append("What is progressive overload?")
            if "diabetes" in context.goals:
                suggestions.append("What foods help control blood sugar?")
            if "pcod" in context.goals:
                suggestions.append("What exercises help with PCOD?")

        # Add base suggestions if needed
        suggestions.extend(base_suggestions)

        # Return unique suggestions
        return list(dict.fromkeys(suggestions))[:4]
