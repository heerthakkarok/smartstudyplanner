import API from './api';

export const generateQuizApi = async (quizParams) => {
  const response = await API.post('/quiz/generate', quizParams);
  return response.data;
};

export const submitQuizApi = async (submissionData) => {
  const response = await API.post('/quiz/submit', submissionData);
  return response.data;
};

export const getQuizHistoryApi = async () => {
  const response = await API.get('/quiz/history');
  return response.data;
};

export const getAIRecommendationsApi = async () => {
  const response = await API.get('/ai/recommendations');
  return response.data;
};
