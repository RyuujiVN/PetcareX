import instance from './instance'

export const getVeterinarianUserByIdApi = (userId) => {
	return instance.get(`/user/${userId}`).then((response) => response.data)
}

// Backend must support searching users by email via /user?search=... or provide GET /user/by-email.
export const searchVeterinarianUsersApi = ({ search, page = 1, limit = 20 } = {}) => {
	return instance
		.get('/user', {
			params: {
				page,
				limit,
				search: search || '',
			},
		})
		.then((response) => response.data)
}

// Placeholder password is set by FE; backend should replace with random password + email flow later.
export const registerVeterinarianUserApi = (payload) => {
	return instance.post('/auth/register', payload).then((response) => response.data)
}
