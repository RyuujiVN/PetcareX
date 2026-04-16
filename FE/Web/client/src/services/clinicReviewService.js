// Service clinic review — gọi trực tiếp BE /api/clinic-review.
// Replacement cho bản localStorage mock cũ (deprecated).

// Chuẩn hoá rating về khoảng 1.0–5.0, step 0.5 (khớp với Ant Rate allowHalf).
export const normalizeRating = (value) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return 0
  const clamped = Math.max(0, Math.min(5, num))
  return Math.round(clamped * 2) / 2
}

// Ẩn một phần họ tên người đánh giá (giữ ký tự đầu + ký tự cuối của mỗi từ).
export const maskReviewerName = (fullName) => {
  const name = String(fullName || '').trim()
  if (!name) return ''

  return name
    .split(/\s+/)
    .map((word) => {
      if (word.length <= 1) return word
      if (word.length === 2) return `${word[0]}*`
      return `${word[0]}${'*'.repeat(word.length - 2)}${word[word.length - 1]}`
    })
    .join(' ')
}

// GET /api/clinic-review?clinicId=&page=&limit=
export const getClinicReviewsApi = (
  instance,
  clinicId,
  page = 1,
  limit = 10,
) => {
  if (!clinicId) return Promise.resolve({ items: [], meta: {} })

  return instance
    .get('/clinic-review', {
      params: { clinicId, page, limit },
    })
    .then((response) => response.data)
}

// GET /api/clinic-review/:id
export const getClinicReviewByIdApi = (instance, id) => {
  if (!id) return Promise.resolve(null)
  return instance
    .get(`/clinic-review/${id}`)
    .then((response) => response.data)
}

// POST /api/clinic-review
// payload: { clinicId, medicalRecordId, rating, content? }
export const createClinicReviewApi = (instance, payload) => {
  const body = {
    clinicId: String(payload?.clinicId || '').trim(),
    medicalRecordId: String(payload?.medicalRecordId || '').trim(),
    rating: normalizeRating(payload?.rating),
    content: String(payload?.content || '').trim() || undefined,
  }

  return instance.post('/clinic-review', body).then((response) => response.data)
}
