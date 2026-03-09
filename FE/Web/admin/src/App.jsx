import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './component/HomePage'
import Login from './component/login'
import Register from './component/register'
import ForgotPassword from './component/ForgotPassword'
import ReEnterPassword from './component/reEnterPassword'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reEnterPassword" element={<ReEnterPassword />} />
    </Routes>
  )
}

export default App
