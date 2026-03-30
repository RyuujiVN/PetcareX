import { loginGoogleApi } from '../data/client/api/auth'
import { signInWithGooglePopupToken } from './firebaseClient'

export const authenticateClientWithGoogle = async () => {
  const { googleIdToken, fullName, avatarUrl } = await signInWithGooglePopupToken()
  const res = await loginGoogleApi({ googleIdToken, fullName, avatarUrl })
  const data = res?.data

  if (!data?.accessToken) {
    throw new Error(data?.message || 'Đăng nhập bằng Google thất bại.')
  }

  return {
    accessToken: data.accessToken,
    userInfo: data.userInfo,
  }
}
