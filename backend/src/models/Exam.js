const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Exam name is required'],
      trim: true,
    },
    examDate: {
      type: Date,
      required: [true, 'Exam date is required'],
    },
    targetScore: {
      type: Number,
      default: 90,
    },
    dailyStudyHours: {
      type: Number,
      required: true,
      default: 4,
      min: 1,
      max: 24,
    },
    preferredStudyTimes: {
      type: [String],
      enum: ['morning', 'afternoon', 'evening', 'night'],
      default: ['evening'],
    },
  },
  {
    timestamps: true,
  }
);

const Exam = mongoose.model('Exam', examSchema);

module.exports = Exam;
