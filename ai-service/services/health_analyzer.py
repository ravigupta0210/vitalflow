"""
Health Analyzer Service - Rule-based + AI Analysis
"""

from models.health_profile import (
    HealthProfile, HealthAnalysisResponse, HealthMetrics, HealthInsight
)
from services.gemini_client import GeminiClient
from rules.health_rules import HEALTH_RULES, evaluate_bmi_risk, evaluate_lifestyle_risks
from utils.calculations import (
    calculate_bmi, calculate_bmr, calculate_tdee,
    calculate_target_calories, calculate_ideal_weight, calculate_water_intake
)
import json


class HealthAnalyzer:
    """Analyzes user health profile using rules + AI"""

    def __init__(self, gemini_client: GeminiClient):
        self.gemini = gemini_client

    def calculate_all_metrics(self, profile: HealthProfile) -> dict:
        """Calculate all health metrics using formulas"""
        p = profile.profile

        bmi = calculate_bmi(p.weight, p.height)
        bmi_category = self._get_bmi_category(bmi)
        bmr = calculate_bmr(p.weight, p.height, p.age, p.gender)
        tdee = calculate_tdee(bmr, p.activityLevel)
        target_calories = calculate_target_calories(tdee, profile.goals)
        ideal_weight = calculate_ideal_weight(p.height)
        water_intake = calculate_water_intake(p.weight, p.activityLevel)

        return {
            "bmi": round(bmi, 1),
            "bmiCategory": bmi_category["category"],
            "bmiRisk": bmi_category["risk"],
            "bmr": bmr,
            "tdee": tdee,
            "targetCalories": target_calories,
            "idealWeight": ideal_weight,
            "recommendedWater": water_intake
        }

    def _get_bmi_category(self, bmi: float) -> dict:
        """Get BMI category and risk level"""
        for category, data in HEALTH_RULES["bmi"].items():
            if data["range"][0] <= bmi < data["range"][1]:
                return {"category": category, "risk": data["risk"]}
        return {"category": "unknown", "risk": "unknown"}

    async def analyze(self, profile: HealthProfile) -> HealthAnalysisResponse:
        """Complete health analysis with rules + AI"""

        # Step 1: Calculate metrics
        metrics = self.calculate_all_metrics(profile)

        # Step 2: Apply rule-based risk evaluation
        risks = []
        risks.extend(evaluate_bmi_risk(metrics["bmi"]))
        risks.extend(evaluate_lifestyle_risks(profile))

        # Step 3: Calculate base health score
        health_score = self._calculate_health_score(profile, metrics)

        # Step 4: Generate AI insights
        insights = await self._generate_ai_insights(profile, metrics, risks)

        # Step 5: Determine confidence and disclaimers
        confidence = self._calculate_confidence(profile)
        disclaimer = self._get_disclaimer(profile.conditions, confidence)

        return HealthAnalysisResponse(
            metrics=HealthMetrics(**metrics),
            insights=insights,
            healthScore=health_score,
            confidenceScore=confidence,
            disclaimer=disclaimer
        )

    def _calculate_health_score(self, profile: HealthProfile, metrics: dict) -> int:
        """Calculate overall health score (0-100)"""
        score = 50  # Base score

        # BMI contribution (up to 25 points)
        bmi = metrics["bmi"]
        if 18.5 <= bmi < 25:
            score += 25
        elif 17 <= bmi < 30:
            score += 15
        elif 16 <= bmi < 35:
            score += 5

        # Activity level contribution (up to 15 points)
        activity_scores = {
            "sedentary": 0,
            "light": 5,
            "moderate": 10,
            "active": 15,
            "very_active": 15
        }
        score += activity_scores.get(profile.profile.activityLevel, 5)

        # Goals progress penalty for health conditions
        condition_penalties = {
            "diabetes": 5,
            "heart_condition": 10,
            "hypertension": 5,
            "thyroid": 3
        }
        for condition in profile.conditions:
            score -= condition_penalties.get(condition.lower(), 2)

        return max(min(score, 100), 0)

    def _calculate_confidence(self, profile: HealthProfile) -> float:
        """Calculate confidence score based on data completeness"""
        confidence = 0.5  # Base confidence

        # Add confidence for complete profile data
        if profile.profile.age and profile.profile.gender:
            confidence += 0.1
        if profile.profile.weight and profile.profile.height:
            confidence += 0.1
        if profile.profile.activityLevel:
            confidence += 0.05
        if profile.goals:
            confidence += 0.1
        if profile.questionnaire:
            confidence += 0.15

        return min(confidence, 1.0)

    def _get_disclaimer(self, conditions: list, confidence: float) -> str:
        """Generate appropriate disclaimer based on conditions"""
        serious_conditions = ["heart_condition", "diabetes", "hypertension", "thyroid"]

        has_serious = any(c.lower() in serious_conditions for c in conditions)

        if has_serious:
            return "Given your health conditions, we strongly recommend consulting a healthcare provider before following these recommendations. This is not medical advice."

        if confidence < 0.5:
            return "These recommendations are based on limited data. Please complete your health profile for more personalized insights."

        return None

    async def _generate_ai_insights(
        self,
        profile: HealthProfile,
        metrics: dict,
        risks: list
    ) -> list:
        """Generate AI-powered health insights"""

        prompt = f"""You are a health and wellness advisor. Analyze this user's health data and provide personalized insights.

USER PROFILE:
- Age: {profile.profile.age}
- Gender: {profile.profile.gender}
- Weight: {profile.profile.weight} kg
- Height: {profile.profile.height} cm
- Activity Level: {profile.profile.activityLevel}
- Diet Type: {profile.profile.dietType or 'Not specified'}

CALCULATED METRICS:
- BMI: {metrics['bmi']} ({metrics['bmiCategory']})
- Daily Calorie Target: {metrics['targetCalories']} kcal
- Ideal Weight Range: {metrics['idealWeight']['min']}-{metrics['idealWeight']['max']} kg

HEALTH GOALS: {', '.join(profile.goals) if profile.goals else 'Not specified'}

MEDICAL CONDITIONS: {', '.join(profile.conditions) if profile.conditions else 'None reported'}

IDENTIFIED RISKS: {', '.join(risks) if risks else 'None'}

Generate 3-5 personalized health insights. Each insight should:
1. Be specific to the user's data
2. Include actionable advice
3. Be encouraging and supportive
4. NEVER provide medical diagnosis

Return as JSON array:
[
  {{
    "type": "recommendation|warning|tip|progress",
    "title": "Short title",
    "content": "Detailed insight with actionable advice (2-3 sentences)",
    "priority": "high|normal|low",
    "relatedGoal": "goal_type or null"
  }}
]

Only return the JSON array, no other text."""

        try:
            response = await self.gemini.generate(prompt, expect_json=True)
            insights_data = json.loads(response)

            # Validate and convert to HealthInsight models
            insights = []
            for item in insights_data[:5]:  # Max 5 insights
                insights.append(HealthInsight(
                    type=item.get("type", "tip"),
                    title=item.get("title", "Health Tip"),
                    content=item.get("content", ""),
                    priority=item.get("priority", "normal"),
                    relatedGoal=item.get("relatedGoal")
                ))

            return insights

        except Exception as e:
            print(f"Error generating AI insights: {e}")
            # Return rule-based fallback insights
            return self._get_fallback_insights(profile, metrics, risks)

    def _get_fallback_insights(
        self,
        profile: HealthProfile,
        metrics: dict,
        risks: list
    ) -> list:
        """Generate fallback insights when AI is unavailable"""
        insights = []

        # BMI-based insight
        if metrics["bmiCategory"] == "normal":
            insights.append(HealthInsight(
                type="progress",
                title="Healthy BMI",
                content=f"Your BMI of {metrics['bmi']} is in the healthy range. Keep maintaining your current lifestyle.",
                priority="normal"
            ))
        elif metrics["bmiCategory"] in ["overweight", "obese_class_1"]:
            insights.append(HealthInsight(
                type="recommendation",
                title="Weight Management",
                content=f"Your BMI of {metrics['bmi']} suggests room for improvement. Focus on balanced nutrition and regular exercise.",
                priority="high",
                relatedGoal="weight_loss"
            ))

        # Hydration insight
        insights.append(HealthInsight(
            type="tip",
            title="Stay Hydrated",
            content=f"Aim for {metrics['recommendedWater']}L of water daily. Proper hydration supports metabolism and energy levels.",
            priority="normal"
        ))

        # Goal-based insight
        if "muscle_gain" in profile.goals:
            insights.append(HealthInsight(
                type="recommendation",
                title="Protein Intake",
                content="For muscle building, aim for 1.8-2.2g of protein per kg of body weight. Include protein in every meal.",
                priority="high",
                relatedGoal="muscle_gain"
            ))

        if "weight_loss" in profile.goals:
            insights.append(HealthInsight(
                type="tip",
                title="Calorie Awareness",
                content=f"Your target is {metrics['targetCalories']} calories/day. Focus on whole foods and avoid processed snacks.",
                priority="high",
                relatedGoal="weight_loss"
            ))

        return insights[:5]
