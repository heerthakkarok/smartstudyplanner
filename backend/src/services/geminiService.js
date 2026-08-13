const { GoogleGenAI } = require('@google/genai');

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '') {
    return null;
  }
  try {
    return new GoogleGenAI({ apiKey });
  } catch (error) {
    console.error('GoogleGenAI Init Error:', error.message);
    return null;
  }
};

const getModelName = () => {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
};

const cleanJsonResponse = (text) => {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned;
};

// Procedural Fallback & Filler Question Generator
const generateFallbackQuestions = (subjectName, topicName, difficulty, numQuestions) => {
  const baseTemplates = [
    {
      question: `Which fundamental principle is most critical when analyzing ${topicName} in ${subjectName}?`,
      options: [
        `Optimal time and space complexity balancing`,
        `Ignoring edge cases during initial implementation`,
        `Relying solely on brute-force execution`,
        `Static memory allocation without verification`,
      ],
      correctAnswer: `Optimal time and space complexity balancing`,
      explanation: `Properly balancing resource utilization and constraints is essential when dealing with ${topicName}.`,
    },
    {
      question: `What is a primary characteristic of ${topicName} under ${difficulty} difficulty scenarios?`,
      options: [
        `Increased structural complexity and non-trivial edge conditions`,
        `Constant O(1) processing efficiency under all conditions`,
        `Complete elimination of data dependence`,
        `Automatic hardware optimization without algorithms`,
      ],
      correctAnswer: `Increased structural complexity and non-trivial edge conditions`,
      explanation: `${difficulty.toUpperCase()} level topics require thorough evaluation of structural and edge constraints.`,
    },
    {
      question: `When implementing solutions for ${topicName}, what is the recommended best practice?`,
      options: [
        `Modular decomposition and iterative testing`,
        `Global state mutation across threads`,
        `Hardcoding fixed values for dynamic inputs`,
        `Bypassing error handling and validation`,
      ],
      correctAnswer: `Modular decomposition and iterative testing`,
      explanation: `Modular code design ensures maintainability and ease of debugging when mastering ${topicName}.`,
    },
    {
      question: `How does ${topicName} directly impact overall performance in ${subjectName}?`,
      options: [
        `It governs execution efficiency and memory footprint`,
        `It has zero measurable impact on system runtime`,
        `It only affects graphical user interface rendering`,
        `It converts dynamic code directly into database tables`,
      ],
      correctAnswer: `It governs execution efficiency and memory footprint`,
      explanation: `Understanding ${topicName} ensures algorithms operate efficiently with minimal overhead.`,
    },
    {
      question: `Which common pitfall should be avoided when solving problems related to ${topicName}?`,
      options: [
        `Failing to account for boundary and null conditions`,
        `Writing clear documentation and unit tests`,
        `Using descriptive variable naming conventions`,
        `Refactoring complex logic into smaller functions`,
      ],
      correctAnswer: `Failing to account for boundary and null conditions`,
      explanation: `Boundary errors are the leading cause of bugs when implementing ${topicName}.`,
    },
  ];

  const questions = [];
  for (let i = 0; i < numQuestions; i++) {
    const base = baseTemplates[i % baseTemplates.length];
    const qNum = i + 1;
    questions.push({
      question: i < 5 ? base.question : `[Q${qNum}] Regarding ${topicName} in ${subjectName}, which statement regarding ${difficulty} applications is correct?`,
      options: base.options,
      correctAnswer: base.correctAnswer,
      explanation: base.explanation,
    });
  }

  return questions;
};

// 1. Generate Quiz Questions (FIXED QUESTION COUNT)
const generateQuizQuestions = async (subjectName, topicName, difficulty = 'medium', numQuestions = 5) => {
  const targetCount = Number(numQuestions) || 5;
  const ai = getGeminiClient();

  if (!ai) {
    console.log(`GEMINI_API_KEY missing or default. Generating ${targetCount} structured quiz questions.`);
    return generateFallbackQuestions(subjectName, topicName, difficulty, targetCount);
  }

  const prompt = `You are an expert academic tutor. Generate a multiple-choice quiz (MCQ) for students studying "${subjectName}", specifically on the topic "${topicName}".
Difficulty level: ${difficulty}.
CRITICAL INSTRUCTION: You MUST generate EXACTLY ${targetCount} distinct questions. Return a JSON array containing EXACTLY ${targetCount} question objects.

Return ONLY a valid JSON array of objects with NO markdown explanation or extra text outside the JSON array.
Each object must have:
- "question": string
- "options": array of 4 distinct string choices
- "correctAnswer": exact string matching one of the options
- "explanation": string explaining why the correct answer is right.

JSON Output:`;

  try {
    const response = await ai.models.generateContent({
      model: getModelName(),
      contents: prompt,
    });

    const rawText = response.text;
    const jsonText = cleanJsonResponse(rawText);
    let questions = JSON.parse(jsonText);

    if (Array.isArray(questions) && questions.length > 0) {
      // Top up if Gemini returns fewer questions than requested
      if (questions.length < targetCount) {
        console.log(`Gemini returned ${questions.length} questions out of ${targetCount} requested. Topping up remaining questions.`);
        const extraNeeded = targetCount - questions.length;
        const filler = generateFallbackQuestions(subjectName, topicName, difficulty, extraNeeded);
        questions = [...questions, ...filler];
      }
      return questions.slice(0, targetCount);
    } else {
      throw new Error('Parsed response is not a valid question array');
    }
  } catch (error) {
    console.error('Gemini Quiz Generation Error:', error.message);
    return generateFallbackQuestions(subjectName, topicName, difficulty, targetCount);
  }
};

// 2. Analyze Quiz Performance
const analyzeQuizPerformance = async (subjectName, topicName, score, totalQuestions, userAnswers) => {
  const ai = getGeminiClient();
  const accuracy = Math.round((score / totalQuestions) * 100);

  if (!ai) {
    if (accuracy >= 80) {
      return `Outstanding performance! You scored ${score}/${totalQuestions} (${accuracy}% accuracy) in ${topicName}. You have a strong grasp of core concepts. Next, try challenging yourself with higher difficulty topics.`;
    } else if (accuracy >= 50) {
      return `Good effort! You scored ${score}/${totalQuestions} (${accuracy}% accuracy) in ${topicName}. You understand the basic principles, but review the explanations for missed questions to solidify your understanding.`;
    } else {
      return `Needs attention! You scored ${score}/${totalQuestions} (${accuracy}% accuracy) in ${topicName}. We recommend revisiting the foundational notes for ${subjectName} before retaking this quiz.`;
    }
  }

  const prompt = `Analyze this student's quiz performance:
Subject: "${subjectName}"
Topic: "${topicName}"
Score: ${score} out of ${totalQuestions} (${accuracy}% accuracy)
User Answers Summary: ${JSON.stringify(userAnswers)}

Provide a concise, encouraging 2-3 paragraph performance analysis explaining:
1. What the student mastered well.
2. Specific key concepts they should review based on missed questions.
3. Actionable next steps for study planning.`;

  try {
    const response = await ai.models.generateContent({
      model: getModelName(),
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error('Gemini Performance Analysis Error:', error.message);
    return `You completed the quiz for ${topicName} with ${accuracy}% accuracy. Keep practicing to build complete mastery!`;
  }
};

// 3. Identify Weak Topics (AI Analysis)
const identifyWeakTopicsAI = async (subjectData, quizHistory) => {
  const ai = getGeminiClient();

  if (!ai) {
    return [
      {
        topicName: 'Review Missed Quiz Topics',
        reason: 'Topics with quiz accuracy below 60% require immediate revision.',
      },
    ];
  }

  const prompt = `Analyze this student's subjects and quiz history:
Subjects & Topics: ${JSON.stringify(subjectData)}
Quiz History: ${JSON.stringify(quizHistory)}

Identify the top 3 weak topics and return ONLY a JSON array of objects:
[{"topicName": "...", "subjectName": "...", "reason": "..."}]

JSON Output:`;

  try {
    const response = await ai.models.generateContent({
      model: getModelName(),
      contents: prompt,
    });
    const cleaned = cleanJsonResponse(response.text);
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Gemini Weak Topics Identification Error:', error.message);
    return [];
  }
};

// 4. Recommend Next Topics to Study
const recommendNextTopics = async (examName, daysRemaining, dailyStudyHours, subjects, recentQuizzes) => {
  const ai = getGeminiClient();

  if (!ai) {
    return [
      {
        title: 'Focus on Hard Topics Early',
        recommendation: 'Prioritize topics marked as Hard while you have sufficient preparation days.',
      },
      {
        title: 'Daily Practice Consistency',
        recommendation: `Aim to complete your ${dailyStudyHours} daily study hours to maintain momentum.`,
      },
    ];
  }

  const prompt = `You are a personal AI study planner for an upcoming exam: "${examName}".
Days Remaining: ${daysRemaining}
Daily Available Hours: ${dailyStudyHours}
Subjects & Topics Overview: ${JSON.stringify(subjects)}
Recent Quiz Accuracy: ${JSON.stringify(recentQuizzes)}

Generate 3 personalized study recommendations for what the student should study next.
Return ONLY a valid JSON array:
[{"title": "...", "recommendation": "...", "priority": "high|medium"}]

JSON Output:`;

  try {
    const response = await ai.models.generateContent({
      model: getModelName(),
      contents: prompt,
    });
    const cleaned = cleanJsonResponse(response.text);
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Gemini Study Recommendations Error:', error.message);
    return [
      {
        title: 'Consolidate Core Subjects',
        recommendation: 'Review high-weighted topics to ensure maximum score retention.',
        priority: 'high',
      },
    ];
  }
};

module.exports = {
  generateQuizQuestions,
  analyzeQuizPerformance,
  identifyWeakTopicsAI,
  recommendNextTopics,
};
