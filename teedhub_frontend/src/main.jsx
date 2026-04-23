import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./i18n/index.js";

import "./styles/globals.css";
import "./index.css";

import App from "./App.jsx";
import { ThemeProvider } from "@/components/ui/theme/ThemeProvider";
import { AppToastProvider } from "@/components/ui/toast/AppToastProvider";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <AppToastProvider>
        <App />
      </AppToastProvider>
    </ThemeProvider>
  </StrictMode>
);

console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);
console.log("VITE_NODE_ENV:", import.meta.env.VITE_NODE_ENV);