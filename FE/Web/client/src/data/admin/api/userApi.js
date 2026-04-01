import instance from './instance'

export const getUserListApi = (page = 1, limit = 10, search = '') => {
  return instance
    .get('/user', {
      params: {
        page,
        limit,
        ...(search ? { search } : {}),
      },
    })
    .then((response) => response.data)
}

export const deleteUserApi = (userId) => {
  return instance.delete(`/user/${userId}`).then((response) => response.data)
}
