import request from './forumFetchClient'

export const getTopics = ({ page = 1, limit = 10, search } = {}) =>
	request('/topic', {
		params: {
			page,
			limit,
			search,
		},
	})

export const getAllTopics = () => request('/topic/get-all')

export const createTopic = (data) =>
	request('/topic', {
		method: 'POST',
		body: data,
	})

export const updateTopic = (id, data) =>
	request(`/topic/${id}`, {
		method: 'PUT',
		body: data,
	})

export const deleteTopic = (id) =>
	request(`/topic/${id}`, {
		method: 'DELETE',
	})

export default {
	getTopics,
	getAllTopics,
	createTopic,
	updateTopic,
	deleteTopic,
}
