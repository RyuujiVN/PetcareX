import { createContext, useContext, useEffect, useState } from "react";
import { getUserProfileApi } from "../../data/Clinic/api/user";
import { getPrimaryRole } from "../../constants/authRole";
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
	const [activeRole, setActiveRole] = useState(
		localStorage.getItem(ADMIN_AUTH_STORAGE.activeRoleKey) || null,
	);

	useEffect(() => {
		clearLegacyAuthStorage();
	}, []);

	useEffect(() => {
		if (token) {
			const cachedProfile = readStoredAdminProfile();
			const storedRole = localStorage.getItem(ADMIN_AUTH_STORAGE.activeRoleKey);
			if (!storedRole && cachedProfile) {
				const cachedRole = getPrimaryRole(cachedProfile);
				setActiveRole(cachedRole);
				localStorage.setItem(ADMIN_AUTH_STORAGE.activeRoleKey, cachedRole);
			}

			getUserProfileApi()
				.then((res) => {
					const mergedProfile = mergeClinicMetadata(res.data, cachedProfile);
					setUserProfile(mergedProfile);
					localStorage.setItem(ADMIN_AUTH_STORAGE.userInfoKey, JSON.stringify(mergedProfile));

					if (!localStorage.getItem(ADMIN_AUTH_STORAGE.activeRoleKey)) {
						const resolvedRole = getPrimaryRole(mergedProfile);
						setActiveRole(resolvedRole);
						localStorage.setItem(ADMIN_AUTH_STORAGE.activeRoleKey, resolvedRole);
					}
				})
				.catch(() => {
					setUserProfile(cachedProfile || null);
				});
		} else {
			setUserProfile(null);
			setActiveRole(null);
			localStorage.removeItem(ADMIN_AUTH_STORAGE.activeRoleKey);
		}
	}, [token]);

	const login = (accessToken, profile = null) => {
		clearLegacyAuthStorage();
		localStorage.setItem(ADMIN_AUTH_STORAGE.tokenKey, accessToken);
		if (profile) {
			const mergedProfile = mergeClinicMetadata(profile, readStoredAdminProfile());
			const resolvedRole = getPrimaryRole(mergedProfile);
			localStorage.setItem(ADMIN_AUTH_STORAGE.userInfoKey, JSON.stringify(mergedProfile));
			localStorage.setItem(ADMIN_AUTH_STORAGE.activeRoleKey, resolvedRole);
			setUserProfile(mergedProfile);
			setActiveRole(resolvedRole);
		}
		setToken(accessToken);
	};

	const logout = () => {
		clearAuthStorage(ADMIN_AUTH_STORAGE);
		clearLegacyAuthStorage();
		localStorage.removeItem(ADMIN_AUTH_STORAGE.activeRoleKey);
		setToken(null);
		setUserProfile(null);
		setActiveRole(null);
	};

	const refreshUserProfile = async () => {
		if (!token) return;
		try {
			const res = await getUserProfileApi();
			const mergedProfile = mergeClinicMetadata(res.data, readStoredAdminProfile());
			setUserProfile(mergedProfile);
			localStorage.setItem(ADMIN_AUTH_STORAGE.userInfoKey, JSON.stringify(mergedProfile));
			if (!localStorage.getItem(ADMIN_AUTH_STORAGE.activeRoleKey)) {
				const resolvedRole = getPrimaryRole(mergedProfile);
				setActiveRole(resolvedRole);
				localStorage.setItem(ADMIN_AUTH_STORAGE.activeRoleKey, resolvedRole);
			}
			return mergedProfile;
		} catch {
			setUserProfile(null);
		}
	};

	return (
		<AuthContext.Provider value={{ token, login, logout, userProfile, refreshUserProfile, activeRole }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	return useContext(AuthContext);
};
