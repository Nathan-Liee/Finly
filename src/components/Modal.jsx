import Icon from "./Icon";

export default function Modal({ show, onClose, title, children }) {
  if (!show) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--color-surface-overlay)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 440,
          background: "var(--surface)",
          borderRadius: "20px 20px 0 0",
          padding: "24px 20px 32px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 800,
            color: "var(--text)",
            fontFamily: "'Inter', sans-serif",
          }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              border: "none",
              background: "var(--input-bg)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="close" size={16} color="var(--text-secondary)" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
