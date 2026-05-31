/**
 * ═══════════════════════════════════════════════
 *  Design System Tokens
 *  Refined, minimal — production-ready
 * ═══════════════════════════════════════════════
 */

// ── Active theme key ──────────────────────────
export const THEME = "light";

// ── Shared token definitions ──────────────────

const typography = {
  fontFamily:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
  fontMono:
    "'JetBrains Mono', 'SF Mono', 'Fira Code', 'Roboto Mono', monospace",
  size: {
    xs: "0.75rem",
    sm: "0.8125rem",
    base: "0.875rem",
    lg: "1rem",
    xl: "1.125rem",
    "2xl": "1.25rem",
    "3xl": "1.5rem",
    "4xl": "1.875rem",
  },
  weight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
  lineHeight: {
    tight: "1.25",
    normal: "1.5",
    relaxed: "1.75",
  },
  letterSpacing: {
    tight: "-0.015em",
    normal: "0",
    wide: "0.025em",
  },
};

const spacing = {
  "0": "0",
  "1": "0.25rem",
  "2": "0.5rem",
  "3": "0.75rem",
  "4": "1rem",
  "5": "1.25rem",
  "6": "1.5rem",
  "8": "2rem",
  "10": "2.5rem",
  "12": "3rem",
  "16": "4rem",
  "20": "5rem",
};

const radii = {
  none: "0",
  sm: "0.25rem",
  base: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  "2xl": "1.25rem",
  full: "9999px",
};

const shadows = {
  none: "none",
  xs: "0 1px 2px rgba(0, 0, 0, 0.04)",
  sm: "0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
  md: "0 4px 6px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.03)",
  lg: "0 10px 15px rgba(0, 0, 0, 0.06), 0 4px 6px rgba(0, 0, 0, 0.04)",
  xl: "0 20px 25px rgba(0, 0, 0, 0.06), 0 8px 10px rgba(0, 0, 0, 0.04)",
};

// ── Color palettes per theme ──────────────────

const palettes = {
  light: {
    // Base surfaces
    background: "#FAFBFC",
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    surfaceOverlay: "rgba(0, 0, 0, 0.4)",

    // Borders
    border: "#E5E7EB",
    borderSubtle: "#F3F4F6",
    borderFocus: "#6B7EFF",

    // Text
    textPrimary: "#111827",
    textSecondary: "#6B7280",
    textMuted: "#9CA3AF",
    textInverse: "#FFFFFF",

    // Accent (brand)
    accent: "#6B7EFF",
    accentHover: "#5A6AE5",
    accentSubtle: "rgba(107, 126, 255, 0.08)",
    accentBorder: "rgba(107, 126, 255, 0.2)",

    // Semantic
    success: "#10B981",
    successSubtle: "rgba(16, 185, 129, 0.08)",
    danger: "#EF4444",
    dangerSubtle: "rgba(239, 68, 68, 0.08)",
    warning: "#F59E0B",
    warningSubtle: "rgba(245, 158, 11, 0.08)",
    info: "#3B82F6",
    infoSubtle: "rgba(59, 130, 246, 0.08)",

    // Component-specific
    inputBg: "#F9FAFB",
    inputBorder: "#E5E7EB",
    navbarBg: "rgba(255, 255, 255, 0.85)",
    navbarBorder: "#E5E7EB",
    tabInactive: "#9CA3AF",
    gradientPrimary: "linear-gradient(135deg, #6B7EFF 0%, #4A5AE7 100%)",
  },

  dark: {
    // Base surfaces
    background: "#0B0D12",
    surface: "#131620",
    surfaceElevated: "#1A1E2A",
    surfaceOverlay: "rgba(0, 0, 0, 0.6)",

    // Borders
    border: "#232736",
    borderSubtle: "#1A1E2A",
    borderFocus: "#6B7EFF",

    // Text
    textPrimary: "#F9FAFB",
    textSecondary: "#9CA3AF",
    textMuted: "#6B7280",
    textInverse: "#111827",

    // Accent (brand)
    accent: "#6B7EFF",
    accentHover: "#8090FF",
    accentSubtle: "rgba(107, 126, 255, 0.12)",
    accentBorder: "rgba(107, 126, 255, 0.25)",

    // Semantic
    success: "#34D399",
    successSubtle: "rgba(52, 211, 153, 0.1)",
    danger: "#F87171",
    dangerSubtle: "rgba(248, 113, 113, 0.1)",
    warning: "#FBBF24",
    warningSubtle: "rgba(251, 191, 36, 0.1)",
    info: "#60A5FA",
    infoSubtle: "rgba(96, 165, 250, 0.1)",

    // Component-specific
    inputBg: "rgba(255, 255, 255, 0.04)",
    inputBorder: "#232736",
    navbarBg: "rgba(11, 13, 18, 0.9)",
    navbarBorder: "#232736",
    tabInactive: "#6B7280",
    gradientPrimary: "linear-gradient(135deg, #6B7EFF 0%, #4A5AE7 100%)",
  },
};

// ── Dark-mode shadow overrides ────────────────
const darkShadows = {
  xs: "0 1px 2px rgba(0, 0, 0, 0.2)",
  sm: "0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)",
  md: "0 4px 6px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.15)",
  lg: "0 10px 15px rgba(0, 0, 0, 0.3), 0 4px 6px rgba(0, 0, 0, 0.2)",
  xl: "0 20px 25px rgba(0, 0, 0, 0.3), 0 8px 10px rgba(0, 0, 0, 0.2)",
};

// ── Build theme object ────────────────────────

function buildTheme(key) {
  const palette = palettes[key] ?? palettes.light;
  const isDark = key === "dark";
  return {
    name: isDark ? "Dark" : "Light",
    ...palette,
    shadows: isDark ? { ...shadows, ...darkShadows } : shadows,
    typography,
    spacing,
    radii,
  };
}

// ── Exports ───────────────────────────────────

export const themes = {
  light: buildTheme("light"),
  dark: buildTheme("dark"),
};

/** Toggle between light and dark */
export const toggleTheme = () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  try { localStorage.setItem("kasapp-theme", next); } catch {}
  return next;
};

/** Get saved theme or default */
export const getSavedTheme = () => {
  try { return localStorage.getItem("kasapp-theme") || THEME; } catch { return THEME; }
};

/** Currently active theme */
export const theme = themes[THEME] ?? themes.light;

/** Resolve a theme by key; falls back to light */
export const getTheme = (key) => themes[key] ?? themes.light;
