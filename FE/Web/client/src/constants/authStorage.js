export const CLIENT_AUTH_STORAGE = {
  tokenKey: 'clientAccessToken',
  userInfoKey: 'clientUserInfo',
};

export const ADMIN_AUTH_STORAGE = {
  tokenKey: 'adminAccessToken',
  userInfoKey: 'adminUserInfo',
  activeRoleKey: 'adminActiveRole',
};

export const LEGACY_AUTH_STORAGE = {
  tokenKey: 'accessToken',
  userInfoKey: 'userInfo',
};

export const clearAuthStorage = ({ tokenKey, userInfoKey }) => {
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(userInfoKey);
};

export const clearLegacyAuthStorage = () => {
  clearAuthStorage(LEGACY_AUTH_STORAGE);
};

const ADMIN_AUTH_KEYS = [
  ADMIN_AUTH_STORAGE.tokenKey,
  ADMIN_AUTH_STORAGE.userInfoKey,
  ADMIN_AUTH_STORAGE.activeRoleKey,
];

export const getAdminAuthItem = (key) => {
  const sessionValue = sessionStorage.getItem(key);
  if (sessionValue !== null) {
    return sessionValue;
  }

  // Migrate legacy admin auth values from localStorage into tab-scoped sessionStorage.
  const localValue = localStorage.getItem(key);
  if (localValue !== null) {
    sessionStorage.setItem(key, localValue);
    localStorage.removeItem(key);
  }

  return localValue;
};

export const setAdminAuthItem = (key, value) => {
  sessionStorage.setItem(key, value);
  // Keep admin auth isolated per tab and avoid cross-tab overwrites.
  localStorage.removeItem(key);
};

export const removeAdminAuthItem = (key) => {
  sessionStorage.removeItem(key);
  localStorage.removeItem(key);
};

export const clearAdminAuthStorage = () => {
  ADMIN_AUTH_KEYS.forEach((key) => removeAdminAuthItem(key));
};