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
import AdminClinicLayout from '../layouts/Clinic/AdminClinicLayout'
import AdminRegister from '../pages/Clinic/Auth/Register'
import AdminForgotPassword from '../pages/Clinic/Auth/ForgotPassword'
import AdminReEnterPassword from '../pages/Clinic/Auth/ReEnterPassword'
import AppointmentManagement from '../pages/Clinic/VeterinaryClinic/AppointmentManagement/appointmentManagement'
import AdminListPetMedicalRecords from '../pages/Clinic/VeterinaryClinic/ListPetMedicalRecords/listPetMedicalRecords'
import AdminClinicProfile from '../pages/Clinic/VeterinaryClinic/ProfileAdminClinic/profileAdminClinic'
import VererianrianManagement from '../pages/Clinic/VeterinaryClinic/VererianrianManagement/vererianrianManagement'
import AddNewVererianrian from '../pages/Clinic/VeterinaryClinic/AddNewVererianrian/addNewVererianrian'
import InformationVererianrian from '../pages/Clinic/VeterinaryClinic/InformationVererianrian/InformationVererianrian'
import PetMedicalRecords from '../pages/Clinic/VeterinaryClinic/PetMedicalRecords/petMedicalRecords'
import ListPetExaminationRecords from '../pages/Clinic/VeterinaryClinic/ListPetExaminationRecords/listPetExaminationRecords'
import MessageBox from "../pages/client/Home/ChatBotAI/MessageBox";
import AdminVererianrianLayout from './../layouts/Vererianrian/AdminVererianrianLayout';
import PetAppointmentVererianrian from './../pages/Vererianrian/PetAppointmentVererianrian/petAppointmentVererianrian';
import ListMedicalRecords from './../pages/Vererianrian/ListMedicalRecords/listMedicalRecords';
import ViewPetMedicalRecords from './../pages/Vererianrian/ViewPetMedicalRecords/viewPetMedicalRecords';
import ListExaminationForm from './../pages/Vererianrian/ListExaminationForm/listExaminationForm';
import RecordExaminationForm from './../pages/Vererianrian/RecordExaminationForm/recordExaminationForm';
import AdminLayout from '../layouts/admin/AdminLayout';
import Clinics from '../pages/admin/Dashboard/Clinics';
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
        {/* TODO: thêm route cho Overview, Users, Posts khi có component */}
      </Route>

      {/* ── Admin Clinic (role ADMIN_CLINIC) ── */}
      <Route element={<AdminClinicLayout />}>
        <Route path="/clinic/appointments" element={<AppointmentManagement />} />
        <Route path="/clinic/profile" element={<AdminClinicProfile />} />
        <Route path="/clinic/medical-records" element={<AdminListPetMedicalRecords />} />
        <Route path="/clinic/revenue" element={<AppointmentManagement />} />
        <Route path="/clinic/veterinarians" element={<VererianrianManagement />} />
        <Route path="/clinic/veterinarians/add-new" element={<AddNewVererianrian />} />
        <Route path="/clinic/veterinarians/information" element={<InformationVererianrian />} />
        <Route path="/clinic/exam-slips" element={<ListPetExaminationRecords />} />
        <Route path="/clinic/exam-slips/:appointmentId" element={<PetMedicalRecords />} />
      </Route>

      <Route path="/veterinarian/login" element={<Navigate to="/login" replace />} />
      <Route path="/veterinarian/register" element={<AdminRegister />} />
      <Route path="/veterinarian/forgot-password" element={<AdminForgotPassword />} />
      <Route path="/veterinarian/reEnterPassword" element={<AdminReEnterPassword />} />
      <Route path="/veterinarian/confirm-password" element={<Navigate to="/veterinarian/reEnterPassword" replace />}/>

      <Route element={<AdminVererianrianLayout/>}>
        <Route path="/veterinarian/appointments" element={<PetAppointmentVererianrian />} />
        <Route path="/veterinarian/listRecords" element={<ListMedicalRecords />} />
        <Route path="/veterinarian/viewRecords" element={<ViewPetMedicalRecords />} />
        <Route path="/veterinarian/exam-forms" element={<ListExaminationForm />} />
        <Route path="/veterinarian/exam-forms/create" element={<RecordExaminationForm />} />
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

      <Route path="/admin/clinic/*" element={<Navigate to="/clinic/appointments" replace />} />
      <Route path="/admin/veterinarian/*" element={<Navigate to="/veterinarian/appointments" replace />} />
      <Route path="/admin/*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
