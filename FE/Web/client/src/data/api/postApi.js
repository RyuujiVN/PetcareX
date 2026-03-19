import request from './forumFetchClient'

export const getPosts = ({ limit = 20, lastPostTime } = {}) =>
	request('/post', {
		params: {
			limit,
			lastPostTime,
		},
	})

export const createPost = (data) =>
	request('/post', {
		method: 'POST',
		body: data,
	})

export const updatePost = (id, data) =>
	request(`/post/${id}`, {
		method: 'PUT',
		body: data,
	})

export const deletePost = (id) =>
	request(`/post/${id}`, {
		method: 'DELETE',
	})

export const likePost = (id) =>
	request(`/post/${id}/like`, {
		method: 'POST',
	})

export const unlikePost = (id) =>
	request(`/post/${id}/remove-like`, {
		method: 'DELETE',
	})

export const getCommentsByPostId = (postId, { limit = 10, createdAt } = {}) =>
	request(`/post/${postId}/comments`, {
		params: {
			limit,
			createdAt,
		},
	})

export default {
	getPosts,
	createPost,
	updatePost,
	deletePost,
	likePost,
	unlikePost,
	getCommentsByPostId,
}
