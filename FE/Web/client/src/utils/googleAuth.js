export const decodeGoogleCredential = (credential) => {
  if (!credential || typeof credential !== 'string') {
    return { fullName: 'Google User', avatarUrl: '' }
  }

  try {
    const base64Url = credential.split('.')[1]
    if (!base64Url) {
      return { fullName: 'Google User', avatarUrl: '' }
    }

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    )

    const payload = JSON.parse(jsonPayload)
    const fullName = payload?.name || payload?.email?.split('@')?.[0] || 'Google User'
    const avatarUrl = payload?.picture || ''

    return { fullName, avatarUrl }
  } catch {
    return { fullName: 'Google User', avatarUrl: '' }
  }
}
