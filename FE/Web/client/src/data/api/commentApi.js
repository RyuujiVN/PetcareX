import request from './forumFetchClient'

export const getReplies = ({ limit = 10, parentId, createdAt } = {}) =>
	request('/comment/replies', {
		params: {
			limit,
			parentId,
			createdAt,
		},
	})

export const createComment = (data) =>
	request('/comment', {
		method: 'POST',
		body: data,
	})

export const updateComment = (id, data) =>
	request(`/comment/${id}`, {
		method: 'PUT',
		body: data,
	})

export const deleteComment = (id) =>
	request(`/comment/${id}`, {
		method: 'DELETE',
	})

export default {
	getReplies,
	createComment,
	updateComment,
	deleteComment,
}
