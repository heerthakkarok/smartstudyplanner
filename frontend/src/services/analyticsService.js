import API from './api';

export const getDashboardStatsApi = async () => {
  const response = await API.get('/dashboard/stats');
  return response.data;
};
