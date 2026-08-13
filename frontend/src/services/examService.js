import API from './api';

export const completeOnboardingApi = async (onboardingData) => {
  const response = await API.post('/onboarding', onboardingData);
  return response.data;
};

export const getExamsApi = async () => {
  const response = await API.get('/exams');
  return response.data;
};

export const getExamByIdApi = async (id) => {
  const response = await API.get(`/exams/${id}`);
  return response.data;
};

export const createExamApi = async (examData) => {
  const response = await API.post('/exams', examData);
  return response.data;
};

export const createSubjectApi = async (subjectData) => {
  const response = await API.post('/subjects', subjectData);
  return response.data;
};

export const addTopicApi = async (topicData) => {
  const response = await API.post('/topics', topicData);
  return response.data;
};
