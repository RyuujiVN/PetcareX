import instance from './instance'

export const getPosts = async ({ limit = 20, lastPostTime } = {}) => {
	const response = await instance.get('/post', {
		params: {
			limit,
			lastPostTime,
		},
	})

	return response.data
}

export const createPost = async (payload) => {
	const response = await instance.post('/post', payload)
	return response.data
}

export const updatePost = async (postId, payload) => {
	const response = await instance.put(`/post/${postId}`, payload)
	return response.data
}

export const deletePost = async (postId) => {
	const response = await instance.delete(`/post/${postId}`)
	return response.data
}

export const likePost = async (postId) => {
	const response = await instance.post(`/post/${postId}/like`)
	return response.data
}

export const removeLike = async (postId) => {
	const response = await instance.delete(`/post/${postId}/remove-like`)
	return response.data
}

export const unlikePost = removeLike

export const getCommentsByPost = async (postId, { limit = 10, createdAt } = {}) => {
	const response = await instance.get(`/post/${postId}/comments`, {
		params: {
			limit,
			createdAt,
		},
	})

	return response.data
}

export const getCommentsByPostId = getCommentsByPost

export default {
	getPosts,
	createPost,
	updatePost,
	deletePost,
	likePost,
	removeLike,
	unlikePost,
	getCommentsByPost,
	getCommentsByPostId,
}
