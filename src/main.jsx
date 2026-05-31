import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import "./App.css";
import "./styles/themes.css";
import { THEME, getSavedTheme } from "./theme";

/* Set active theme — CSS vars are defined in themes.css */
const savedTheme = getSavedTheme();
document.documentElement.setAttribute("data-theme", savedTheme);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
