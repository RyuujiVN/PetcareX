export const getGoogleClientId = () => {
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim()
}

export const isGoogleClientIdValid = (clientId) => {
  if (!clientId) return false

  // Firebase Web App ID often starts with "1:" and is NOT OAuth Client ID.
  if (clientId.startsWith('1:')) return false

  return /\.apps\.googleusercontent\.com$/i.test(clientId)
}

export const getGoogleClientConfigError = (clientId) => {
  if (!clientId) {
    return 'Google Login chưa sẵn sàng. Vui lòng cấu hình VITE_GOOGLE_CLIENT_ID.'
  }

  if (clientId.startsWith('1:')) {
    return 'VITE_GOOGLE_CLIENT_ID đang là Firebase Web App ID. Hãy dùng OAuth Client ID dạng *.apps.googleusercontent.com.'
  }

  if (!isGoogleClientIdValid(clientId)) {
    return 'VITE_GOOGLE_CLIENT_ID không đúng định dạng OAuth Client ID.'
  }

  return ''
}
