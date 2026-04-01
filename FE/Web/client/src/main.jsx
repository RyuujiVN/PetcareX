import { ConfigProvider, theme as antdTheme } from 'antd'
import 'antd/dist/reset.css'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider as AdminAuthProvider } from './hooks/Clinic/AuthContext'
import { AuthProvider as ClientAuthProvider } from './hooks/client/AuthContext'
import './index.css'
import { store } from './redux/store.js'
import './styles/Clinic/colorsToken.css'
import './styles/client/colorsToken.css'
import { initFirebaseAnalytics } from './utils/firebaseClient'

initFirebaseAnalytics().catch(() => undefined);

createRoot(document.getElementById("root")).render(
  <ConfigProvider
    theme={{
      algorithm: antdTheme.defaultAlgorithm,
      token: {
        colorPrimary: "#4672b4",
        borderRadius: 12,
        fontFamily: '"Poppins", "Segoe UI", sans-serif',
      },
      components: {
        Button: {
          borderRadius: 12,
          contentFontSize: 14,
          contentFontSizeLG: 16,
          controlHeight: 40,
          controlHeightLG: 46,
          fontWeight: 600,
          primaryColor: "#ffffff",
          primaryShadow: "0 10px 20px rgba(70, 114, 180, 0.28)",
          colorPrimaryHover: "#3f67a4",
          colorPrimaryActive: "#345687",
        },
      },
    }}
  >
    <BrowserRouter>
      <Provider store={store}>
        <ClientAuthProvider>
          <AdminAuthProvider>
            <App />
          </AdminAuthProvider>
        </ClientAuthProvider>
      </Provider>
    </BrowserRouter>
  </ConfigProvider>,
);
