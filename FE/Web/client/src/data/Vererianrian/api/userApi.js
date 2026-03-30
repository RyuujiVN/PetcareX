import instance from './instance'

export const getVeterinarianUserByIdApi = (userId) => {
	return instance.get(`/user/${userId}`).then((response) => response.data)
}
