import { Routes, Route, useLocation } from 'react-router-dom'
import HomePage from './pages/Home/HomePage'
import HomePageClinic from './pages/Home/HomePageClinic'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import ForgotPassword from './pages/Auth/ForgotPassword'
import ReEnterPassword from './pages/Auth/ReEnterPassword'
import ClinicSelection from './pages/Home/ClinicSelection'
import BookingAppointment from './pages/User/BookingAppointment'
import AddPet from './pages/User/AddPet'
import ChatBotAI from './pages/Home/ChatBotAI'
import ProfileUser from './pages/User/ProfileUser'
import AppointmentDetail from './pages/User/AppointmentDetail'
import SuccessBooking from './pages/User/SuccessBooking'
import PetProfile from './pages/User/PetProfile'
import ListPet from './pages/User/ListPet';
import MedicalRecords from './pages/User/MedicalRecords/medicalRecords'
import Forum from './pages/User/Forum/forum'
import ListPetMedicalRecords from './pages/User/ListPetMedicalRecords/listMedicalRecords'
import './App.css'
import ScrollToTop from './ScrollToTop'
function App() {
  const location = useLocation()

  return (
    <div className="route-transition" key={`${location.pathname}${location.search}`}>
      <ScrollToTop />
      <Routes location={location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/clinic" element={<HomePageClinic />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reEnterPassword" element={<ReEnterPassword />} />
        <Route path="/choose-clinic" element={<ClinicSelection />} />
        <Route path="/booking" element={<BookingAppointment />} />
        <Route path="/add-pet" element={<AddPet />} />
        <Route path="/chatbot" element={<ChatBotAI />} />
        <Route path="/profile" element={<ProfileUser />} />
        <Route path="/appointments" element={<AppointmentDetail />} />
        <Route path="/success-booking" element={<SuccessBooking />} />
        <Route path="/petProfile" element={<PetProfile />} />
        <Route path="/listPet" element={<ListPet />} />
        <Route path="/medical-records" element={<MedicalRecords />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/listPetMedicalRecords" element={<ListPetMedicalRecords />} />
      </Routes>
    </div>
  )
}

export default App
