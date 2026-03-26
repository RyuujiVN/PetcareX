import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider as AdminAuthProvider } from './hooks/adminClinic/AuthContext'
import { AuthProvider as ClientAuthProvider } from './hooks/client/AuthContext'
import './index.css'
import './styles/adminClinic/colorsToken.css'
import './styles/client/colorsToken.css'
import { initFirebaseAnalytics } from './utils/firebaseClient'

initFirebaseAnalytics().catch(() => {
  // Keep app bootstrap resilient even if analytics is blocked by browser settings.
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ClientAuthProvider>
        <AdminAuthProvider>
          <App />
        </AdminAuthProvider>
      </ClientAuthProvider>
    </BrowserRouter>
  </StrictMode>,
)