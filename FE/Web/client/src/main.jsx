import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider as AdminAuthProvider } from './hooks/adminClinic/AuthContext'
import { AuthProvider as ClientAuthProvider } from './hooks/client/AuthContext'
import './index.css'
import { store } from './redux/store.js'
import './styles/adminClinic/colorsToken.css'
import './styles/client/colorsToken.css'
import { initFirebaseAnalytics } from './utils/firebaseClient'

initFirebaseAnalytics().catch(() => undefined)

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <ClientAuthProvider>
          <AdminAuthProvider>
            <App />
          </AdminAuthProvider>
        </ClientAuthProvider>
      </Provider>
    </BrowserRouter>
  </StrictMode>,
)
