import { buildHeaders, request } from "./fetchApi";

export const getVeterinarianByClinicApi = async (
  clinicId,
  page = 1,
  limit = 50,
  search = "",
  specialty = "",
) => {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    clinicId,
    ...(search ? { search } : {}),
    ...(specialty ? { specialty } : {}),
  });

  return request(`/veterinarian?${query.toString()}`, {
    method: "GET",
    headers: buildHeaders(),
  });
};
