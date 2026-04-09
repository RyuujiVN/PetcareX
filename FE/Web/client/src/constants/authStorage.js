import { removeToken } from '../utils/storage/tokenStorage';

export const CLIENT_AUTH_STORAGE = {
  tokenKey: 'accessToken',
  userInfoKey: 'clientUserInfo',
};

export const ADMIN_AUTH_STORAGE = {
  tokenKey: 'accessToken',
  userInfoKey: 'adminUserInfo',
  activeRoleKey: 'adminActiveRole',
};

// Old token keys from previous scheme — cleaned up on login/logout
const OLD_TOKEN_KEYS = ['clientAccessToken', 'adminAccessToken'];

export const clearAuthStorage = ({ userInfoKey }) => {
  removeToken();
  localStorage.removeItem(userInfoKey);
};

export const clearLegacyAuthStorage = () => {
  OLD_TOKEN_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  localStorage.removeItem('userInfo');
};

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

const ADMIN_SESSION_KEYS = [
  ADMIN_AUTH_STORAGE.userInfoKey,
  ADMIN_AUTH_STORAGE.activeRoleKey,
];

export const clearAdminAuthStorage = () => {
  removeToken();
  ADMIN_SESSION_KEYS.forEach((key) => removeAdminAuthItem(key));
};
