import instance from "./instance"

const getAllRoom = async () => {
  const response = await instance.get('/room')

  return response.data
}

const getAllMessageInRoom = async (roomId, query) => {
  const response = await instance(`room/${roomId}/messages`, {
    params: query
  })

  return response.data
}

export const chatbotApi = {
  getAllRoom,
  getAllMessageInRoom
}