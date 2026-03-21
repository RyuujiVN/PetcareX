import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import ForgotPassword from './pages/Auth/ForgotPassword'
import ReEnterPassword from './pages/Auth/ReEnterPassword'
import AppointmentManagement from './pages/VeterinaryClinic/AppointmentManagement/appointmentManagement'
import ViewPetAppointment from './pages/VeterinaryClinic/ViewPetAppointment/viewPetAppointment'
import ListPetMedicalRecords from './pages/VeterinaryClinic/ListPetMedicalRecords/listPetMedicalRecords'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reEnterPassword" element={<ReEnterPassword />} />
      <Route path="/confirm-password" element={<Navigate to="/reEnterPassword" replace />} />
      <Route path="/home" element={<AppointmentManagement />} />
      <Route path="/clinic/appointments" element={<AppointmentManagement />} />
      <Route path="/clinic/view-pet-appointment" element={<ViewPetAppointment />} />
      <Route path="/clinic/medical-records" element={<ListPetMedicalRecords />} />
      <Route path="/clinic/revenue" element={<AppointmentManagement />} />
      <Route path="/clinic/doctors" element={<AppointmentManagement />} />
      <Route path="/clinic/exam-slips" element={<AppointmentManagement />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App