import { configureStore } from '@reduxjs/toolkit'
import messageReducer from './slices/messageSlice'
import roomReducer from './slices/roomSlice'


export const store = configureStore({
  reducer: {
    message: messageReducer,
    room: roomReducer
  },
})