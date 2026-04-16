import { Navigate, Route, Routes } from 'react-router-dom'
import { RoleEnum } from '../enum/role.enum'
import AdminLayout from '../layouts/admin/AdminLayout'
import HeaderLayout from '../layouts/client/HeaderLayout'
import MainLayout from '../layouts/client/MainLayout'
import AdminClinicLayout from '../layouts/Clinic/AdminClinicLayout'
import AdminVererianrianLayout from '../layouts/Vererianrian/AdminVererianrianLayout'
import Clinics from '../pages/admin/Dashboard/Clinics'
import Posts from '../pages/admin/Dashboard/Posts'
import AdminRevenue from '../pages/admin/Dashboard/Revenue'
import Users from '../pages/admin/Dashboard/Users'
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
import ListPetMedicalRecords from '../pages/client/User/ListPetMedicalRecords/listMedicalRecords'
import MedicalRecords from '../pages/client/User/MedicalRecords/medicalRecords'
import PetProfile from '../pages/client/User/PetProfile'
import ProfileUser from '../pages/client/User/ProfileUser'
import SuccessBooking from '../pages/client/User/SuccessBooking'
import AddNewVererianrian from '../pages/Clinic/AddNewVererianrian/addNewVererianrian'
import AppointmentManagement from '../pages/Clinic/AppointmentManagement/appointmentManagement'
import ClinicPortalEditor from '../pages/Clinic/ClinicPortalEditor'
import InformationVererianrian from '../pages/Clinic/InformationVererianrian/InformationVererianrian'
import ListPetExaminationRecords from '../pages/Clinic/ListPetExaminationRecords/listPetExaminationRecords'
import AdminListPetMedicalRecords from '../pages/Clinic/ListPetMedicalRecords/listPetMedicalRecords'
import PetMedicalRecords from '../pages/Clinic/PetMedicalRecords/petMedicalRecords'
import AdminClinicProfile from '../pages/Clinic/ProfileAdminClinic/profileAdminClinic'
import RevenueDashboard from '../pages/Clinic/Revenue/RevenueDashboard'
import VererianrianManagement from '../pages/Clinic/VererianrianManagement/vererianrianManagement'
import ViewMedicalRecords from '../pages/Clinic/ViewMedicalRecords/viewMedicalRecords'
import ListExaminationForm from '../pages/Vererianrian/ListExaminationForm/listExaminationForm'
import ListMedicalRecords from '../pages/Vererianrian/ListMedicalRecords/listMedicalRecords'
import PetAppointmentVererianrian from '../pages/Vererianrian/PetAppointmentVererianrian/petAppointmentVererianrian'
import RecordExaminationForm from '../pages/Vererianrian/RecordExaminationForm/recordExaminationForm'
import ViewPetMedicalRecords from '../pages/Vererianrian/ViewPetMedicalRecords/viewPetMedicalRecords'
import RoleBasedRoute from './RoleBasedRoute'
export default function AppRoutes({ location }) {
  return (
    <Routes location={location}>
      <Route path="/admin" element={<Navigate to="/login" replace />} />
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />
      <Route path="/admin/register" element={<Navigate to="/register" replace />} />
      <Route path="/admin/forgot-password" element={<Navigate to="/forgot-password" replace />} />
      <Route path="/admin/reEnterPassword" element={<Navigate to="/reEnterPassword" replace />} />
      <Route path="/admin/confirm-password" element={<Navigate to="/reEnterPassword" replace />}
      />

      {/* ── Super Admin (role ADMIN) ── */}
      <Route element={<RoleBasedRoute allowedRoles={[RoleEnum.ADMIN]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard/clinics" element={<Clinics />} />
          <Route path="/admin/dashboard/users" element={<Users />} />
          <Route path="/admin/dashboard/posts" element={<Posts />} />
          <Route path="/admin/dashboard/revenue" element={<AdminRevenue />} />
        </Route>
      </Route>

      {/* ── Admin Clinic (role ADMIN_CLINIC) ── */}
      <Route element={<RoleBasedRoute allowedRoles={[RoleEnum.ADMIN_CLINIC]} />}>
        <Route element={<AdminClinicLayout />}>
          <Route path="/clinic/appointments" element={<AppointmentManagement />} />
          <Route path="/clinic/profile" element={<AdminClinicProfile />} />
          <Route path="/clinic/medical-records" element={<AdminListPetMedicalRecords />} />
          <Route path="/clinic/medical-records/view" element={<ViewMedicalRecords />} />
          <Route path="/clinic/revenue" element={<RevenueDashboard />} />
          <Route path="/clinic/veterinarians" element={<VererianrianManagement />} />
          <Route path="/clinic/veterinarians/add-new" element={<AddNewVererianrian />} />
          <Route path="/clinic/veterinarians/information" element={<InformationVererianrian />} />
          <Route path="/clinic/exam-slips" element={<ListPetExaminationRecords />} />
          <Route path="/clinic/exam-slips/:appointmentId" element={<PetMedicalRecords />} />
          <Route path="/clinic/editor/:clinicId" element={<ClinicPortalEditor />} />
          <Route path="/clinic/home-editor/:clinicId" element={<ClinicPortalEditor />} />
          <Route path="/clinic/clinic-editor/:clinicId" element={<ClinicPortalEditor />} />
        </Route>
      </Route>

      <Route path="/veterinarian/login" element={<Navigate to="/login" replace />} />
      <Route path="/veterinarian/register" element={<Navigate to="/register" replace />} />
      <Route path="/veterinarian/forgot-password" element={<Navigate to="/forgot-password" replace />} />
      <Route path="/veterinarian/reEnterPassword" element={<Navigate to="/reEnterPassword" replace />} />
      <Route path="/veterinarian/confirm-password" element={<Navigate to="/reEnterPassword" replace />}/>

      <Route element={<RoleBasedRoute allowedRoles={[RoleEnum.VETERINARIAN]} />}>
        <Route element={<AdminVererianrianLayout/>}>
          <Route path="/veterinarian/appointments" element={<PetAppointmentVererianrian />} />
          <Route path="/veterinarian/listRecords" element={<ListMedicalRecords />} />
          <Route path="/veterinarian/medical-records/view" element={<ViewMedicalRecords />} />
          <Route path="/veterinarian/viewRecords" element={<ViewPetMedicalRecords />} />
          <Route path="/veterinarian/exam-forms" element={<ListExaminationForm />} />
          <Route path="/veterinarian/exam-forms/create" element={<RecordExaminationForm />} />
        </Route>
      </Route>


      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reEnterPassword" element={<ReEnterPassword />} />

      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/clinic" element={<HomePageClinic />} />
        <Route path="/clinic/:clinicId" element={<HomePageClinic />} />
        <Route path="/choose-clinic" element={<ClinicSelection />} />
        <Route element={<RoleBasedRoute allowedRoles={[RoleEnum.CUSTOMER]} />}>
          <Route path="/booking" element={<BookingAppointment />} />
          <Route path="/appointments" element={<AppointmentDetail />} />
          <Route path="/success-booking" element={<SuccessBooking />} />
        </Route>
      </Route>

      <Route element={<RoleBasedRoute allowedRoles={[RoleEnum.CUSTOMER]} />}>
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
          <Route path="/medical-records" element={<MedicalRecords />} />
          <Route path="/listPetMedicalRecords" element={<ListPetMedicalRecords />}
          />
        </Route>
      </Route>

      <Route element={<RoleBasedRoute allowedRoles={[RoleEnum.CUSTOMER, RoleEnum.ADMIN]} />}>
        <Route element={<HeaderLayout />}>
          <Route path="/forum" element={<Forum />} />
        </Route>
      </Route>

      <Route path="/admin/clinic/*" element={<Navigate to="/clinic/appointments" replace />} />
      <Route path="/admin/veterinarian/*" element={<Navigate to="/veterinarian/appointments" replace />} />
      <Route path="/admin/*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
