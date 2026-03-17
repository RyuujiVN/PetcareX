import instance from './instance';

export const getUserListApi = (page = 1, limit = 10, search = '') => {
  return instance.get('/user', {
    params: {
      page,
      limit,
      search,
    },
  });
};

export const getUserProfileApi = () => {
  return instance.get('/user/profile');
};

export const getUserByIdApi = (userId) => {
  return instance.get(`/user/${userId}`);
};

export const updateUserProfileApi = (userId, data) => {
  return instance.put(`/user/${userId}`, {
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    address: data.address,
    avatarUrl: data.avatarUrl,
  });
};

export const uploadAvatarApi = (formData) => {
  return instance.post('/user/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const deleteAccountApi = (userId) => {
  return instance.delete(`/user/${userId}`);
};
