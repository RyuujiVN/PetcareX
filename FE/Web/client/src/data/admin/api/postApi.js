import instance from './instance'

export const getPostListApi = (limit = 20, lastPostTime) => {
  return instance
    .get('/post', {
      params: {
        limit,
        ...(lastPostTime ? { lastPostTime } : {}),
      },
    })
    .then((response) => response.data)
}
