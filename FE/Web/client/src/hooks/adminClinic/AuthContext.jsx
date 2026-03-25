import { createContext, useContext, useEffect, useState } from "react";
import { getUserProfileApi } from "../../data/adminClinic/api/user";
import {
	ADMIN_AUTH_STORAGE,
	clearAuthStorage,
	clearLegacyAuthStorage,
} from "../../constants/authStorage";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [token, setToken] = useState(localStorage.getItem(ADMIN_AUTH_STORAGE.tokenKey));
	const [userProfile, setUserProfile] = useState(null);

	useEffect(() => {
		clearLegacyAuthStorage();
	}, []);

	useEffect(() => {
		if (token) {
			getUserProfileApi()
				.then((res) => {
					setUserProfile(res.data);
					localStorage.setItem(ADMIN_AUTH_STORAGE.userInfoKey, JSON.stringify(res.data));
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
		localStorage.setItem(ADMIN_AUTH_STORAGE.tokenKey, accessToken);
		if (profile) {
			localStorage.setItem(ADMIN_AUTH_STORAGE.userInfoKey, JSON.stringify(profile));
			setUserProfile(profile);
		}
		setToken(accessToken);
	};

	const logout = () => {
		clearAuthStorage(ADMIN_AUTH_STORAGE);
		clearLegacyAuthStorage();
		setToken(null);
		setUserProfile(null);
	};

	const refreshUserProfile = async () => {
		if (!token) return;
		try {
			const res = await getUserProfileApi();
			setUserProfile(res.data);
			localStorage.setItem(ADMIN_AUTH_STORAGE.userInfoKey, JSON.stringify(res.data));
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
