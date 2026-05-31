import Icon from "./Icon";

const styles = {
  success: { bg: "var(--success)", icon: "check" },
  error: { bg: "var(--danger)", icon: "close" },
  info: { bg: "var(--info)", icon: "zap" },
};

export default function Toast({ msg, type = "success" }) {
  const s = styles[type] || styles.success;
  return (
    <div style={{
      position: "fixed",
      top: 16,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 3000,
      background: s.bg,
      color: "#fff",
      padding: "10px 18px",
      borderRadius: 14,
      fontSize: 13,
      fontWeight: 700,
      fontFamily: "'Inter', sans-serif",
      display: "flex",
      alignItems: "center",
      gap: 8,
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      animation: "fadeIn 0.2s ease",
      maxWidth: "90vw",
    }}>
      <Icon name={s.icon} size={16} color="#fff" />
      {msg}
    </div>
  );
}
