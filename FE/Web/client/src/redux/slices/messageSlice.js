import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import instance from '../../data/client/api/instance'

const initialState = {
  messages: [],
  hasMoreMessage: true
}

// Lấy danh sách message trong room
export const fetchMessageInRoom = createAsyncThunk(
  'message/fetchMessageInRoom',
  async ({ roomId, query }) => {
    const response = await instance.get(`/room/${roomId}/messages`, {
      params: query
    })

    return response.data
  },
)

// Lấy danh sách message trong room
export const fetchOldMessageInRoom = createAsyncThunk(
  'message/fetchOldMessageInRoom',
  async ({ roomId, query }) => {
    const response = await instance.get(`/room/${roomId}/messages`, {
      params: query
    })

    return response.data
  },
)

// Gửi message
export const fetchSendMessage = createAsyncThunk(
  'message/fetchSendMessage',
  async (data) => {
    const response = await instance.post(`message`, data)

    return response.data
  },
)

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

// Action creators are generated for each case reducer function
export const { addMessage, editAiMessage } = messageSlice.actions

export default messageSlice.reducer