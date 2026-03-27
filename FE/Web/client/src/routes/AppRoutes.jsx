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
import PetDiagnosis from '../pages/client/User/PetDiagnosis/petDiagnosis'
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
import ViewMedicalRecords from '../pages/adminClinic/VeterinaryClinic/ViewMedicalRecords/viewMedicalRecords'
import AdminClinicProfile from '../pages/adminClinic/VeterinaryClinic/ProfileAdminClinic/profileAdminClinic'
import VererianrianManagement from '../pages/adminClinic/VeterinaryClinic/VererianrianManagement/vererianrianManagement'
import AddNewVererianrian from '../pages/adminClinic/VeterinaryClinic/AddNewVererianrian/addNewVererianrian'
import InformationVererianrian from '../pages/adminClinic/VeterinaryClinic/InformationVererianrian/InformationVererianrian'
import PetMedicalRecords from '../pages/adminClinic/VeterinaryClinic/PetMedicalRecords/petMedicalRecords'
import ListPetExaminationRecords from '../pages/adminClinic/VeterinaryClinic/ListPetExaminationRecords/listPetExaminationRecords'
import PetMedicalBill from '../pages/adminClinic/VeterinaryClinic/PetMedicalBill/petMedicalBill'
import PetAppointmentVererianrian from '../pages/adminVererianrian/PetAppointmentVererianrian/petAppointmentVererianrian'
import ListMedicalRecords from '../pages/adminVererianrian/ListMedicalRecords/listMedicalRecords'
import ViewPetMedicalRecords from '../pages/adminVererianrian/ViewPetMedicalRecords/viewPetMedicalRecords'
import AdminVererianrianLayout from '../layouts/adminVererianrian/AdminVererianrianLayout'
import { useAuth } from '../hooks/adminClinic/AuthContext'
import { ADMIN_AUTH_STORAGE } from '../constants/authStorage'
import { isClinicAdminAccount, isVeterinarianAccount } from '../constants/authRole'
import MessageBox from "../pages/client/Home/ChatBotAI/MessageBox";

const getStoredAdminUserInfo = () => {
  try {
    const rawUserInfo = localStorage.getItem(ADMIN_AUTH_STORAGE.userInfoKey)
    return rawUserInfo ? JSON.parse(rawUserInfo) : null
  } catch {
    return null
  }
}

const resolveAdminRouteByRole = (userInfo) => {
  if (isVeterinarianAccount(userInfo) && !isClinicAdminAccount(userInfo)) {
    return '/admin/veterinarian/appointments'
  }

  if (isClinicAdminAccount(userInfo)) {
    return '/admin/home'
  }

  return '/admin/login'
}

function AdminLoginEntry() {
  const { token, userProfile } = useAuth()

  if (!token) return <AdminLogin />

  const routePath = resolveAdminRouteByRole(userProfile || getStoredAdminUserInfo())
  return <Navigate to={routePath} replace />
}

function RequireClinicAdmin({ children }) {
  const { token, userProfile } = useAuth()

  if (!token) return <Navigate to="/admin/login" replace />

  const userInfo = userProfile || getStoredAdminUserInfo()

  if (isVeterinarianAccount(userInfo) && !isClinicAdminAccount(userInfo)) {
    return <Navigate to="/admin/veterinarian/appointments" replace />
  }

  if (!isClinicAdminAccount(userInfo)) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}

function RequireVeterinarian({ children }) {
  const { token, userProfile } = useAuth()

  if (!token) return <Navigate to="/admin/login" replace />

  const userInfo = userProfile || getStoredAdminUserInfo()

  if (!isVeterinarianAccount(userInfo)) {
    return <Navigate to="/admin/home" replace />
  }

  return children
}

export default function AppRoutes({ location }) {
  return (
    <Routes location={location}>
      <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
      <Route path="/admin/login" element={<AdminLoginEntry />} />
      <Route path="/admin/register" element={<AdminRegister />} />
      <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
      <Route path="/admin/reEnterPassword" element={<AdminReEnterPassword />} />
      <Route
        path="/admin/confirm-password"
        element={<Navigate to="/admin/reEnterPassword" replace />}
      />

      <Route element={<RequireClinicAdmin><AdminClinicLayout /></RequireClinicAdmin>}>
        <Route path="/admin/home" element={<AppointmentManagement />} />
        <Route path="/admin/clinic/appointments" element={<AppointmentManagement />} />
        <Route path="/admin/clinic/profile" element={<AdminClinicProfile />} />
        <Route path="/admin/clinic/medical-records" element={<AdminListPetMedicalRecords />} />
        <Route path="/admin/clinic/medical-records/view" element={<ViewMedicalRecords />} />
        <Route path="/admin/clinic/revenue" element={<AppointmentManagement />} />
        <Route path="/admin/clinic/veterinarians" element={<VererianrianManagement />} />
        <Route path="/admin/clinic/veterinarians/add-new" element={<AddNewVererianrian />} />
        <Route path="/admin/clinic/veterinarians/information" element={<InformationVererianrian />} />
        <Route path="/admin/clinic/exam-slips" element={<ListPetExaminationRecords />} />
        <Route path="/admin/clinic/exam-slips/:appointmentId" element={<PetMedicalRecords />} />
        <Route path="/admin/clinic/exam-slips/:appointmentId/bill" element={<PetMedicalBill />} />
      </Route>

      <Route element={<RequireVeterinarian><AdminVererianrianLayout /></RequireVeterinarian>}>
        <Route path="/admin/veterinarian/appointments" element={<PetAppointmentVererianrian />} />
        <Route path="/admin/veterinarian/medical-records" element={<ListMedicalRecords />} />
        <Route path="/admin/veterinarian/medical-records/view" element={<ViewPetMedicalRecords />} />
        <Route path="/admin/veterinarian/exam-slips" element={<ListPetExaminationRecords />} />
        <Route path="/admin/veterinarian/exam-slips/:appointmentId" element={<PetMedicalRecords />} />
        <Route path="/admin/veterinarian/exam-slips/:appointmentId/bill" element={<PetMedicalBill />} />
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
        <Route path="/chatbot" element={<ChatBotAI />}>
          <Route index element={<MessageBox />} />
          <Route path=":roomId" element={<MessageBox />} />
        </Route>
        <Route path="/chat" element={<ChatBotAI />}>
          <Route index element={<MessageBox />} />
          <Route path=":roomId" element={<MessageBox />} />
        </Route>
        <Route path="/profile" element={<ProfileUser />} />
        <Route path="/user/profile" element={<ProfileUser />} />
        <Route path="/petProfile" element={<PetProfile />} />
        <Route path="/petDiagnosis" element={<PetDiagnosis />} />
        <Route path="/listPet" element={<ListPet />} />
        <Route path="/medical-records" element={<MedicalRecords />} />
        <Route path="/forum" element={<Forum />} />
        <Route
          path="/listPetMedicalRecords"
          element={<ListPetMedicalRecords />}
        />
      </Route>

      <Route path="/admin/*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
}
