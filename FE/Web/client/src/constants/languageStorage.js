export const LANGUAGE_SCOPE = {
  client: 'client',
  clinic: 'clinic',
  veterinarian: 'veterinarian',
}

export const LANGUAGE_STORAGE_KEYS = {
  [LANGUAGE_SCOPE.client]: 'lang_client',
  [LANGUAGE_SCOPE.clinic]: 'lang_clinic',
  [LANGUAGE_SCOPE.veterinarian]: 'lang_veterinarian',
}

const LEGACY_LANGUAGE_KEY = 'lang'

const normalizeLanguage = (value) => {
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized.startsWith('en')) return 'en'
  if (normalized.startsWith('vi')) return 'vi'
  return null
}

const resolveScope = (scope) => {
  if (scope && LANGUAGE_STORAGE_KEYS[scope]) return scope
  return LANGUAGE_SCOPE.client
}

export const getLanguageScopeByPathname = (pathname = '') => {
  if (pathname.startsWith('/clinic')) return LANGUAGE_SCOPE.clinic
  if (pathname.startsWith('/veterinarian')) return LANGUAGE_SCOPE.veterinarian
  return LANGUAGE_SCOPE.client
}

export const getLanguageForScope = (scope) => {
  if (typeof window === 'undefined') return 'vi'

  const resolvedScope = resolveScope(scope)
  const scopedValue = normalizeLanguage(
    window.localStorage.getItem(LANGUAGE_STORAGE_KEYS[resolvedScope]),
  )
  if (scopedValue) return scopedValue

  const legacyValue = normalizeLanguage(window.localStorage.getItem(LEGACY_LANGUAGE_KEY))
  if (legacyValue) return legacyValue

  return 'vi'
}

export const setLanguageForScope = (scope, language) => {
  if (typeof window === 'undefined') return

  const resolvedScope = resolveScope(scope)
  const normalized = normalizeLanguage(language) || 'vi'

  window.localStorage.setItem(LANGUAGE_STORAGE_KEYS[resolvedScope], normalized)

  // Keep backward compatibility for existing places that still read the legacy key.
  if (resolvedScope === LANGUAGE_SCOPE.client) {
    window.localStorage.setItem(LEGACY_LANGUAGE_KEY, normalized)
  }
}

export const getInitialLanguage = () => {
  if (typeof window === 'undefined') return 'vi'

  const scope = getLanguageScopeByPathname(window.location.pathname || '')
  return getLanguageForScope(scope)
}
