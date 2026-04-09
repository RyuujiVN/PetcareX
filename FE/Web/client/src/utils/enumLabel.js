import {
    ENUM_KEYS,
    ENUM_LABEL_MAPS,
    VETERINARY_SPECIALTY_LABELS,
} from '../constants/enumLabels'
import i18n from '../i18n'

export const UNKNOWN_ENUM_LABEL = 'Chưa cập nhật'

const ENUM_TRANSLATION_PREFIX = {
  [ENUM_KEYS.APPOINTMENT_STATUS]: 'enums.appointmentStatus',
  [ENUM_KEYS.SERVICE]: 'enums.service',
  [ENUM_KEYS.ROLE]: 'enums.role',
  [ENUM_KEYS.VETERINARY_SPECIALTY]: 'enums.veterinarySpecialty',
  [ENUM_KEYS.PET_SPECIES]: 'enums.petSpecies',
  [ENUM_KEYS.PET_BREED]: 'enums.petBreed',
  [ENUM_KEYS.INVOICE_STATUS]: 'enums.invoiceStatus',
  [ENUM_KEYS.SENDER]: 'enums.sender',
  [ENUM_KEYS.MEDICINE_UNIT]: 'enums.medicineUnit',
  [ENUM_KEYS.MEDICAL_RECORD_STATUS]: 'enums.medicalRecordStatus',
}

const tryTranslate = (key) => {
  const translated = i18n.t(key, { defaultValue: '' })
  if (!translated || translated === key) return ''
  return translated
}

const resolveDefaultFallback = (fallback) => {
  if (fallback !== UNKNOWN_ENUM_LABEL) return fallback
  return tryTranslate('common.states.notUpdated') || fallback
}

const normalizeEnumValue = (value) => {
  if (value === undefined || value === null) return ''

  return String(value)
    .trim()
    .replace(/-/g, '_')
    .toUpperCase()
}

const normalizeLookupValue = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()

const resolveEnumKeyFromReadableValue = (enumKey, rawValue) => {
  const lookup = normalizeLookupValue(rawValue)
  if (!lookup) return ''

  const dictionary = ENUM_LABEL_MAPS[enumKey] || {}
  const entries = Object.entries(dictionary)

  for (const [key, label] of entries) {
    if (normalizeLookupValue(label) === lookup) {
      return key
    }
  }

  const translationPrefix = ENUM_TRANSLATION_PREFIX[enumKey]
  if (!translationPrefix) return ''

  for (const [key] of entries) {
    const viLabel = i18n.t(`${translationPrefix}.${key}`, { lng: 'vi', defaultValue: '' })
    if (normalizeLookupValue(viLabel) === lookup) {
      return key
    }

    const enLabel = i18n.t(`${translationPrefix}.${key}`, { lng: 'en', defaultValue: '' })
    if (normalizeLookupValue(enLabel) === lookup) {
      return key
    }
  }

  return ''
}

export const humanizeEnumValue = (value, fallback = UNKNOWN_ENUM_LABEL) => {
  const normalized = normalizeEnumValue(value)
  if (!normalized) return fallback

  return normalized
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export const getEnumLabel = (enumKey, value, fallback = UNKNOWN_ENUM_LABEL) => {
  const resolvedFallback = resolveDefaultFallback(fallback)
  const rawValue = String(value || '').trim()
  const normalized = normalizeEnumValue(value)
  if (!normalized) return resolvedFallback

  const dictionary = ENUM_LABEL_MAPS[enumKey] || {}
  const translationPrefix = ENUM_TRANSLATION_PREFIX[enumKey]

  const directDictionaryMatch = dictionary[normalized]
  const directTranslationMatch =
    translationPrefix && tryTranslate(`${translationPrefix}.${normalized}`)

  const effectiveKey =
    directDictionaryMatch || directTranslationMatch
      ? normalized
      : resolveEnumKeyFromReadableValue(enumKey, rawValue)

  if (effectiveKey) {
    if (translationPrefix) {
      const translatedLabel = tryTranslate(`${translationPrefix}.${effectiveKey}`)
      if (translatedLabel) {
        return translatedLabel
      }
    }

    if (dictionary[effectiveKey]) {
      return dictionary[effectiveKey]
    }
  }

  if (translationPrefix) {
    const translatedLabel = tryTranslate(`${translationPrefix}.${normalized}`)
    if (translatedLabel) {
      return translatedLabel
    }
  }

  if (dictionary[normalized]) {
    return dictionary[normalized]
  }

  // If value is already a readable localized phrase, keep it unchanged.
  if (rawValue && !/^[A-Z0-9_]+$/.test(rawValue)) {
    return rawValue
  }

  return humanizeEnumValue(normalized, resolvedFallback)
}

export const getAppointmentStatusLabel = (value, fallback = UNKNOWN_ENUM_LABEL) =>
  getEnumLabel(ENUM_KEYS.APPOINTMENT_STATUS, value, fallback)

export const getServiceLabel = (value, fallback = UNKNOWN_ENUM_LABEL) =>
  getEnumLabel(ENUM_KEYS.SERVICE, value, fallback)

export const getRoleLabel = (value, fallback = UNKNOWN_ENUM_LABEL) =>
  getEnumLabel(ENUM_KEYS.ROLE, value, fallback)

export const getVeterinarySpecialtyLabel = (value, fallback = UNKNOWN_ENUM_LABEL) =>
  getEnumLabel(ENUM_KEYS.VETERINARY_SPECIALTY, value, fallback)

export const getPetSpeciesLabel = (value, fallback = UNKNOWN_ENUM_LABEL) =>
  getEnumLabel(ENUM_KEYS.PET_SPECIES, value, fallback)

export const getPetBreedLabel = (breed, species, fallback = 'Chưa cập nhật giống') => {
  const rawBreed =
    typeof breed === 'object' && breed !== null
      ? breed.name || breed.id || ''
      : breed || ''

  const normalizedBreed = normalizeEnumValue(rawBreed)
  if (!normalizedBreed) return fallback

  const directLabel = getEnumLabel(ENUM_KEYS.PET_BREED, normalizedBreed, '')
  if (directLabel) return directLabel

  const normalizedSpecies = normalizeEnumValue(species)
  if (normalizedSpecies) {
    const composite = `${normalizedSpecies}_${normalizedBreed}`
    const compositeLabel = getEnumLabel(ENUM_KEYS.PET_BREED, composite, '')
    if (compositeLabel) return compositeLabel
  }

  return humanizeEnumValue(normalizedBreed, fallback)
}

export const getInvoiceStatusLabel = (value, fallback = UNKNOWN_ENUM_LABEL) =>
  getEnumLabel(ENUM_KEYS.INVOICE_STATUS, value, fallback)

export const getSenderLabel = (value, fallback = UNKNOWN_ENUM_LABEL) =>
  getEnumLabel(ENUM_KEYS.SENDER, value, fallback)

export const getMedicineUnitLabel = (value, fallback = UNKNOWN_ENUM_LABEL) =>
  getEnumLabel(ENUM_KEYS.MEDICINE_UNIT, value, fallback)

export const getMedicalRecordStatusLabel = (valueOrDone, options = {}) => {
  const { uppercase = false, fallback = UNKNOWN_ENUM_LABEL } = options

  const statusKey =
    typeof valueOrDone === 'boolean'
      ? valueOrDone
        ? 'DONE'
        : 'PENDING'
      : normalizeEnumValue(valueOrDone)

  const label = getEnumLabel(ENUM_KEYS.MEDICAL_RECORD_STATUS, statusKey, fallback)
  return uppercase ? label.toUpperCase() : label
}

export const getVeterinarySpecialtyOptions = () =>
  Object.entries(VETERINARY_SPECIALTY_LABELS).map(([value, label]) => ({
    value,
    label,
  }))
