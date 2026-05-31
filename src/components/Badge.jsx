export default function Badge({ children, color, style }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "3px 10px",
      borderRadius: 20,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: 0.5,
      textTransform: "uppercase",
      background: `${color}15`,
      color: color,
      border: `1px solid ${color}30`,
      ...style,
    }}>
      {children}
    </span>
  );
}
