const { z } = require('zod');

// Strong Password Regex: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_-])[A-Za-z\d@$!%*?&^#()_-]{8,}$/;

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().regex(
    strongPasswordRegex,
    'Password must be at least 8 characters long and contain an uppercase letter, lowercase letter, number, and special character'
  ),
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  code: z.string().length(6, 'Verification code must be 6 digits'),
  newPassword: z.string().regex(
    strongPasswordRegex,
    'New password must be at least 8 characters long and contain an uppercase letter, lowercase letter, number, and special character'
  ),
});

const examSchema = z.object({
  name: z.string().min(1, 'Exam name is required'),
  examDate: z.string().min(1, 'Exam date is required'),
  targetScore: z.coerce.number().optional().default(90),
  dailyStudyHours: z.coerce.number().min(1).max(24).default(4),
  preferredStudyTimes: z.array(z.enum(['morning', 'afternoon', 'evening', 'night'])).min(1).default(['evening']),
});

const subjectSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  name: z.string().min(1, 'Subject name is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
});

const topicSchema = z.object({
  subjectId: z.string().min(1, 'Subject ID is required'),
  name: z.string().min(1, 'Topic name is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  estimatedHours: z.coerce.number().min(0.5).default(2),
});

const onboardingSchema = z.object({
  examName: z.string().min(1, 'Exam name is required'),
  examDate: z.string().min(1, 'Exam date is required'),
  targetScore: z.coerce.number().min(0).max(100).optional().default(90),
  dailyStudyHours: z.coerce.number().min(1).max(24).default(4),
  preferredStudyTimes: z.array(z.enum(['morning', 'afternoon', 'evening', 'night'])).min(1, 'Select at least one study time preference').default(['evening']),
  subjects: z.array(
    z.object({
      name: z.string().min(1, 'Subject name is required'),
      difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
      topics: z.array(
        z.object({
          name: z.string().min(1, 'Topic name is required'),
          difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
          estimatedHours: z.coerce.number().min(0.5).default(2),
        })
      ).min(1, 'Each subject must have at least 1 topic'),
    })
  ).min(1, 'At least 1 subject is required'),
});

const validateInput = (schema, data) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errorMessages = result.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
    return { isValid: false, error: errorMessages };
  }
  return { isValid: true, data: result.data };
};

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  examSchema,
  subjectSchema,
  topicSchema,
  onboardingSchema,
  validateInput,
  strongPasswordRegex,
};
