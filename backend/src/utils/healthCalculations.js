/**
 * Health calculation utilities based on research-backed formulas
 */

// Activity level multipliers for TDEE calculation
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,        // Little or no exercise
  light: 1.375,          // Light exercise 1-3 days/week
  moderate: 1.55,        // Moderate exercise 3-5 days/week
  active: 1.725,         // Hard exercise 6-7 days/week
  very_active: 1.9       // Very hard exercise, physical job
};

/**
 * Calculate BMI (Body Mass Index)
 * Formula: weight (kg) / height (m)^2
 * Source: WHO Guidelines
 */
const calculateBMI = (weightKg, heightCm) => {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10;
};

/**
 * Get BMI category
 * Source: WHO Classification
 */
const getBMICategory = (bmi) => {
  if (bmi < 18.5) return { category: 'underweight', risk: 'moderate' };
  if (bmi < 25) return { category: 'normal', risk: 'low' };
  if (bmi < 30) return { category: 'overweight', risk: 'moderate' };
  if (bmi < 35) return { category: 'obese_class_1', risk: 'high' };
  if (bmi < 40) return { category: 'obese_class_2', risk: 'very_high' };
  return { category: 'obese_class_3', risk: 'extremely_high' };
};

/**
 * Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
 * More accurate than Harris-Benedict for modern populations
 * Source: Mifflin MD, et al. Am J Clin Nutr. 1990
 *
 * For men: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
 * For women: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
 */
const calculateBMR = (weightKg, heightCm, age, gender) => {
  const baseBMR = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
  const bmr = gender === 'male' ? baseBMR + 5 : baseBMR - 161;
  return Math.round(bmr);
};

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 * TDEE = BMR × Activity Multiplier
 */
const calculateTDEE = (bmr, activityLevel) => {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || ACTIVITY_MULTIPLIERS.moderate;
  return Math.round(bmr * multiplier);
};

/**
 * Calculate target calories based on goals
 * Default: maintain weight
 * Weight loss: -500 kcal/day (0.5 kg/week)
 * Muscle gain: +300 kcal/day
 */
const calculateTargetCalories = (tdee, goals = []) => {
  let adjustment = 0;

  if (goals.includes('weight_loss')) {
    adjustment -= 500;
  } else if (goals.includes('muscle_gain')) {
    adjustment += 300;
  }

  // Ensure minimum calories
  const target = Math.max(tdee + adjustment, 1200);
  return Math.round(target);
};

/**
 * Calculate macro distribution based on goals
 * Returns grams of protein, carbs, and fats
 */
const calculateMacros = (targetCalories, weightKg, goals = []) => {
  let proteinPerKg = 1.6; // Default moderate protein
  let fatPercentage = 0.25; // 25% of calories from fat

  // Adjust based on goals
  if (goals.includes('muscle_gain')) {
    proteinPerKg = 2.0;
    fatPercentage = 0.25;
  } else if (goals.includes('weight_loss')) {
    proteinPerKg = 2.2; // Higher protein for satiety and muscle preservation
    fatPercentage = 0.30;
  } else if (goals.includes('diabetes')) {
    proteinPerKg = 1.8;
    fatPercentage = 0.35; // Lower carb, higher fat
  }

  const proteinGrams = Math.round(weightKg * proteinPerKg);
  const proteinCalories = proteinGrams * 4;

  const fatCalories = Math.round(targetCalories * fatPercentage);
  const fatGrams = Math.round(fatCalories / 9);

  const carbCalories = targetCalories - proteinCalories - fatCalories;
  const carbGrams = Math.round(carbCalories / 4);

  return {
    protein: proteinGrams,
    carbs: Math.max(carbGrams, 50), // Minimum 50g carbs
    fats: fatGrams,
    fiber: Math.round(targetCalories / 100) // ~25-30g fiber per 2500 cal
  };
};

/**
 * Calculate ideal weight range
 * Based on BMI range of 18.5-24.9
 */
const calculateIdealWeightRange = (heightCm) => {
  const heightM = heightCm / 100;
  const minWeight = Math.round(18.5 * heightM * heightM);
  const maxWeight = Math.round(24.9 * heightM * heightM);
  return { min: minWeight, max: maxWeight };
};

/**
 * Calculate water intake recommendation
 * Source: National Academies of Sciences
 * Formula: ~30-35ml per kg of body weight
 */
const calculateWaterIntake = (weightKg, activityLevel) => {
  let baseIntake = weightKg * 30; // ml

  // Increase for active individuals
  if (activityLevel === 'active' || activityLevel === 'very_active') {
    baseIntake = weightKg * 35;
  }

  return Math.round(baseIntake / 1000 * 10) / 10; // Convert to liters, round to 1 decimal
};

/**
 * Calculate all health metrics
 */
const calculateHealthMetrics = ({ age, gender, heightCm, weightKg, activityLevel, goals = [] }) => {
  const bmi = calculateBMI(weightKg, heightCm);
  const bmiCategory = getBMICategory(bmi);
  const bmr = calculateBMR(weightKg, heightCm, age, gender);
  const tdee = calculateTDEE(bmr, activityLevel);
  const targetCalories = calculateTargetCalories(tdee, goals);
  const macros = calculateMacros(targetCalories, weightKg, goals);
  const idealWeight = calculateIdealWeightRange(heightCm);
  const waterIntake = calculateWaterIntake(weightKg, activityLevel);

  return {
    bmi,
    bmiCategory: bmiCategory.category,
    bmiRisk: bmiCategory.risk,
    bmr,
    tdee,
    targetCalories,
    macros,
    idealWeight,
    waterIntake
  };
};

module.exports = {
  calculateBMI,
  getBMICategory,
  calculateBMR,
  calculateTDEE,
  calculateTargetCalories,
  calculateMacros,
  calculateIdealWeightRange,
  calculateWaterIntake,
  calculateHealthMetrics
};
