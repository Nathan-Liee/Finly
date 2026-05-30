import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./App.css";

// PWA registration non-blocking — tidak boleh menghalangi render
try {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true });
  }).catch(() => {
    // SW gagal register — lanjutkan tanpa PWA
  });
} catch {
  // virtual:pwa-register tidak tersedia (dev mode tanpa plugin)
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
