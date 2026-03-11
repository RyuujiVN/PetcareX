import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  const [token, setToken] = useState(localStorage.getItem("accessToken"));

  const login = (accessToken) => {

    localStorage.setItem("accessToken", accessToken);
    setToken(accessToken);

  };

  const logout = () => {

    localStorage.removeItem("accessToken");
    localStorage.removeItem("userInfo");

    setToken(null);

  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};