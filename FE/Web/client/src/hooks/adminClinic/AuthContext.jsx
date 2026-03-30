import { createContext, useContext, useEffect, useState } from "react";
import { getUserProfileApi } from "../../data/adminClinic/api/user";
import {
	ADMIN_AUTH_STORAGE,
	clearAuthStorage,
	clearLegacyAuthStorage,
} from "../../constants/authStorage";

const AuthContext = createContext();

const readStoredAdminProfile = () => {
	try {
		const raw = localStorage.getItem(ADMIN_AUTH_STORAGE.userInfoKey);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
};

const deriveClinicInfo = (profile) => {
	if (!profile) return null;

	return (
		profile?.clinicInfo ||
		profile?.clinic ||
		profile?.veterinarian?.clinic ||
		profile?.adminClinic?.clinic ||
		null
	);
};

const mergeClinicMetadata = (profile, fallbackProfile = null) => {
	if (!profile && !fallbackProfile) return null;

	const baseProfile = profile || fallbackProfile;
	const clinicInfo = deriveClinicInfo(profile) || deriveClinicInfo(fallbackProfile);
	const clinicName =
		baseProfile?.clinicName ||
		clinicInfo?.name ||
		fallbackProfile?.clinicName ||
		'';

	return {
		...baseProfile,
		...(clinicInfo ? { clinicInfo } : {}),
		...(clinicName ? { clinicName } : {}),
	};
};

export const AuthProvider = ({ children }) => {
	const [token, setToken] = useState(localStorage.getItem(ADMIN_AUTH_STORAGE.tokenKey));
	const [userProfile, setUserProfile] = useState(null);

	useEffect(() => {
		clearLegacyAuthStorage();
	}, []);

	useEffect(() => {
		if (token) {
			const cachedProfile = readStoredAdminProfile();

			getUserProfileApi()
				.then((res) => {
					const mergedProfile = mergeClinicMetadata(res.data, cachedProfile);
					setUserProfile(mergedProfile);
					localStorage.setItem(ADMIN_AUTH_STORAGE.userInfoKey, JSON.stringify(mergedProfile));
				})
				.catch(() => {
					setUserProfile(cachedProfile || null);
				});
		} else {
			setUserProfile(null);
		}
	}, [token]);

	const login = (accessToken, profile = null) => {
		clearLegacyAuthStorage();
		localStorage.setItem(ADMIN_AUTH_STORAGE.tokenKey, accessToken);
		if (profile) {
			const mergedProfile = mergeClinicMetadata(profile, readStoredAdminProfile());
			localStorage.setItem(ADMIN_AUTH_STORAGE.userInfoKey, JSON.stringify(mergedProfile));
			setUserProfile(mergedProfile);
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
			const mergedProfile = mergeClinicMetadata(res.data, readStoredAdminProfile());
			setUserProfile(mergedProfile);
			localStorage.setItem(ADMIN_AUTH_STORAGE.userInfoKey, JSON.stringify(mergedProfile));
			return mergedProfile;
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
