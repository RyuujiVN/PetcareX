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
import AdminRegister from '../pages/adminClinic/Auth/Register'
import AdminForgotPassword from '../pages/adminClinic/Auth/ForgotPassword'
import AdminReEnterPassword from '../pages/adminClinic/Auth/ReEnterPassword'
import AppointmentManagement from '../pages/adminClinic/VeterinaryClinic/AppointmentManagement/appointmentManagement'
import AdminListPetMedicalRecords from '../pages/adminClinic/VeterinaryClinic/ListPetMedicalRecords/listPetMedicalRecords'
import AdminClinicProfile from '../pages/adminClinic/VeterinaryClinic/ProfileAdminClinic/profileAdminClinic'
import VererianrianManagement from '../pages/adminClinic/VeterinaryClinic/VererianrianManagement/vererianrianManagement'
import AddNewVererianrian from '../pages/adminClinic/VeterinaryClinic/AddNewVererianrian/addNewVererianrian'
import InformationVererianrian from '../pages/adminClinic/VeterinaryClinic/InformationVererianrian/InformationVererianrian'
import PetMedicalRecords from '../pages/adminClinic/VeterinaryClinic/PetMedicalRecords/petMedicalRecords'
import ListPetExaminationRecords from '../pages/adminClinic/VeterinaryClinic/ListPetExaminationRecords/listPetExaminationRecords'
import MessageBox from "../pages/client/Home/ChatBotAI/MessageBox";
import AdminVererianrianLayout from './../layouts/adminVererianrian/AdminVererianrianLayout';
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

      <Route element={<AdminClinicLayout />}>
        <Route path="/admin/home" element={<AppointmentManagement />} />
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
        <Route path="/admin/veterinarian/appointments" element={<AppointmentManagement />} />
        <Route path="/admin/veterinarian/profile" element={<AdminClinicProfile />} />
        <Route path="/admin/veterinarian/medical-records" element={<AdminListPetMedicalRecords />} />
        <Route path="/admin/veterinarian/exam-slips" element={<ListPetExaminationRecords />} />
        <Route path="/admin/veterinarian/exam-slips/:appointmentId" element={<PetMedicalRecords />} />
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
