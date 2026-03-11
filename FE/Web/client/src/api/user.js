import instance from './instance';

// Get user list with pagination
export const getUserListApi = (page = 1, limit = 10, search = '') => {
  return instance.get('/user', {
    params: {
      page,
      limit,
      search,
    },
  });
};

// Fetch current logged-in user profile
export const getUserProfileApi = () => {
  return instance.get('/user/profile');
};

// Get user by ID
export const getUserByIdApi = (userId) => {
  return instance.get(`/user/${userId}`);
};

// Update user profile by ID
export const updateUserProfileApi = (userId, data) => {
  return instance.put(`/user/${userId}`, {
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    address: data.address,
    avatarUrl: data.avatarUrl,
  });
};

// Upload avatar
export const uploadAvatarApi = (formData) => {
  return instance.post('/user/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Delete user account by ID
export const deleteAccountApi = (userId) => {
  return instance.delete(`/user/${userId}`);
};
