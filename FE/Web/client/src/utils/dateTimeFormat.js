const toValidDate = (value) => {
  if (!value) return null

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return date
}

export const formatDateDDMMYYYY = (value, fallback = '') => {
  const date = toValidDate(value)
  if (!date) return fallback

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')

  return `${day}-${month}-${date.getFullYear()}`
}

export const formatTimeHHMM = (value, fallback = '') => {
  if (value === null || value === undefined || value === '') return fallback

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return fallback
    const hours = String(value.getHours()).padStart(2, '0')
    const minutes = String(value.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const text = String(value).trim()
  if (!text) return fallback

  const match = text.match(/(\d{1,2}):(\d{1,2})/)
  if (!match) return fallback

  return `${match[1].padStart(2, '0')}:${match[2].padStart(2, '0')}`
}
