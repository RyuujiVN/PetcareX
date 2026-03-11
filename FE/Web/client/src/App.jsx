import { Routes, Route } from 'react-router-dom'
import HomePage from './component/HomePage'
import HomePageClinic from './component/HomePageClinic'
import Login from './component/login'
import Register from './component/register'
import ForgotPassword from './component/ForgotPassword'
import ReEnterPassword from './component/reEnterPassword'
import ClinicSelection from './component/ChoiceHospital/ClinicSelection'
import PageMainUser from './component/pageMainUser'
import { AuthProvider } from "./context/AuthContext"
import BookingAppointment from './component/bookingAppointment'
import AddPet from './component/addPet'
import ChatBotAI from './component/chatBotAI'
import ProfileUser from './component/profileUser'

import './App.css'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/clinic" element={<HomePageClinic />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reEnterPassword" element={<ReEnterPassword />} />
        <Route path="/choose-clinic" element={<ClinicSelection />} />
        <Route path="/main-user" element={<PageMainUser />} />
        <Route path="/booking" element={<BookingAppointment />} />
        <Route path="/add-pet" element={<AddPet />} />
        <Route path="/chatbot" element={<ChatBotAI />} />
        <Route path="/profile" element={<ProfileUser />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
