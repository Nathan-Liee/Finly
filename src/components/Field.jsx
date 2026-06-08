export default function Field({ label, value, onChange, type = "text", placeholder, prefix, onKeyDown, style, rows }) {
  const isTextarea = type === "textarea";
  return (
    <div style={{ marginBottom: 14, ...style }}>
      {label && (
        <label style={{
          display: "block",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--text-secondary)",
          marginBottom: 6,
          letterSpacing: 0.3,
          fontFamily: "'Inter', sans-serif",
        }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        {prefix && (
          <span style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 14,
            fontWeight: 600,
            color: "var(--text-muted)",
            pointerEvents: "none",
          }}>
            {prefix}
          </span>
        )}
        {isTextarea ? (
          <textarea
            value={value ?? ""}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            rows={rows ?? 3}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 12,
              border: "1.5px solid var(--input-border)",
              background: "var(--input-bg)",
              color: "var(--text)",
              fontSize: 15,
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              outline: "none",
              transition: "border-color 0.15s ease",
              boxSizing: "border-box",
              minHeight: 80,
              resize: "vertical",
            }}
            onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
            onBlur={(e) => { e.target.style.borderColor = "var(--input-border)"; }}
          />
        ) : (
          <input
            type={type === "number" ? "text" : type}
            inputMode={type === "number" ? "numeric" : undefined}
            value={value ?? ""}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            onKeyDown={onKeyDown}
            style={{
              width: "100%",
              padding: prefix ? "12px 14px 12px 42px" : "12px 14px",
              borderRadius: 12,
              border: "1.5px solid var(--input-border)",
              background: "var(--input-bg)",
              color: "var(--text)",
              fontSize: 15,
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              outline: "none",
              transition: "border-color 0.15s ease",
              boxSizing: "border-box",
            }}
            onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
            onBlur={(e) => { e.target.style.borderColor = "var(--input-border)"; }}
          />
        )}
      </div>
    </div>
  );
}
