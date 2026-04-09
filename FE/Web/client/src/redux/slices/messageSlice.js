import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getClientInstance } from '../../services/apiClient'
import { getMessagesInRoomApi, sendMessageApi } from '../../services/chatService'

const initialState = {
  messages: [],
  hasMoreMessage: true
}
// Lấy danh sách message trong đoạn chat
export const fetchMessageInRoom = createAsyncThunk(
  'message/fetchMessageInRoom',
  async ({ roomId, query }) => {
    return getMessagesInRoomApi(getClientInstance(), roomId, query)
  },
)
// Lấy danh sách message cũ trong đoạn chat
export const fetchOldMessageInRoom = createAsyncThunk(
  'message/fetchOldMessageInRoom',
  async ({ roomId, query }) => {
    return getMessagesInRoomApi(getClientInstance(), roomId, query)
  },
)
// Gửi message
export const fetchSendMessage = createAsyncThunk(
  'message/fetchSendMessage',
  async (data) => {
    return sendMessageApi(getClientInstance(), data)
  },
)
// Slice message
export const messageSlice = createSlice({
  name: 'message',
  initialState,
  reducers: {
    addMessage: (state, action) => {
      state.messages.push(action.payload)
    },

    editAiMessage: (state, action) => {
      const { type, data } = action.payload
      const indexAiMessage = state.messages.length - 1
      const lastMessage = state.messages[indexAiMessage]

      switch (type) {
        case "AI_STREAMING":
          if (lastMessage.sendBy === "USER") {
            const objTemp = {
              id: 'temp',
              sendBy: 'AI',
              content: '',
              roomId: '',
              createdAt: ''
            }

            state.messages.push(objTemp)
          }
          else {
            lastMessage.content = lastMessage.content + data
          }
          break;

        case "AI_ANWSER":
          Object.assign(lastMessage, data)
          break;
        default:
          break;
      }
    }
  },

  extraReducers: (builder) => {
    builder.addCase(fetchMessageInRoom.fulfilled, (state, action) => {
      if (action.payload.length < 10)
        state.hasMoreMessage = false;
      else
        state.hasMoreMessage = true;

      state.messages = action.payload
    })

    builder.addCase(fetchOldMessageInRoom.fulfilled, (state, action) => {
      if (action.payload.length < 10)
        state.hasMoreMessage = false;
      else
        state.hasMoreMessage = true;

      state.messages = [...action.payload, ...state.messages]
    })

    builder.addCase(fetchSendMessage.fulfilled, (state, action) => {
      state.messages.push(action.payload)
    })
  }
})
// Export actions and reducer
export const { addMessage, editAiMessage } = messageSlice.actions

export default messageSlice.reducer
