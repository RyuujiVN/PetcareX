import instance from './instance';

const normalizePayload = (response) => response?.data || {};

export const getVeterinarians = async (page = 1, size = 10, options = {}) => {
  const { clinicId, search = '', specialty = '' } = options;

  if (!clinicId) {
    throw new Error('Thiếu clinicId để tải danh sách bác sĩ');
  }

  const response = await instance.get('/veterinarian', {
    params: {
      page,
      limit: size,
      clinicId,
      ...(search ? { search } : {}),
      ...(specialty ? { specialty } : {}),
    },
  });

  return normalizePayload(response);
};

export const createVeterinarian = async (data) => {
  const response = await instance.post('/veterinarian', data);
  return normalizePayload(response);
};

export const updateVeterinarian = async (id, data) => {
  const response = await instance.put(`/veterinarian/${id}`, data);
  return normalizePayload(response);
};

export const deleteVeterinarian = async (id) => {
  const response = await instance.delete(`/veterinarian/${id}`);
  return normalizePayload(response);
};
