import API from './api';

export const registerUser = async (userData) => {
  console.log("REGISTER PAYLOAD:", {
    name: userData?.name,
    email: userData?.email,
    emailType: typeof userData?.email,
    hasPassword: Boolean(userData?.password)
  });
  const response = await API.post('/auth/register', userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  console.log("LOGIN PAYLOAD:", {
    email: credentials?.email,
    emailType: typeof credentials?.email,
    hasPassword: Boolean(credentials?.password)
  });
  const response = await API.post('/auth/login', credentials);
  return response.data;
};

export const googleAuthApi = async (credential) => {
  const response = await API.post('/auth/google', { credential });
  return response.data;
};

export const forgotPasswordApi = async (email) => {
  const response = await API.post('/auth/forgot-password', { email });
  return response.data;
};

export const verifyResetCodeApi = async (email, code) => {
  const response = await API.post('/auth/verify-reset-code', { email, code });
  return response.data;
};

export const resetPasswordApi = async (email, code, newPassword) => {
  const response = await API.post('/auth/reset-password', { email, code, newPassword });
  return response.data;
};

export const logoutUser = async () => {
  const response = await API.post('/auth/logout');
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await API.get('/auth/me');
  return response.data;
};
