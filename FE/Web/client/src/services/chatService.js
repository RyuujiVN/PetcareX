// Lấy tất cả các đoạn chat 
export const getAllRoomsApi = async (instance) => {
  const response = await instance.get('/room')
  return response.data
}
// Lấy thông tin chi tiết của đoạn chat
export const getMessagesInRoomApi = async (instance, roomId, query) => {
  const response = await instance.get(`/room/${roomId}/messages`, {
    params: query,
  })
  return response.data
}
// Tạo đoạn chat mới
export const createRoomApi = async (instance, data) => {
  const response = await instance.post('/room', data)
  return response.data
}
// Đổi tên đoạn chat
export const renameRoomApi = async (instance, id, data) => {
  const response = await instance.patch(`/room/${id}`, data)
  return response.data
}
// Xóa đoạn chat
export const deleteRoomApi = async (instance, id) => {
  const response = await instance.delete(`/room/${id}`)
  return response.data
}
// Gửi message cho API AI
export const sendMessageApi = async (instance, data) => {
  const response = await instance.post('/message', data)
  return response.data
}
