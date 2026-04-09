import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import { getClientInstance } from "../../services/apiClient"
import {
  createRoomApi,
  deleteRoomApi,
  getAllRoomsApi,
  renameRoomApi,
} from "../../services/chatService"

const initialState = {
  rooms: [],
}
// Lấy danh sách room
export const fetchRooms = createAsyncThunk(
  "room/fetchRooms",
  async () => {
    return getAllRoomsApi(getClientInstance())
  }
)
// Tạo room mới
export const fetchCreateRoom = createAsyncThunk(
  'room/fetchCreateRoom',
  async (data) => {
    return createRoomApi(getClientInstance(), data)
  },
)
// Đổi tên room
export const fetchRenameRoom = createAsyncThunk(
  'room/fetchRenameRoom',
  async ({ id, data }) => {
    return renameRoomApi(getClientInstance(), id, data)
  },
)
// Xóa room
export const fetchDeleteRoom = createAsyncThunk(
  'room/fetchDeleteRoom',
  async ({ id }) => {
    return deleteRoomApi(getClientInstance(), id)
  },
)

// Slice room
export const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    addRoom: (state, action) => {
      state.rooms.unshift(action.payload)
    },
  },

  extraReducers: (builder) => {
    builder.addCase(fetchRooms.fulfilled, (state, action) => {
      state.rooms = action.payload
    })

    builder.addCase(fetchCreateRoom.fulfilled, (state, action) => {
      state.rooms.unshift(action.payload)
    })

    builder.addCase(fetchRenameRoom.fulfilled, (state, action) => {
      state.rooms = state.rooms.map((item) => {
        if (item.id === action.payload.id) item = action.payload

        return item
      })
    })

    builder.addCase(fetchDeleteRoom.fulfilled, (state, action) => {
      state.rooms = state.rooms.filter((item) => item.id !== action.payload.roomId)
    })
  }
})
// Export actions and reducer
export const { addRoom } = roomSlice.actions

export default roomSlice.reducer
