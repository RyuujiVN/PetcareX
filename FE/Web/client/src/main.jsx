import { GoogleOAuthProvider } from '@react-oauth/google'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider as AdminAuthProvider } from './hooks/adminClinic/AuthContext'
import { AuthProvider as ClientAuthProvider } from './hooks/client/AuthContext'
import './index.css'
import './styles/adminClinic/colorsToken.css'
import './styles/client/colorsToken.css'
import { getGoogleClientId, isGoogleClientIdValid } from './utils/googleOAuthConfig'
// import { GoogleOAuthProvider } from "@react-oauth/google";

const googleClientId = getGoogleClientId()
const hasValidGoogleClientId = isGoogleClientIdValid(googleClientId)

function AppProviders() {
  return (
    <BrowserRouter>
      <ClientAuthProvider>
        <AdminAuthProvider>
          <App />
        </AdminAuthProvider>
      </ClientAuthProvider>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {hasValidGoogleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>
        <AppProviders />
      </GoogleOAuthProvider>
    ) : (
      <AppProviders />
    )}
  </StrictMode>,
)