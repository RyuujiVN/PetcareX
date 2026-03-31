import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import instance from "../../data/client/api/instance"

const initialState = {
  rooms: [],
}

// Lấy danh sách tất cả room
export const fetchRooms = createAsyncThunk(
  "room/fetchRooms",
  async () => {
    const response = await instance.get("/room")
    return response.data
  }
)

// Tạo mới room
export const fetchCreateRoom = createAsyncThunk(
  'room/fetchCreateRoom',
  async (data) => {
    const response = await instance.post("/room", data)

    return response.data
  },
)

// Chỉnh sửa tên room
export const fetchRenameRoom = createAsyncThunk(
  'room/fetchRenameRoom',
  async ({ id, data }) => {
    const response = await instance.patch(`/room/${id}`, data)

    return response.data
  },
)

// Xoá room
export const fetchDeleteRoom = createAsyncThunk(
  'room/fetchDeleteRoom',
  async ({ id }) => {
    const response = await instance.delete(`/room/${id}`)

    return response.data
  },
)


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

// Action creators are generated for each case reducer function
export const { addRoom } = roomSlice.actions

export default roomSlice.reducer