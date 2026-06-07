export default function TagSelector({ tagList, value, onChange, style }) {
  const selectedTag = tagList.find(t => t.id === value);

  return (
    <div style={{ marginBottom: 14, ...style }}>
      <label style={{
        display: "block", fontSize: 12, fontWeight: 600,
        color: "var(--text-secondary)", marginBottom: 6,
        letterSpacing: 0.3, fontFamily: "'Inter', sans-serif",
      }}>
        Label / Tag
      </label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        <button
          onClick={() => onChange(null)}
          style={{
            padding: "6px 12px", borderRadius: 10,
            border: value === null || value === undefined || value === "" ? "2px solid var(--accent)" : "1px solid var(--border)",
            background: value === null || value === undefined || value === "" ? "var(--accent-subtle)" : "var(--surface)",
            color: value === null || value === undefined || value === "" ? "var(--accent)" : "var(--text-muted)",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
            fontFamily: "'Inter', sans-serif", transition: "all 0.15s",
          }}
        >
          Tanpa Tag
        </button>
        {tagList.map(t => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 12px", borderRadius: 10,
              border: value === t.id ? "2px solid " + t.color : "1px solid var(--border)",
              background: value === t.id ? t.color + "15" : "var(--surface)",
              color: value === t.id ? t.color : "var(--text-secondary)",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: "'Inter', sans-serif", transition: "all 0.15s",
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.color, flexShrink: 0 }} />
            {t.name}
          </button>
        ))}
      </div>
    </div>
  );
}
