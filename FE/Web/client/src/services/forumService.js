// Lấy danh sách bài viết
export const getPostsApi = async (instance, { limit = 20, lastPostTime } = {}) => {
  const response = await instance.get('/post', {
    params: { limit, lastPostTime },
  })
  return response.data
}
// Tạo bài viết mới
export const getPostListApi = (instance, limit = 20, lastPostTime) => {
  return instance
    .get('/post', {
      params: {
        limit,
        ...(lastPostTime ? { lastPostTime } : {}),
      },
    })
    .then((response) => response.data)
}
// Lấy thông tin chi tiết của bài viết
export const createPostApi = async (instance, payload) => {
  const response = await instance.post('/post', payload)
  return response.data
}
// Cập nhật bài viết
export const updatePostApi = async (instance, postId, payload) => {
  const response = await instance.put(`/post/${postId}`, payload)
  return response.data
}
// Xóa bài viết
export const deletePostApi = async (instance, postId) => {
  const response = await instance.delete(`/post/${postId}`)
  return response.data
}
// Thích bài viết
export const likePostApi = async (instance, postId) => {
  const response = await instance.post(`/post/${postId}/like`)
  return response.data
}
// Bỏ thích bài viết
export const unlikePostApi = async (instance, postId) => {
  const response = await instance.delete(`/post/${postId}/remove-like`)
  return response.data
}

// Báo cáo bài viết (nếu backend hỗ trợ endpoint)
export const reportPostApi = async (instance, postId, payload) => {
  const response = await instance.post(`/post/${postId}/report`, payload)
  return response.data
}

// Bỏ thích bài viết
export const removeLikeApi = unlikePostApi
// Lấy danh sách bình luận của bài viết
export const getCommentsByPostApi = async (
  instance,
  postId,
  { limit = 10, createdAt } = {},
) => {
  const response = await instance.get(`/post/${postId}/comments`, {
    params: { limit, createdAt },
  })
  return response.data
}
// Lấy danh sách bình luận của bài viết
export const getCommentsByPostIdApi = getCommentsByPostApi

// Lấy danh sách chủ đề
export const getTopicsApi = async (
  instance,
  { page = 1, limit = 10, search } = {},
) => {
  const response = await instance.get('/topic', {
    params: { page, limit, search },
  })
  return response.data
}
// Lấy tất cả chủ đề (không phân trang)
export const getAllTopicsApi = async (instance) => {
  const response = await instance.get('/topic/get-all')
  return response.data
}
// Tạo chủ đề mới
export const createTopicApi = async (instance, payload) => {
  const response = await instance.post('/topic', payload)
  return response.data
}
// Cập nhật chủ đề
export const updateTopicApi = async (instance, topicId, payload) => {
  const response = await instance.put(`/topic/${topicId}`, payload)
  return response.data
}
// Xóa chủ đề
export const deleteTopicApi = async (instance, topicId) => {
  const response = await instance.delete(`/topic/${topicId}`)
  return response.data
}

// Lấy danh sách câu trả lời của bình luận
export const getRepliesApi = async (
  instance,
  { limit = 10, parentId, createdAt } = {},
) => {
  const response = await instance.get('/comment/replies', {
    params: { limit, parentId, createdAt },
  })
  return response.data
}
// Tạo bình luận mới
export const createCommentApi = async (instance, payload) => {
  const response = await instance.post('/comment', payload)
  return response.data
}
// Cập nhật bình luận
export const updateCommentApi = async (instance, commentId, payload) => {
  const response = await instance.put(`/comment/${commentId}`, payload)
  return response.data
}
// Xóa bình luận
export const deleteCommentApi = async (instance, commentId) => {
  const response = await instance.delete(`/comment/${commentId}`)
  return response.data
}
