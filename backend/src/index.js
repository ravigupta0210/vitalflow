require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
const compression = require('compression');

// Import routes
const authRoutes = require('./routes/authRoutes');
const onboardingRoutes = require('./routes/onboardingRoutes');
const profileRoutes = require('./routes/profileRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const workoutRoutes = require('./routes/workoutRoutes');
const dietRoutes = require('./routes/dietRoutes');
const chatRoutes = require('./routes/chatRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const otpRoutes = require('./routes/otpRoutes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Initialize database
const db = require('./config/database');

// Initialize passport
require('./config/passport');

// Initialize SMS service
const { initializeSMSService } = require('./services/smsService');
initializeSMSService();

const app = express();
const PORT = process.env.PORT || 5001;

// Compression middleware - gzip all responses
app.use(compression({
  level: 6,
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Security middleware - relaxed for development/mobile testing
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for mobile compatibility
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false, // Allow OAuth redirects over HTTP in dev
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Cache control middleware
const cacheControl = (duration) => (req, res, next) => {
  if (req.method === 'GET') {
    // Use private cache with short duration for user-specific data
    res.set('Cache-Control', `private, no-store, max-age=0, must-revalidate`);
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  } else {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  }
  next();
};

// ETag support for efficient caching
app.set('etag', 'strong');

// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL].filter(Boolean)
  : true; // Allow all origins in development

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Expires'],
  exposedHeaders: ['Content-Length', 'X-Request-Id']
}));

// Handle preflight requests explicitly
app.options('*', cors());

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: { success: false, message: 'Too many requests, please try again later.' }
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 AI requests per minute
  message: { success: false, message: 'Too many AI requests. Please wait a minute.' }
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Initialize passport
app.use(passport.initialize());

// Apply rate limiting
app.use('/api', generalLimiter);
app.use('/api/workouts/generate', aiLimiter);
app.use('/api/diet/generate', aiLimiter);
app.use('/api/chat', aiLimiter);
app.use('/api/dashboard/insights', aiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'VitalFlow API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes - all user-specific data should not be cached
// The cacheControl middleware now sets no-cache by default for security
app.use('/api/auth', authRoutes);
app.use('/api/auth/otp', otpRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/diet', dietRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use(errorHandler);

// Start server - bind to 0.0.0.0 to accept connections from mobile devices
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║                                               ║
  ║   🏃 VitalFlow API Server                     ║
  ║   ───────────────────────────────────────     ║
  ║   Status:  Running                            ║
  ║   Port:    ${PORT}                              ║
  ║   Mode:    ${process.env.NODE_ENV || 'development'}                       ║
  ║   Host:    0.0.0.0 (accessible from network)  ║
  ║                                               ║
  ╚═══════════════════════════════════════════════╝
  `);
});

module.exports = app;
