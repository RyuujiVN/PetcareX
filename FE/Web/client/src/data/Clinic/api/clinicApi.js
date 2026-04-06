import instance from './instance'

export const getClinicByIdApi = (clinicId) => {
	if (!clinicId) return Promise.resolve(null)
	return instance.get(`/clinic/${clinicId}`).then((response) => response.data)
}
