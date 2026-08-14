const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendResetCodeEmail } = require('../services/emailService');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  validateInput,
} = require('../utils/validation');

// Helper to validate password criteria
const validatePasswordStrict = (password) => {
  if (!password || typeof password !== 'string') return false;
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;
};

// @desc    Register a new user (Local) — NO OTP REQUIRED
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { isValid, error, data } = validateInput(registerSchema, req.body);
    if (!isValid) {
      return res.status(400).json({ success: false, message: error });
    }

    const { name, email, password } = data;
    const cleanEmail = email.toLowerCase().trim();

    if (!validatePasswordStrict(password)) {

      return res.status(400).json({
        success: false,
        message:
          'Password does not meet required security criteria (at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character).',
      });
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists. Please log in.',
      });
    }

    // Create user directly (isEmailVerified: true, NO OTP)
    const user = await User.create({
      name,
      email: cleanEmail,
      password,
      authProvider: 'local',
      isEmailVerified: true,
      isOnboarded: false,
    });

    const token = generateToken(user._id);
    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        dailyStudyHours: user.dailyStudyHours,
        preferredStudyTimes: user.preferredStudyTimes || ['evening'],
        isOnboarded: user.isOnboarded,
      },
    });
  } catch (error) {
    console.error('Register Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error during registration' });
  }
};

// @desc    Authenticate user & get token (Local) — NO OTP REQUIRED
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { isValid, error, data } = validateInput(loginSchema, req.body);
    if (!isValid) {
      return res.status(400).json({ success: false, message: error });
    }

    const { email, password } = data;
    const cleanEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found. Please create an account.' });
    }

    if (await user.matchPassword(password)) {
      const token = generateToken(user._id);
      return res.json({
        success: true,
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          dailyStudyHours: user.dailyStudyHours,
          preferredStudyTimes: user.preferredStudyTimes || ['evening'],
          isOnboarded: user.isOnboarded,
        },
      });
    } else {
      return res.status(401).json({ success: false, message: 'Incorrect email or password.' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error during login' });
  }
};

// @desc    Initiate Real Google OAuth 2.0 Authorization Flow
// @route   GET /api/auth/google
// @access  Public
const getGoogleAuthUrl = (req, res) => {
  const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';

  if (
    !clientId ||
    clientId.trim() === '' ||
    clientId.includes('your_google_client_id') ||
    !clientSecret ||
    clientSecret.trim() === '' ||
    clientSecret.includes('your_google_client_secret')
  ) {
    console.warn('[GOOGLE OAUTH] Missing real GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in backend .env file');
    return res.redirect(`${frontendUrl}/login?error=google_config_missing`);
  }

  try {
    const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      prompt: 'select_account',
    });

    return res.redirect(authUrl);
  } catch (error) {
    console.error('Error generating Google Auth URL:', error);
    return res.redirect(`${frontendUrl}/login?error=google_init_failed`);
  }
};

// @desc    Google OAuth Callback Handler
// @route   GET /api/auth/google/callback
// @access  Public
const googleCallback = async (req, res) => {
  const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const { code, error } = req.query;

  if (error || !code) {
    console.warn('Google auth canceled or error parameter received:', error);
    return res.redirect(`${frontendUrl}/login?error=google_auth_canceled`);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';

    const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const userinfoRes = await oauth2Client.request({
      url: 'https://www.googleapis.com/oauth2/v3/userinfo',
    });
    const profile = userinfoRes.data;

    const { email, name, sub: googleId, picture: profileImage } = profile;
    if (!email) {
      return res.redirect(`${frontendUrl}/login?error=google_email_missing`);
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      user = await User.create({
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        googleId,
        profileImage,
        authProvider: 'google',
        isEmailVerified: true,
        isOnboarded: false,
      });
    } else {
      let modified = false;
      if (!user.googleId) {
        user.googleId = googleId;
        modified = true;
      }
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        modified = true;
      }
      if (profileImage && !user.profileImage) {
        user.profileImage = profileImage;
        modified = true;
      }
      if (modified) await user.save();
    }

    const token = generateToken(user._id);

    return res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  } catch (err) {
    console.error('Google Callback Processing Error:', err);
    return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
  }
};

// @desc    Google OAuth Authentication (POST JSON Handler)
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res) => {
  try {
    const { email, name, googleId, profileImage } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ success: false, message: 'Google email and account ID are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      user = await User.create({
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        googleId,
        profileImage,
        authProvider: 'google',
        isEmailVerified: true,
        isOnboarded: false,
      });
    } else {
      let modified = false;
      if (!user.googleId) {
        user.googleId = googleId;
        modified = true;
      }
      if (!user.isEmailVerified) {
        user.isEmailVerified = true;
        modified = true;
      }
      if (modified) await user.save();
    }

    const token = generateToken(user._id);

    return res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        dailyStudyHours: user.dailyStudyHours,
        preferredStudyTimes: user.preferredStudyTimes || ['evening'],
        isOnboarded: user.isOnboarded,
      },
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Google authentication failed' });
  }
};

// @desc    Forgot Password - Request 6-Digit Password Reset OTP Code via Nodemailer
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { isValid, error, data } = validateInput(forgotPasswordSchema, req.body);
    if (!isValid) {
      return res.status(400).json({ success: false, message: error });
    }

    const { email } = data;
    const cleanEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account was found with this email.',
      });
    }

    // Generate cryptographically secure random 6-digit OTP code
    const resetCode = crypto.randomInt(100000, 1000000).toString();
    const salt = await bcrypt.genSalt(10);
    const codeHash = await bcrypt.hash(resetCode, salt);

    user.resetPasswordCodeHash = codeHash;
    user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.resetPasswordAttempts = 0;
    await user.save();

    try {
      await sendResetCodeEmail(cleanEmail, user.name, resetCode);
    } catch (mailError) {
      console.error('Failed to send reset code email via Nodemailer:', mailError);
      return res.status(500).json({
        success: false,
        message: 'Unable to send password reset email. Please try again.',
      });
    }

    return res.json({
      success: true,
      message: 'Verification code sent to your email.',
      email: cleanEmail,
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server Error processing password reset request' });
  }
};

// @desc    Verify Reset Password 6-Digit OTP Code
// @route   POST /api/auth/verify-reset-code
// @access  Public
const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and verification code are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user || !user.resetPasswordCodeHash || !user.resetPasswordExpire) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
    }

    if (new Date() > user.resetPasswordExpire) {
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new code.' });
    }

    if (user.resetPasswordAttempts >= 5) {
      return res.status(400).json({ success: false, message: 'Too many failed attempts. Please request a new code.' });
    }

    user.resetPasswordAttempts += 1;

    const isMatch = await bcrypt.compare(code.trim(), user.resetPasswordCodeHash);
    if (!isMatch) {
      await user.save();
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    return res.json({
      success: true,
      message: 'Code verified successfully',
    });
  } catch (error) {
    console.error('Verify Code Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// @desc    Reset Password with Verified OTP Code & Auto-Login
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { isValid, error, data } = validateInput(resetPasswordSchema, req.body);
    if (!isValid) {
      return res.status(400).json({ success: false, message: error });
    }

    const { email, code, newPassword } = data;
    const cleanEmail = email.toLowerCase().trim();

    if (!validatePasswordStrict(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet required security criteria (at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character).',
      });
    }

    const user = await User.findOne({ email: cleanEmail });

    if (!user || !user.resetPasswordCodeHash || !user.resetPasswordExpire) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
    }

    if (new Date() > user.resetPasswordExpire) {
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new code.' });
    }

    const isMatch = await bcrypt.compare(code.trim(), user.resetPasswordCodeHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    user.password = newPassword; // Pre-save hook hashes password
    user.resetPasswordCodeHash = undefined;
    user.resetPasswordExpire = undefined;
    user.resetPasswordAttempts = 0;
    user.isEmailVerified = true;
    await user.save();

    const token = generateToken(user._id);

    return res.json({
      success: true,
      message: 'Password reset successfully.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        dailyStudyHours: user.dailyStudyHours,
        preferredStudyTimes: user.preferredStudyTimes || ['evening'],
        isOnboarded: user.isOnboarded,
      },
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server Error resetting password' });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = async (req, res) => {
  return res.json({
    success: true,
    message: 'User logged out successfully',
  });
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get Me Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error fetching user profile' });
  }
};

module.exports = {
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
};
