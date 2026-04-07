import { useCallback, useMemo, useState } from 'react';
import { ADMIN_AUTH_STORAGE, getAdminAuthItem, setAdminAuthItem } from '../../constants/authStorage';
import { getAdminInstance } from '../../services/apiClient';
import { getUserProfileApi } from '../../services/userService';
import {
  createVeterinarianApi,
  deleteVeterinarianApi,
  getVeterinariansApi,
  updateVeterinarianApi,
} from '../../services/veterinarianService';

const DEFAULT_PAGINATION = {
  totalItems: 0,
  itemCount: 0,
  itemsPerPage: 10,
  totalPages: 1,
  currentPage: 1,
};

const decodeJwtPayload = (token) => {
  try {
    if (!token || token.split('.').length < 2) return null;

    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const json = atob(padded);

    return JSON.parse(json);
  } catch {
    return null;
  }
};

const getClinicIdFromStorage = () => {
  try {
    const rawProfile = getAdminAuthItem(ADMIN_AUTH_STORAGE.userInfoKey);
    if (!rawProfile) return '';

    const profile = JSON.parse(rawProfile);
    return profile?.clinicId || profile?.clinic?.id || '';
  } catch {
    return '';
  }
};

const getClinicIdFromToken = () => {
  const token = getAdminAuthItem(ADMIN_AUTH_STORAGE.tokenKey);
  const payload = decodeJwtPayload(token);
  return payload?.clinicId || '';
};

export default function useVeterinarians(options = {}) {
  const [veterinarians, setVeterinarians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [resolvedClinicId, setResolvedClinicId] = useState('');

  const staticClinicId = useMemo(
    () => options.clinicId || getClinicIdFromStorage() || getClinicIdFromToken(),
    [options.clinicId],
  );

  const resolveClinicId = useCallback(
    async (preferredClinicId) => {
      const candidate = preferredClinicId || resolvedClinicId || staticClinicId;
      if (candidate) {
        setResolvedClinicId(candidate);
        return candidate;
      }

      try {
        const profileResponse = await getUserProfileApi(getAdminInstance());
        const profile = profileResponse?.data || {};
        const clinicId = profile?.clinicId || profile?.clinic?.id || '';

        if (clinicId) {
          setResolvedClinicId(clinicId);

          const existingRaw = getAdminAuthItem(ADMIN_AUTH_STORAGE.userInfoKey);
          const existing = existingRaw ? JSON.parse(existingRaw) : {};
          setAdminAuthItem(
            ADMIN_AUTH_STORAGE.userInfoKey,
            JSON.stringify({ ...existing, ...profile, clinicId }),
          );

          return clinicId;
        }
      } catch {
        return '';
      }

      return '';
    },
    [resolvedClinicId, staticClinicId],
  );

  const fetchVeterinarians = useCallback(
    async ({ page = 1, size = 10, search = '', specialty = '', clinicId } = {}) => {
      const targetClinicId = await resolveClinicId(clinicId);

      if (!targetClinicId) {
        setVeterinarians([]);
        setPagination(DEFAULT_PAGINATION);
        setError('Không tìm thấy clinicId để tải danh sách bác sĩ');
        return { items: [], meta: DEFAULT_PAGINATION };
      }

      try {
        setLoading(true);
        setError('');

        const payload = await getVeterinariansApi(getAdminInstance(), page, size, {
          clinicId: targetClinicId,
          search,
          specialty,
        });

        const items = Array.isArray(payload?.items) ? payload.items : [];
        const meta = payload?.meta || DEFAULT_PAGINATION;

        setVeterinarians(items);
        setPagination({
          totalItems: meta.totalItems || 0,
          itemCount: meta.itemCount || items.length,
          itemsPerPage: meta.itemsPerPage || size,
          totalPages: Math.max(meta.totalPages || 1, 1),
          currentPage: meta.currentPage || page,
        });

        return { items, meta };
      } catch (apiError) {
        setError(apiError.message || 'Không thể tải danh sách bác sĩ');
        setVeterinarians([]);
        setPagination(DEFAULT_PAGINATION);
        throw apiError;
      } finally {
        setLoading(false);
      }
    },
    [resolveClinicId],
  );

  const addVeterinarian = useCallback(
    async (data) => {
      try {
        setSaving(true);
        setError('');
        setSuccess('');

        const targetClinicId = await resolveClinicId(data?.clinicId);
        if (!targetClinicId) {
          throw new Error('Không tìm thấy clinicId để tạo bác sĩ');
        }

        const payload = await createVeterinarianApi(getAdminInstance(), {
          ...data,
          clinicId: targetClinicId,
        });

        setSuccess('Tạo bác sĩ thành công');
        return payload;
      } catch (apiError) {
        setError(apiError.message || 'Không thể tạo bác sĩ');
        throw apiError;
      } finally {
        setSaving(false);
      }
    },
    [resolveClinicId],
  );

  const editVeterinarian = useCallback(async (id, data) => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload = await updateVeterinarianApi(getAdminInstance(), id, data);
      setSuccess('Cập nhật bác sĩ thành công');
      return payload;
    } catch (apiError) {
      setError(apiError.message || 'Không thể cập nhật bác sĩ');
      throw apiError;
    } finally {
      setSaving(false);
    }
  }, []);

  const removeVeterinarian = useCallback(async (id) => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload = await deleteVeterinarianApi(getAdminInstance(), id);
      setSuccess('Xóa bác sĩ thành công');
      return payload;
    } catch (apiError) {
      setError(apiError.message || 'Không thể xóa bác sĩ');
      throw apiError;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    clinicId: resolvedClinicId || staticClinicId,
    veterinarians,
    loading,
    saving,
    error,
    success,
    pagination,
    fetchVeterinarians,
    addVeterinarian,
    editVeterinarian,
    removeVeterinarian,
  };
}
