import { isAdminClinicAccount } from '../constants/authRole'
import { loginGoogleApi } from '../data/client/api/auth'
import { signInWithGooglePopupToken } from './firebaseClient'

export const authenticateClientWithGoogle = async () => {
  const { googleIdToken, fullName, avatarUrl } = await signInWithGooglePopupToken()
  const res = await loginGoogleApi({ googleIdToken, fullName, avatarUrl })
  const data = res?.data

  if (!data?.accessToken) {
    throw new Error(data?.message || 'Đăng nhập bằng Google thất bại.')
  }

  if (isAdminClinicAccount(data.userInfo)) {
    return {
      status: 'admin-account',
    }
  }

  return {
    status: 'success',
    accessToken: data.accessToken,
    userInfo: data.userInfo,
  }
}
