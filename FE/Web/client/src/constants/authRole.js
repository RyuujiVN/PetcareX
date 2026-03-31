import { RoleEnum } from '../enum/role.enum'

const ROLE_PRIORITY = [
  RoleEnum.VETERINARIAN,
  RoleEnum.ADMIN_CLINIC,
  RoleEnum.ADMIN,
  RoleEnum.CUSTOMER,
]

const normalizeRoleValue = (roleValue) => String(roleValue).trim().toUpperCase()

const mapToKnownRole = (roleValue) => {
  const normalizedRole = normalizeRoleValue(roleValue)

  if (normalizedRole.includes('VETERINARIAN') || normalizedRole.includes('DOCTOR')) {
    return RoleEnum.VETERINARIAN
  }

  if (normalizedRole.includes('ADMIN_CLINIC') || normalizedRole.includes('CLINIC_ADMIN')) {
    return RoleEnum.ADMIN_CLINIC
  }

  if (normalizedRole.includes('ADMIN')) {
    return RoleEnum.ADMIN
  }

  if (normalizedRole.includes('CUSTOMER') || normalizedRole.includes('USER')) {
    return RoleEnum.CUSTOMER
  }

  return null
}

export const getNormalizedRoles = (userInfo) => {
  const roleTokens = []

  if (typeof userInfo?.role === 'string') {
    roleTokens.push(userInfo.role)
  }

  if (userInfo?.role && typeof userInfo.role === 'object') {
    const value = userInfo.role.name || userInfo.role.code || userInfo.role.role
    if (value) {
      roleTokens.push(value)
    }
  }

  if (Array.isArray(userInfo?.roles)) {
    userInfo.roles.forEach((roleItem) => {
      if (typeof roleItem === 'string') {
        roleTokens.push(roleItem)
        return
      }

      const value = roleItem?.name || roleItem?.code || roleItem?.role
      if (value) {
        roleTokens.push(value)
      }
    })
  }

  const mappedRoles = roleTokens
    .map(mapToKnownRole)
    .filter(Boolean)

  return [...new Set(mappedRoles)]
}

export const getPrimaryRole = (userInfo) => {
  const normalizedRoles = getNormalizedRoles(userInfo)
  const prioritizedRole = ROLE_PRIORITY.find((role) => normalizedRoles.includes(role))

  return prioritizedRole || RoleEnum.CUSTOMER
}

export const getAuthPortalByRole = (userInfo) => {
  const primaryRole = getPrimaryRole(userInfo)

  if (primaryRole === RoleEnum.CUSTOMER) {
    return 'client'
  }

  return 'admin'
}

export const getPostLoginPathByRole = (userInfo) => {
  const primaryRole = getPrimaryRole(userInfo)

  switch (primaryRole) {
    case RoleEnum.VETERINARIAN:
      return '/admin/veterinarian/appointments'
    case RoleEnum.ADMIN:
      return '/admin/home'
    case RoleEnum.ADMIN_CLINIC:
      return '/admin/clinic/appointments'
    case RoleEnum.CUSTOMER:
    default:
      return '/home'
  }
}

export const isAdminClinicAccount = (userInfo) => {
  return getAuthPortalByRole(userInfo) === 'admin'
}
