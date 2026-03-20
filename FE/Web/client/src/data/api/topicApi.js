import instance from './instance'

export const getTopics = async ({ page = 1, limit = 10, search } = {}) => {
	const response = await instance.get('/topic', {
		params: {
			page,
			limit,
			search,
		},
	})

	return response.data
}

export const getAllTopics = async () => {
	const response = await instance.get('/topic/get-all')
	return response.data
}

export const createTopic = async (payload) => {
	const response = await instance.post('/topic', payload)
	return response.data
}

export const updateTopic = async (topicId, payload) => {
	const response = await instance.put(`/topic/${topicId}`, payload)
	return response.data
}

export const deleteTopic = async (topicId) => {
	const response = await instance.delete(`/topic/${topicId}`)
	return response.data
}

export default {
	getTopics,
	getAllTopics,
	createTopic,
	updateTopic,
	deleteTopic,
}
