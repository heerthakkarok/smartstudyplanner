import API from './api';

export const getProfileApi = async () => {
  const response = await API.get('/profile');
  return response.data;
};

export const updateProfileApi = async (profileData) => {
  const response = await API.patch('/profile', profileData);
  return response.data;
};

export const addSubjectApi = async (subjectData) => {
  const response = await API.post('/profile/subjects', subjectData);
  return response.data;
};

export const updateSubjectApi = async (id, subjectData) => {
  const response = await API.patch(`/profile/subjects/${id}`, subjectData);
  return response.data;
};

export const deleteSubjectApi = async (id) => {
  const response = await API.delete(`/profile/subjects/${id}`);
  return response.data;
};

export const addTopicApi = async (subjectId, topicData) => {
  const response = await API.post(`/profile/subjects/${subjectId}/topics`, topicData);
  return response.data;
};

export const updateTopicApi = async (id, topicData) => {
  const response = await API.patch(`/profile/topics/${id}`, topicData);
  return response.data;
};

export const deleteTopicApi = async (id) => {
  const response = await API.delete(`/profile/topics/${id}`);
  return response.data;
};
