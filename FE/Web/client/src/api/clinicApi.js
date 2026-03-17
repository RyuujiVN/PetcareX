import instance from './instance';

export const getClinicListApi = (page = 1, limit = 50, search = '') => {
  return instance.get('/clinic', {
    params: {
      page,
      limit,
      ...(search ? { search } : {}),
    },
  }).then((response) => response.data);
};

export const getClinicByIdApi = (clinicId) => {
  return instance.get(`/clinic/${clinicId}`).then((response) => response.data);
};

export const uploadClinicAvatarApi = (file) => {
  const formData = new FormData();
  formData.append('file', file);

  return instance.post('/clinic/upload', formData).then((response) => response.data);
};
