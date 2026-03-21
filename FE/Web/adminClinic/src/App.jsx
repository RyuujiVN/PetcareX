import { Routes, Route } from 'react-router-dom'
import HomePage from './component/HomePage'
import HomePageClinic from './component/HomePageClinic'  // clinic landing page
import Login from './component/login'
import Register from './component/register'
import ForgotPassword from './component/ForgotPassword'
import ReEnterPassword from './component/reEnterPassword'
import ClinicSelection from './component/ChoiceHospital/ClinicSelection'
import { AuthProvider } from "./context/AuthContext"
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
      </Routes>
    </AuthProvider>
  )
}

export default App