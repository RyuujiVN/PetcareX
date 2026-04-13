import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getPrimaryRole } from '../constants/authRole'
import { ADMIN_AUTH_STORAGE, CLIENT_AUTH_STORAGE } from '../constants/authStorage'
import { RoleEnum } from '../enum/role.enum'
import { useAuth as useAdminAuth } from '../hooks/Clinic/AuthContext'
import { useAuth as useClientAuth } from '../hooks/client/AuthContext'

const getStoredJson = (key, storage) => {
  try {
    const value = storage.getItem(key)
    if (!value) return null
    return JSON.parse(value)
  } catch {
    return null
  }
}

const getFallbackRoleFromStorage = () => {
  const sessionProfile = getStoredJson(ADMIN_AUTH_STORAGE.userInfoKey, sessionStorage)
  const localProfile = getStoredJson(CLIENT_AUTH_STORAGE.userInfoKey, localStorage)
  const fallbackProfile = sessionProfile || localProfile

  const activeRole = sessionStorage.getItem(ADMIN_AUTH_STORAGE.activeRoleKey)
  if (activeRole) return activeRole

  if (!fallbackProfile) return null
  return getPrimaryRole(fallbackProfile)
}

const getLandingPathByRole = (role) => {
  switch (role) {
    case RoleEnum.ADMIN:
      return '/admin/dashboard/clinics'
    case RoleEnum.ADMIN_CLINIC:
      return '/clinic/appointments'
    case RoleEnum.VETERINARIAN:
      return '/veterinarian/appointments'
    case RoleEnum.CUSTOMER:
    default:
      return '/home'
  }
}

export default function RoleBasedRoute({ allowedRoles = [], children }) {
  const location = useLocation()
  const clientAuth = useClientAuth()
  const adminAuth = useAdminAuth()

  const token = adminAuth?.token || clientAuth?.token

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!allowedRoles?.length) {
    return children || <Outlet />
  }

  const currentRole =
    adminAuth?.activeRole ||
    getPrimaryRole(adminAuth?.userProfile || clientAuth?.userProfile) ||
    getFallbackRoleFromStorage()

  if (currentRole && allowedRoles.includes(currentRole)) {
    return children || <Outlet />
  }

  return <Navigate to={getLandingPathByRole(currentRole)} replace />
}