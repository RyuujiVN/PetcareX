import { loginGoogleApi } from '../../../services/authService'
import { getClientInstance } from '../../../services/apiClient'
import { signInWithGooglePopupToken } from './firebaseClient'

export const authenticateClientWithGoogle = async () => {
  const { googleIdToken, fullName, avatarUrl } = await signInWithGooglePopupToken()
  const res = await loginGoogleApi(getClientInstance(), { googleIdToken, fullName, avatarUrl })
  const data = res?.data

  if (!data?.accessToken) {
    throw new Error(data?.message || 'Đăng nhập bằng Google thất bại.')
  }

  return {
    accessToken: data.accessToken,
    userInfo: data.userInfo,
  }
}
