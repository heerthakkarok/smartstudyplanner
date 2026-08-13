const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  registerUser,
  loginUser,
  getGoogleAuthUrl,
  googleCallback,
  googleLogin,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  logoutUser,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Rate limiting middleware for sensitive auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // max 50 password reset requests per 15 minutes
  message: {
    success: false,
    message: 'Too many password reset attempts. Please wait 15 minutes before trying again.',
  },
});

// Auth Routes (Signup & Login have ZERO OTPs)
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);

// Google OAuth Redirect Endpoints
router.get('/google', getGoogleAuthUrl);
router.get('/google/callback', googleCallback);
router.post('/google', googleLogin);

// Forgot Password Flow (EXCLUSIVE 6-Digit OTP via Nodemailer)
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/verify-reset-code', authLimiter, verifyResetCode);
router.post('/reset-password', authLimiter, resetPassword);

router.post('/logout', logoutUser);
router.get('/me', protect, getMe);

module.exports = router;
