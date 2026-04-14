const STORAGE_KEY = 'petcarex.clinicReview.v1';

const readStorage = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeStorage = (items) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
  }
};

const normalizeRating = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  const clamped = Math.max(1, Math.min(5, num));
  return Math.round(clamped * 2) / 2;
};

const normalizeReview = (input = {}) => {
  const clinicId = String(input.clinicId || '').trim();
  const medicalRecordId = String(input.medicalRecordId || '').trim();

  if (!clinicId || !medicalRecordId) {
    return null;
  }

  const rating = normalizeRating(input.rating);
  if (!rating) return null;

  return {
    clinicId,
    clinicName: String(input.clinicName || '').trim(),
    medicalRecordId,
    rating,
    content: String(input.content || '').trim(),
    reviewerId: String(input.reviewerId || '').trim(),
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export const getAllClinicReviews = () => readStorage();

export const getClinicReviewByMedicalRecordId = (medicalRecordId) => {
  const targetMedicalRecordId = String(medicalRecordId || '').trim();
  if (!targetMedicalRecordId) return null;

  return readStorage().find((item) => item?.medicalRecordId === targetMedicalRecordId) || null;
};

export const upsertClinicReview = (input) => {
  const normalized = normalizeReview(input);
  if (!normalized) {
    throw new Error('INVALID_CLINIC_REVIEW');
  }

  const currentItems = readStorage();
  const nextItems = currentItems.filter(
    (item) => String(item?.medicalRecordId || '') !== normalized.medicalRecordId,
  );

  nextItems.unshift(normalized);
  writeStorage(nextItems);

  return normalized;
};

export const getClinicRatingSummary = (clinicId) => {
  const targetClinicId = String(clinicId || '').trim();
  if (!targetClinicId) {
    return { averageRating: 0, totalReviews: 0 };
  }

  const reviews = readStorage().filter((item) => String(item?.clinicId || '') === targetClinicId);
  if (!reviews.length) {
    return { averageRating: 0, totalReviews: 0 };
  }

  const totalScore = reviews.reduce((sum, item) => sum + normalizeRating(item?.rating), 0);

  return {
    averageRating: Number((totalScore / reviews.length).toFixed(1)),
    totalReviews: reviews.length,
  };
};
