import { createContext, useContext, useEffect, useState } from "react";
import { getUserProfileApi } from "../../services/userService";
import { getClientInstance } from "../../services/apiClient";
import {
  CLIENT_AUTH_STORAGE,
  clearAuthStorage,
  clearLegacyAuthStorage,
} from "../../constants/authStorage";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  const [token, setToken] = useState(localStorage.getItem(CLIENT_AUTH_STORAGE.tokenKey));
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    clearLegacyAuthStorage();
  }, []);

  useEffect(() => {
    if (token) {
      getUserProfileApi(getClientInstance())
        .then((res) => {
          setUserProfile(res.data);
          localStorage.setItem(CLIENT_AUTH_STORAGE.userInfoKey, JSON.stringify(res.data));
        })
        .catch(() => {
          setUserProfile(null);
        });
    } else {
      setUserProfile(null);
    }
  }, [token]);

  const login = (accessToken, profile = null) => {
    clearLegacyAuthStorage();
    localStorage.setItem(CLIENT_AUTH_STORAGE.tokenKey, accessToken);
    if (profile) {
      localStorage.setItem(CLIENT_AUTH_STORAGE.userInfoKey, JSON.stringify(profile));
      setUserProfile(profile);
    }
    setToken(accessToken);

  };

  const logout = () => {

    clearAuthStorage(CLIENT_AUTH_STORAGE);
    clearLegacyAuthStorage();

    setToken(null);
    setUserProfile(null);

  };

  const refreshUserProfile = async () => {
    if (!token) return;
    try {
      const res = await getUserProfileApi(getClientInstance());
      setUserProfile(res.data);
      localStorage.setItem(CLIENT_AUTH_STORAGE.userInfoKey, JSON.stringify(res.data));
      return res.data;
    } catch {
      setUserProfile(null);
    }
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, userProfile, refreshUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
