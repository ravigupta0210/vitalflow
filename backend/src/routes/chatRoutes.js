const express = require('express');
const router = express.Router();
const { authenticateJWT, requireOnboarding } = require('../middleware/auth');
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// All chat routes require authentication and onboarding
router.use(authenticateJWT, requireOnboarding);

// Get all conversations
router.get('/conversations', (req, res) => {
  try {
    const conversations = db.prepare(`
      SELECT c.*,
        (SELECT content FROM chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
      FROM chat_conversations c
      WHERE c.user_id = ?
      ORDER BY c.updated_at DESC
    `).all(req.user.id);

    res.json({
      success: true,
      data: conversations.map(c => ({
        id: c.id,
        title: c.title || 'New Conversation',
        lastMessage: c.last_message,
        isActive: Boolean(c.is_active),
        createdAt: c.created_at,
        updatedAt: c.updated_at
      }))
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, message: 'Failed to get conversations' });
  }
});

// Create new conversation
router.post('/conversations', (req, res) => {
  try {
    const { title } = req.body;

    const conversationId = uuidv4();
    db.prepare(`
      INSERT INTO chat_conversations (id, user_id, title, is_active)
      VALUES (?, ?, ?, 1)
    `).run(conversationId, req.user.id, title || null);

    res.status(201).json({
      success: true,
      data: {
        id: conversationId,
        title: title || 'New Conversation'
      }
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ success: false, message: 'Failed to create conversation' });
  }
});

// Get conversation with messages
router.get('/conversations/:id', (req, res) => {
  try {
    const conversation = db.prepare(`
      SELECT * FROM chat_conversations WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const messages = db.prepare(`
      SELECT * FROM chat_messages WHERE conversation_id = ?
      ORDER BY created_at ASC
    `).all(conversation.id);

    res.json({
      success: true,
      data: {
        id: conversation.id,
        title: conversation.title || 'New Conversation',
        messages: messages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.created_at
        }))
      }
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ success: false, message: 'Failed to get conversation' });
  }
});

// Send message to conversation
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const conversation = db.prepare(`
      SELECT * FROM chat_conversations WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Save user message
    db.prepare(`
      INSERT INTO chat_messages (id, conversation_id, role, content)
      VALUES (?, ?, 'user', ?)
    `).run(uuidv4(), conversation.id, message);

    // Get user context for AI
    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(req.user.id);
    const goals = db.prepare('SELECT goal_type FROM health_goals WHERE user_id = ?').all(req.user.id);
    const conditions = db.prepare('SELECT condition_type FROM medical_conditions WHERE user_id = ?').all(req.user.id);

    // Get conversation history (last 10 messages)
    const history = db.prepare(`
      SELECT role, content FROM chat_messages WHERE conversation_id = ?
      ORDER BY created_at DESC LIMIT 10
    `).all(conversation.id).reverse();

    // Call Python AI service
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

    try {
      const response = await axios.post(`${AI_SERVICE_URL}/chat`, {
        message,
        context: {
          profile: {
            age: profile?.age,
            gender: profile?.gender,
            weight: profile?.weight_kg,
            height: profile?.height_cm,
            activityLevel: profile?.activity_level,
            dietType: profile?.diet_type,
            bmi: profile?.bmi,
            targetCalories: profile?.target_calories
          },
          goals: goals.map(g => g.goal_type),
          conditions: conditions.map(c => c.condition_type)
        },
        history: history.map(h => ({
          role: h.role,
          content: h.content
        }))
      });

      const aiResponse = response.data.response;

      // Save AI response
      const aiMessageId = uuidv4();
      db.prepare(`
        INSERT INTO chat_messages (id, conversation_id, role, content)
        VALUES (?, ?, 'assistant', ?)
      `).run(aiMessageId, conversation.id, aiResponse);

      // Update conversation timestamp
      db.prepare(`
        UPDATE chat_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `).run(conversation.id);

      // Auto-generate title from first message if not set
      if (!conversation.title && history.length <= 2) {
        const title = message.length > 50 ? message.substring(0, 50) + '...' : message;
        db.prepare('UPDATE chat_conversations SET title = ? WHERE id = ?').run(title, conversation.id);
      }

      res.json({
        success: true,
        data: {
          message: {
            id: aiMessageId,
            role: 'assistant',
            content: aiResponse
          }
        }
      });
    } catch (aiError) {
      // If AI service is unavailable, provide a fallback response
      console.error('AI service error:', aiError.message);

      const fallbackResponse = "I apologize, but I'm having trouble connecting to my AI system right now. Please try again in a moment, or feel free to explore the workout and diet sections of the app.";

      const aiMessageId = uuidv4();
      db.prepare(`
        INSERT INTO chat_messages (id, conversation_id, role, content)
        VALUES (?, ?, 'assistant', ?)
      `).run(aiMessageId, conversation.id, fallbackResponse);

      res.json({
        success: true,
        data: {
          message: {
            id: aiMessageId,
            role: 'assistant',
            content: fallbackResponse
          }
        }
      });
    }
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

// Get suggested questions
router.get('/suggestions', (req, res) => {
  try {
    const goals = db.prepare('SELECT goal_type FROM health_goals WHERE user_id = ?').all(req.user.id);
    const goalTypes = goals.map(g => g.goal_type);

    const suggestions = [];

    // General suggestions
    suggestions.push(
      { category: 'general', question: 'What should I eat before a workout?' },
      { category: 'general', question: 'How much protein do I need daily?' },
      { category: 'general', question: 'How can I improve my sleep quality?' }
    );

    // Goal-specific suggestions
    if (goalTypes.includes('weight_loss')) {
      suggestions.push(
        { category: 'weight_loss', question: 'What are the best exercises for fat loss?' },
        { category: 'weight_loss', question: 'How can I control my cravings?' }
      );
    }

    if (goalTypes.includes('muscle_gain')) {
      suggestions.push(
        { category: 'muscle_gain', question: 'How do I maximize muscle growth?' },
        { category: 'muscle_gain', question: 'What is progressive overload?' }
      );
    }

    if (goalTypes.includes('diabetes')) {
      suggestions.push(
        { category: 'diabetes', question: 'What foods should I avoid for blood sugar control?' },
        { category: 'diabetes', question: 'When is the best time to exercise?' }
      );
    }

    res.json({
      success: true,
      data: suggestions.slice(0, 6) // Return max 6 suggestions
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ success: false, message: 'Failed to get suggestions' });
  }
});

// Quick question (one-off, no conversation)
router.post('/quick-question', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ success: false, message: 'Question is required' });
    }

    // Get user context
    const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(req.user.id);
    const goals = db.prepare('SELECT goal_type FROM health_goals WHERE user_id = ?').all(req.user.id);

    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

    try {
      const response = await axios.post(`${AI_SERVICE_URL}/chat`, {
        message: question,
        context: {
          profile: {
            age: profile?.age,
            gender: profile?.gender,
            dietType: profile?.diet_type,
            activityLevel: profile?.activity_level
          },
          goals: goals.map(g => g.goal_type)
        },
        history: []
      });

      res.json({
        success: true,
        data: {
          answer: response.data.response
        }
      });
    } catch (aiError) {
      res.json({
        success: true,
        data: {
          answer: "I apologize, but I couldn't process your question at the moment. Please try again or start a conversation for a more detailed response."
        }
      });
    }
  } catch (error) {
    console.error('Quick question error:', error);
    res.status(500).json({ success: false, message: 'Failed to process question' });
  }
});

// Delete conversation
router.delete('/conversations/:id', (req, res) => {
  try {
    const result = db.prepare(`
      DELETE FROM chat_conversations WHERE id = ? AND user_id = ?
    `).run(req.params.id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    res.json({
      success: true,
      message: 'Conversation deleted'
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete conversation' });
  }
});

module.exports = router;
