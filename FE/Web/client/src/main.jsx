<<<<<<< HEAD
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles/client/colorsToken.css";
import "./styles/adminClinic/colorsToken.css";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider as ClientAuthProvider } from "./hooks/client/AuthContext";
import { AuthProvider as AdminAuthProvider } from "./hooks/adminClinic/AuthContext";
import { Provider } from "react-redux";
import { store } from "./redux/store.js";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Provider store={store}>
=======
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
>>>>>>> 1170c6b4ca7460fb851cb01b230e4549b0e0fb00
      <ClientAuthProvider>
        <AdminAuthProvider>
          <App />
        </AdminAuthProvider>
      </ClientAuthProvider>
<<<<<<< HEAD
    </Provider>
  </BrowserRouter>,
);
=======
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
>>>>>>> 1170c6b4ca7460fb851cb01b230e4549b0e0fb00
