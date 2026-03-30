import instance from './instance'

export const getClinicListApi = (page = 1, limit = 10, search = '') => {
  return instance.get('/clinic', {
    params: {
      page,
      limit,
      ...(search ? { search } : {}),
    },
  }).then((response) => response.data)
}

export const getClinicByIdApi = (clinicId) => {
  return instance.get(`/clinic/${clinicId}`).then((response) => response.data)
}

export const createClinicApi = (data) => {
  return instance.post('/clinic', data).then((response) => response.data)
}

export const updateClinicApi = (clinicId, data) => {
  return instance.put(`/clinic/${clinicId}`, data).then((response) => response.data)
}

export const deleteClinicApi = (clinicId) => {
  return instance.delete(`/clinic/${clinicId}`).then((response) => response.data)
}
