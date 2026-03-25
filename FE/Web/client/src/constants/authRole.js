export const isAdminClinicAccount = (userInfo) => {
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

  const normalized = roleTokens.map((item) => String(item).toUpperCase());

  return normalized.some(
    (role) =>
      role.includes('ADMIN') ||
      role.includes('CLINIC') ||
      role.includes('VETERINARIAN') ||
      role.includes('DOCTOR'),
  );
};