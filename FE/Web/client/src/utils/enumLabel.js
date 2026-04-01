import {
    ENUM_KEYS,
    ENUM_LABEL_MAPS,
    VETERINARY_SPECIALTY_LABELS,
} from '../constants/enumLabels'

export const UNKNOWN_ENUM_LABEL = 'Chưa cập nhật'

const normalizeEnumValue = (value) => {
  if (value === undefined || value === null) return ''

  return String(value)
    .trim()
    .replace(/-/g, '_')
    .toUpperCase()
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
  const normalized = normalizeEnumValue(value)
  if (!normalized) return fallback

  const dictionary = ENUM_LABEL_MAPS[enumKey] || {}
  return dictionary[normalized] || humanizeEnumValue(normalized, fallback)
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
