import { buildHeaders, request } from "./fetchApi";

export const getClinicListApi = async (page = 1, limit = 50, search = "") => {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(search ? { search } : {}),
  });

  return request(`/clinic?${query.toString()}`, {
    method: "GET",
    headers: buildHeaders(),
  });
};
