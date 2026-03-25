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
      <ClientAuthProvider>
        <AdminAuthProvider>
          <App />
        </AdminAuthProvider>
      </ClientAuthProvider>
    </Provider>
  </BrowserRouter>,
);
