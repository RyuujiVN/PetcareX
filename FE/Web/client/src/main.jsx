import { Provider } from "react-redux";
import { store } from "./redux/store.js";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider as AdminAuthProvider } from "./hooks/adminClinic/AuthContext";
import { AuthProvider as ClientAuthProvider } from "./hooks/client/AuthContext";
import "./index.css";
import "./styles/adminClinic/colorsToken.css";
import "./styles/client/colorsToken.css";
import {
  getGoogleClientId,
  isGoogleClientIdValid,
} from "./utils/googleOAuthConfig";
import { StrictMode } from "react";

const googleClientId = getGoogleClientId();
const hasValidGoogleClientId = isGoogleClientIdValid(googleClientId);

function AppProviders() {
  return (
    <BrowserRouter>
      <Provider store={store}>
        <ClientAuthProvider>
          <AdminAuthProvider>
            <App />
          </AdminAuthProvider>
        </ClientAuthProvider>
      </Provider>
    </BrowserRouter>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {hasValidGoogleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>
        <AppProviders />
      </GoogleOAuthProvider>
    ) : (
      <AppProviders />
    )}
  </StrictMode>,
);
