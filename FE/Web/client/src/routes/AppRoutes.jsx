import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from '../layouts/admin/AdminLayout'
import AdminClinicLayout from '../layouts/adminClinic/AdminClinicLayout'
import HeaderLayout from '../layouts/client/HeaderLayout'
import MainLayout from '../layouts/client/MainLayout'
import Clinics from '../pages/admin/Dashboard/Clinics'
import Posts from '../pages/admin/Dashboard/Posts'
import Users from '../pages/admin/Dashboard/Users'
import AdminForgotPassword from '../pages/adminClinic/Auth/ForgotPassword'
import AdminReEnterPassword from '../pages/adminClinic/Auth/ReEnterPassword'
import AdminRegister from '../pages/adminClinic/Auth/Register'
import AddNewVererianrian from '../pages/adminClinic/VeterinaryClinic/AddNewVererianrian/addNewVererianrian'
import AppointmentManagement from '../pages/adminClinic/VeterinaryClinic/AppointmentManagement/appointmentManagement'
import InformationVererianrian from '../pages/adminClinic/VeterinaryClinic/InformationVererianrian/InformationVererianrian'
import ListPetExaminationRecords from '../pages/adminClinic/VeterinaryClinic/ListPetExaminationRecords/listPetExaminationRecords'
import AdminListPetMedicalRecords from '../pages/adminClinic/VeterinaryClinic/ListPetMedicalRecords/listPetMedicalRecords'
import PetMedicalRecords from '../pages/adminClinic/VeterinaryClinic/PetMedicalRecords/petMedicalRecords'
import AdminClinicProfile from '../pages/adminClinic/VeterinaryClinic/ProfileAdminClinic/profileAdminClinic'
import VererianrianManagement from '../pages/adminClinic/VeterinaryClinic/VererianrianManagement/vererianrianManagement'
import ForgotPassword from '../pages/client/Auth/ForgotPassword'
import Login from '../pages/client/Auth/Login'
import ReEnterPassword from '../pages/client/Auth/ReEnterPassword'
import Register from '../pages/client/Auth/Register'
import ChatBotAI from '../pages/client/Home/ChatBotAI'
import MessageBox from "../pages/client/Home/ChatBotAI/MessageBox"
import ClinicSelection from '../pages/client/Home/ClinicSelection'
import HomePage from '../pages/client/Home/HomePage'
import HomePageClinic from '../pages/client/Home/HomePageClinic'
import AddPet from '../pages/client/User/AddPet'
import AppointmentDetail from '../pages/client/User/AppointmentDetail'
import BookingAppointment from '../pages/client/User/BookingAppointment'
import Forum from '../pages/client/User/Forum/forum'
import ListPet from '../pages/client/User/ListPet'
import ListPetMedicalRecords from '../pages/client/User/ListPetMedicalRecords/listMedicalRecords'
import MedicalRecords from '../pages/client/User/MedicalRecords/medicalRecords'
import PetProfile from '../pages/client/User/PetProfile'
import ProfileUser from '../pages/client/User/ProfileUser'
import SuccessBooking from '../pages/client/User/SuccessBooking'
import AdminVererianrianLayout from './../layouts/adminVererianrian/AdminVererianrianLayout'
import ListExaminationForm from './../pages/adminVererianrian/ListExaminationForm/listExaminationForm'
import ListMedicalRecords from './../pages/adminVererianrian/ListMedicalRecords/listMedicalRecords'
import PetAppointmentVererianrian from './../pages/adminVererianrian/PetAppointmentVererianrian/petAppointmentVererianrian'
import RecordExaminationForm from './../pages/adminVererianrian/RecordExaminationForm/recordExaminationForm'
import ViewPetMedicalRecords from './../pages/adminVererianrian/ViewPetMedicalRecords/viewPetMedicalRecords'
export default function AppRoutes({ location }) {
  return (
    <Routes location={location}>
      <Route path="/admin" element={<Navigate to="/login" replace />} />
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />
      <Route path="/admin/register" element={<AdminRegister />} />
      <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
      <Route path="/admin/reEnterPassword" element={<AdminReEnterPassword />} />
      <Route path="/admin/confirm-password" element={<Navigate to="/admin/reEnterPassword" replace />}
      />

      {/* ── Super Admin (role ADMIN) ── */}
      <Route element={<AdminLayout />}>
        <Route path="/admin/home" element={<Clinics />} />
        <Route path="/admin/dashboard/clinics" element={<Clinics />} />
        <Route path="/admin/dashboard/users" element={<Users />} />
        <Route path="/admin/dashboard/posts" element={<Posts />} />
        {/* TODO: thêm route cho Overview khi có component */}
      </Route>

      {/* ── Admin Clinic (role ADMIN_CLINIC) ── */}
      <Route element={<AdminClinicLayout />}>
        <Route path="/admin/clinic/appointments" element={<AppointmentManagement />} />
        <Route path="/admin/clinic/profile" element={<AdminClinicProfile />} />
        <Route path="/admin/clinic/medical-records" element={<AdminListPetMedicalRecords />} />
        <Route path="/admin/clinic/revenue" element={<AppointmentManagement />} />
        <Route path="/admin/clinic/veterinarians" element={<VererianrianManagement />} />
        <Route path="/admin/clinic/veterinarians/add-new" element={<AddNewVererianrian />} />
        <Route path="/admin/clinic/veterinarians/information" element={<InformationVererianrian />} />
        <Route path="/admin/clinic/exam-slips" element={<ListPetExaminationRecords />} />
        <Route path="/admin/clinic/exam-slips/:appointmentId" element={<PetMedicalRecords />} />
      </Route>

      <Route path="/admin/veterinarian/login" element={<Navigate to="/login" replace />} />
      <Route path="/admin/veterinarian/register" element={<AdminRegister />} />
      <Route path="/admin/veterinarian/forgot-password" element={<AdminForgotPassword />} />
      <Route path="/admin/veterinarian/reEnterPassword" element={<AdminReEnterPassword />} />
      <Route path="/admin/veterinarian/confirm-password" element={<Navigate to="/admin/veterinarian/reEnterPassword" replace />}
      />

      <Route element={<AdminVererianrianLayout/>}>
        <Route path="/admin/veterinarian/appointments" element={<PetAppointmentVererianrian />} />
        <Route path="/admin/veterinarian/listRecords" element={<ListMedicalRecords />} />
        <Route path="/admin/veterinarian/viewRecords" element={<ViewPetMedicalRecords />} />
        <Route path="/admin/veterinarian/exam-forms" element={<ListExaminationForm />} />
        <Route path="/admin/veterinarian/exam-forms/create" element={<RecordExaminationForm />} />
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
        <Route path="/listPet" element={<ListPet />} />
        <Route path="/medical-records" element={<MedicalRecords />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/listPetMedicalRecords" element={<ListPetMedicalRecords />}
        />
      </Route>

      <Route path="/admin/*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
