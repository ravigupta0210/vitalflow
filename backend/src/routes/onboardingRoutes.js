const express = require('express');
const router = express.Router();
const onboardingController = require('../controllers/onboardingController');
const { authenticateJWT } = require('../middleware/auth');

// All onboarding routes require authentication
router.use(authenticateJWT);

// Get onboarding status
router.get('/status', onboardingController.getStatus);

// Submit onboarding steps
router.post('/step/1', onboardingController.submitStep1);
router.post('/step/2', onboardingController.submitStep2);
router.post('/step/3', onboardingController.submitStep3);
router.post('/step/4', onboardingController.submitStep4);

// Generate AI-powered personalized questions based on user profile and goals
router.get('/generate-questions', onboardingController.generateAIQuestions);

// Get conditional questions for a specific goal (legacy fallback)
router.get('/questions/:goalType', onboardingController.getConditionalQuestions);

// Complete onboarding
router.post('/complete', onboardingController.completeOnboarding);

module.exports = router;
