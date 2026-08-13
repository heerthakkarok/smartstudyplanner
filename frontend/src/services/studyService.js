import API from './api';

export const generateStudyPlanApi = async (examId) => {
  const response = await API.post('/study-plan/generate', { examId });
  return response.data;
};

export const adaptStudyPlanApi = async (examId) => {
  const response = await API.post('/study-plan/adapt', { examId });
  return response.data;
};

export const getStudyPlanApi = async () => {
  const response = await API.get('/study-plan');
  return response.data;
};

export const downloadPDFPlanApi = async () => {
  const response = await API.get('/study-plan/pdf', { responseType: 'blob' });
  return response.data;
};

export const getTodayTasksApi = async () => {
  const response = await API.get('/tasks/today');
  return response.data;
};

export const getUpcomingTasksApi = async () => {
  const response = await API.get('/tasks/upcoming');
  return response.data;
};

export const getOverdueTasksApi = async () => {
  const response = await API.get('/tasks/overdue');
  return response.data;
};

export const updateTaskStatusApi = async (taskId, status) => {
  const response = await API.put(`/tasks/${taskId}/status`, { status });
  return response.data;
};

export const updateTaskApi = async (taskId, taskData) => {
  const response = await API.put(`/tasks/${taskId}`, taskData);
  return response.data;
};

export const deleteTaskApi = async (taskId) => {
  const response = await API.delete(`/tasks/${taskId}`);
  return response.data;
};
