import instance from './instance';
import {
  extractCloudinaryUrl,
  postMultipartFormData,
  uploadMultipleFilesToCloudinary,
  uploadOneFileToCloudinary,
} from '../../shared/api/cloudinaryUploadFetch';

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
  return postMultipartFormData('/cloudinary/upload/one-file', formData).then((payload) => ({
    data: {
      ...payload,
      file: extractCloudinaryUrl(payload),
    },
  }));
};

export const uploadUserImageApi = (file) => {
  return uploadOneFileToCloudinary(file).then((payload) => {
    return {
      ...payload,
      url: payload.file,
    };
  });
};

export const uploadUserImagesApi = (files) => {
  return uploadMultipleFilesToCloudinary(files).then((result) => result.urls);
};

export const deleteAccountApi = (userId) => {
  return instance.delete(`/user/${userId}`);
};
