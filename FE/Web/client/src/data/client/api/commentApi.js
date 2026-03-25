import instance from './instance'

export const getReplies = async ({ limit = 10, parentId, createdAt } = {}) => {
	const response = await instance.get('/comment/replies', {
		params: {
			limit,
			parentId,
			createdAt,
		},
	})

	return response.data
}

export const createComment = async (payload) => {
	const response = await instance.post('/comment', payload)
	return response.data
}

export const updateComment = async (commentId, payload) => {
	const response = await instance.put(`/comment/${commentId}`, payload)
	return response.data
}

export const deleteComment = async (commentId) => {
	const response = await instance.delete(`/comment/${commentId}`)
	return response.data
}

export default {
	getReplies,
	createComment,
	updateComment,
	deleteComment,
}
