const DEFAULT_LOCALE = 'vi'

const ROLE_LABELS = {
  vi: {
    ADMIN: 'Quản trị viên',
    ADMIN_CLINIC: 'Quản lý phòng khám',
    VETERINARIAN: 'Bác sĩ thú y',
    USER: 'Khách hàng',
  },
  en: {
    ADMIN: 'Administrator',
    ADMIN_CLINIC: 'Clinic Admin',
    VETERINARIAN: 'Veterinarian',
    USER: 'Customer',
  },
}

const SPECIALTY_LABELS = {
  vi: {
    GENERAL_EXAMINATION: 'Khám tổng quát',
    INTERNAL_MEDICINE: 'Nội khoa',
    SURGERY: 'Ngoại khoa',
    ULTRASOUND: 'Chẩn đoán hình ảnh',
    VACCINATION_AND_PREVENTION: 'Tiêm chủng và phòng ngừa',
  },
  en: {
    GENERAL_EXAMINATION: 'General Examination',
    INTERNAL_MEDICINE: 'Internal Medicine',
    SURGERY: 'Surgery',
    ULTRASOUND: 'Diagnostic Imaging',
    VACCINATION_AND_PREVENTION: 'Vaccination & Prevention',
  },
}

const normalizeLocale = (locale) => {
  if (!locale || typeof locale !== 'string') return DEFAULT_LOCALE
  return locale.toLowerCase().startsWith('en') ? 'en' : 'vi'
}

const getLocaleFromStorage = () => {
  try {
    const fromStorage =
      localStorage.getItem('appLanguage') ||
      localStorage.getItem('language') ||
      localStorage.getItem('locale')

    return normalizeLocale(fromStorage)
  } catch {
    return DEFAULT_LOCALE
  }
}

const resolveLocale = (locale) => normalizeLocale(locale || getLocaleFromStorage())

const fallbackEnumLabel = (value) => {
  if (!value) return 'Chưa cập nhật'

  return String(value)
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/(^|\s)\S/g, (char) => char.toUpperCase())
}

export const getRoleLabel = (role, locale) => {
  if (!role) return 'Chưa cập nhật'

  const normalizedRole = String(role).toUpperCase()
  const activeLocale = resolveLocale(locale)

  return ROLE_LABELS[activeLocale]?.[normalizedRole] || fallbackEnumLabel(normalizedRole)
}

export const getSpecialtyLabel = (specialty, locale) => {
  if (!specialty) return 'Chưa cập nhật'

  const normalizedSpecialty = String(specialty).toUpperCase()
  const activeLocale = resolveLocale(locale)

  return SPECIALTY_LABELS[activeLocale]?.[normalizedSpecialty] || fallbackEnumLabel(normalizedSpecialty)
}

export const getSpecialtyOptions = (locale) => {
  const activeLocale = resolveLocale(locale)
  const labels = SPECIALTY_LABELS[activeLocale] || SPECIALTY_LABELS.vi

  return Object.entries(labels).map(([value, label]) => ({ value, label }))
}
