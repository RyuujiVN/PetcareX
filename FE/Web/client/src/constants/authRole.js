const collectNormalizedRoles = (userInfo) => {
  const roleTokens = [];

  if (typeof userInfo?.role === 'string') {
    roleTokens.push(userInfo.role);
  }

  if (Array.isArray(userInfo?.roles)) {
    userInfo.roles.forEach((roleItem) => {
      if (typeof roleItem === 'string') {
        roleTokens.push(roleItem);
        return;
      }

      const value = roleItem?.name || roleItem?.code || roleItem?.role;
      if (value) {
        roleTokens.push(value);
      }
    });
  }

  return roleTokens.map((item) => String(item).toUpperCase());
};

export const isVeterinarianAccount = (userInfo) => {
  const normalized = collectNormalizedRoles(userInfo);

  return normalized.some((role) => role.includes('VETERINARIAN') || role.includes('DOCTOR'));
};

export const isClinicAdminAccount = (userInfo) => {
  const normalized = collectNormalizedRoles(userInfo);

  return normalized.some((role) => role.includes('ADMIN') || role.includes('CLINIC'));
};

export const isAdminClinicAccount = (userInfo) => {
  return isClinicAdminAccount(userInfo) || isVeterinarianAccount(userInfo);
};