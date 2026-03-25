import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from '../pages/client/Home/HomePage'
import HomePageClinic from '../pages/client/Home/HomePageClinic'
import Login from '../pages/client/Auth/Login'
import Register from '../pages/client/Auth/Register'
import ForgotPassword from '../pages/client/Auth/ForgotPassword'
import ReEnterPassword from '../pages/client/Auth/ReEnterPassword'
import ClinicSelection from '../pages/client/Home/ClinicSelection'
import BookingAppointment from '../pages/client/User/BookingAppointment'
import AddPet from '../pages/client/User/AddPet'
import ChatBotAI from '../pages/client/Home/ChatBotAI'
import ProfileUser from '../pages/client/User/ProfileUser'
import AppointmentDetail from '../pages/client/User/AppointmentDetail'
import SuccessBooking from '../pages/client/User/SuccessBooking'
import PetProfile from '../pages/client/User/PetProfile'
import ListPet from '../pages/client/User/ListPet'
import MedicalRecords from '../pages/client/User/MedicalRecords/medicalRecords'
import Forum from '../pages/client/User/Forum/forum'
import ListPetMedicalRecords from '../pages/client/User/ListPetMedicalRecords/listMedicalRecords'
import MainLayout from '../layouts/client/MainLayout'
import HeaderLayout from '../layouts/client/HeaderLayout'
import AdminClinicLayout from '../layouts/adminClinic/AdminClinicLayout'
import AdminLogin from '../pages/adminClinic/Auth/Login'
import AdminRegister from '../pages/adminClinic/Auth/Register'
import AdminForgotPassword from '../pages/adminClinic/Auth/ForgotPassword'
import AdminReEnterPassword from '../pages/adminClinic/Auth/ReEnterPassword'
import AppointmentManagement from '../pages/adminClinic/VeterinaryClinic/AppointmentManagement/appointmentManagement'
import AdminListPetMedicalRecords from '../pages/adminClinic/VeterinaryClinic/ListPetMedicalRecords/listPetMedicalRecords'
import AdminClinicProfile from '../pages/adminClinic/VeterinaryClinic/ProfileAdminClinic/profileAdminClinic'
import VeterinarianManagement from '../pages/adminClinic/VeterinaryClinic/VeterinarianManagement/veterinarianManagement'
import PetMedicalRecords from '../pages/adminClinic/VeterinaryClinic/PetMedicalRecords/petMedicalRecords'
import ListPetExaminationRecords from '../pages/adminClinic/VeterinaryClinic/ListPetExaminationRecords/listPetExaminationRecords'

export default function AppRoutes({ location }) {
  return (
    <Routes location={location}>
      <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/register" element={<AdminRegister />} />
      <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
      <Route path="/admin/reEnterPassword" element={<AdminReEnterPassword />} />
      <Route path="/admin/confirm-password" element={<Navigate to="/admin/reEnterPassword" replace />} />

      <Route element={<AdminClinicLayout />}>
        <Route path="/admin/home" element={<AppointmentManagement />} />
        <Route path="/admin/clinic/appointments" element={<AppointmentManagement />} />
        <Route path="/admin/clinic/profile" element={<AdminClinicProfile />} />
        <Route path="/admin/clinic/medical-records" element={<AdminListPetMedicalRecords />} />
        <Route path="/admin/clinic/revenue" element={<AppointmentManagement />} />
        <Route path="/admin/clinic/veterinarians" element={<VeterinarianManagement />} />
        <Route path="/admin/clinic/exam-slips" element={<ListPetExaminationRecords />} />
        <Route path="/admin/clinic/exam-slips/:appointmentId" element={<PetMedicalRecords />} />
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reEnterPassword" element={<ReEnterPassword />} />

      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/clinic" element={<HomePageClinic />} />
        <Route path="/choose-clinic" element={<ClinicSelection />} />
        <Route path="/booking" element={<BookingAppointment />} />
        <Route path="/appointments" element={<AppointmentDetail />} />
        <Route path="/success-booking" element={<SuccessBooking />} />
      </Route>

      <Route element={<HeaderLayout />}>
        <Route path="/add-pet" element={<AddPet />} />
        <Route path="/chatbot" element={<ChatBotAI />} />
        <Route path="/user/profile" element={<ProfileUser />} />
        <Route path="/profile" element={<Navigate to="/user/profile" replace />} />
        <Route path="/petProfile" element={<PetProfile />} />
        <Route path="/listPet" element={<ListPet />} />
        <Route path="/medical-records" element={<MedicalRecords />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/listPetMedicalRecords" element={<ListPetMedicalRecords />} />
      </Route>

      <Route path="/admin/*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  )
}
