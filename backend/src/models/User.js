const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return this.authProvider === 'local';
      },
      validate: {
        validator: function (val) {
          if (this.authProvider === 'google' && !val) return true;
          return typeof val === 'string' && val.length >= 8;
        },
        message: 'Password must be at least 8 characters long',
      },
    },
    googleId: {
      type: String,
    },
    profileImage: {
      type: String,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    verificationCodeHash: {
      type: String,
    },
    verificationCodeExpire: {
      type: Date,
    },
    verificationAttempts: {
      type: Number,
      default: 0,
    },
    resetPasswordCodeHash: {
      type: String,
    },
    resetPasswordExpire: {
      type: Date,
    },
    resetPasswordAttempts: {
      type: Number,
      default: 0,
    },
    preferences: {
      type: Object,
      default: {},
    },
    dailyStudyHours: {
      type: Number,
      default: 4,
      min: [1, 'Daily study hours must be at least 1'],
      max: [24, 'Daily study hours cannot exceed 24'],
    },
    preferredStudyTimes: {
      type: [String],
      enum: ['morning', 'afternoon', 'evening', 'night'],
      default: ['evening'],
    },
    isOnboarded: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  // Prevent double-hashing if password is already a bcrypt hash
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password || !enteredPassword) return false;

  // Handle un-hashed legacy passwords in database
  if (!this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
    return enteredPassword === this.password;
  }

  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (err) {
    console.error('[BCRYPT MATCH ERROR] Failed to compare password hash:', err.message);
    return false;
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User;
