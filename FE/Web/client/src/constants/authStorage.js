export const CLIENT_AUTH_STORAGE = {
  tokenKey: 'clientAccessToken',
  userInfoKey: 'clientUserInfo',
};

export const ADMIN_AUTH_STORAGE = {
  tokenKey: 'adminAccessToken',
  userInfoKey: 'adminUserInfo',
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