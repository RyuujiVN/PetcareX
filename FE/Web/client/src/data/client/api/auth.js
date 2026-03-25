import instance from './instance';

export const loginApi = (email, password) => {
  return instance.post('/auth/login', { email, password });
};

export const registerApi = (data) => {
  return instance.post('/auth/register', data);
};

export const forgotPasswordApi = (email) => {
  return instance.post('/auth/forgot-password', { email });
};

export const resetPasswordApi = (data) => {
  return instance.post('/auth/reset-password', data);
};

export const changePasswordApi = (data) => {
  return instance.post('/auth/change-password', data);
};
