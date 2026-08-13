const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Explicitly load .env file from the backend root directory
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

console.log('[ENV CONFIG] Loaded environment file:', envPath);
console.log('[ENV CONFIG] GOOGLE_CLIENT_ID loaded:', Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID.trim()));
console.log('[ENV CONFIG] GOOGLE_CLIENT_SECRET loaded:', Boolean(process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CLIENT_SECRET.trim()));

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const examRoutes = require('./routes/examRoutes');
const taskRoutes = require('./routes/taskRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const quizRoutes = require('./routes/quizRoutes');
const profileRoutes = require('./routes/profileRoutes');
const { initMonthlyReportCron } = require('./services/progressService');
const { verifyEmailTransporter } = require('./services/emailService');

// Connect to MongoDB
connectDB();

// Verify Nodemailer Email Transporter
verifyEmailTransporter();

// Initialize Cron Jobs
initMonthlyReportCron();

const app = express();

// CORS Configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Base Route / Health Check
app.get('/', (req, res) => {
  res.json({
    message: 'Smart Study Planner API is running',
    version: '1.0.0',
    status: 'healthy',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api', examRoutes);
app.use('/api', taskRoutes);
app.use('/api', analyticsRoutes);
app.use('/api', quizRoutes);

// 404 Route Handler
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle Port Conflicts Gracefully During Nodemon Restarts
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[SERVER ERROR] Port ${PORT} is already in use. Exiting process so nodemon can restart...`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});

// Graceful process shutdown
process.on('SIGINT', () => {
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});
