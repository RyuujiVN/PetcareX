import { createContext, useContext, useEffect, useState } from "react";
import { getUserProfileApi } from "../api/user";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  const [token, setToken] = useState(localStorage.getItem("accessToken"));
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (token) {
      getUserProfileApi()
        .then((res) => {
          setUserProfile(res.data);
          localStorage.setItem("userInfo", JSON.stringify(res.data));
        })
        .catch(() => {
          // Token invalid – interceptor will redirect to /login
        });
    } else {
      setUserProfile(null);
    }
  }, [token]);

  const login = (accessToken) => {

    localStorage.setItem("accessToken", accessToken);
    setToken(accessToken);

  };

  const logout = () => {

    localStorage.removeItem("accessToken");
    localStorage.removeItem("userInfo");

    setToken(null);
    setUserProfile(null);

  };

  const refreshUserProfile = async () => {
    if (!token) return;
    try {
      const res = await getUserProfileApi();
      setUserProfile(res.data);
      localStorage.setItem("userInfo", JSON.stringify(res.data));
      return res.data;
    } catch {
      // handled by interceptor
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