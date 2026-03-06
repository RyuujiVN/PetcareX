import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './component/login'
import Register from './component/register'
import ForgotPassword from './component/ForgotPassword'
import ReEnterPassword from './component/reEnterPassword'
import './App.css'



function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reEnterPassword" element={<ReEnterPassword />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
