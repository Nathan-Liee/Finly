import Icon from "./Icon";

const variants = {
  primary: {
    base: {
      background: "var(--gradient)",
      color: "#fff",
      border: "none",
      boxShadow: "0 2px 8px rgba(107, 126, 255, 0.3)",
    },
  },
  ghost: {
    base: {
      background: "transparent",
      color: "var(--text-secondary)",
      border: "1px solid var(--border)",
    },
  },
  success: {
    base: {
      background: "var(--success)",
      color: "#fff",
      border: "none",
      boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
    },
  },
  danger: {
    base: {
      background: "var(--danger)",
      color: "#fff",
      border: "none",
      boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
    },
  },
  warning: {
    base: {
      background: "var(--warning)",
      color: "#fff",
      border: "none",
      boxShadow: "0 2px 8px rgba(245, 158, 11, 0.3)",
    },
  },
};

export default function Button({ children, onClick, variant = "primary", icon, disabled, style, fullWidth, size = "md" }) {
  const v = variants[variant] || variants.primary;
  const padding = size === "sm" ? "8px 14px" : size === "lg" ? "14px 24px" : "11px 20px";
  const fontSize = size === "sm" ? 12 : size === "lg" ? 16 : 14;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...v.base,
        padding,
        borderRadius: 12,
        fontSize,
        fontWeight: 700,
        fontFamily: "'Inter', sans-serif",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        width: fullWidth ? "100%" : undefined,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.15s ease",
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={size === "sm" ? 14 : 18} />}
      {children}
    </button>
  );
}
