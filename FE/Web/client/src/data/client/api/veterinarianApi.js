import instance from './instance';

export const getVeterinarianByClinicApi = (
  clinicId,
  page = 1,
  limit = 50,
  search = '',
  specialty = '',
) => {
  return instance.get('/veterinarian', {
    params: {
      page,
      limit,
      clinicId,
      ...(search ? { search } : {}),
      ...(specialty ? { specialty } : {}),
    },
  }).then((response) => response.data);
};
