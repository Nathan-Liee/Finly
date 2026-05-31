import { formatUang } from "../utils/format";
import Icon from "./Icon";

export default function TransaksiRow({ t, onEdit, onDelete, showActions = true }) {
  const isIn = t.type === "masuk";

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 14px",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 14,
      transition: "all 0.15s ease",
    }}>
      {/* Icon */}
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        background: isIn ? "var(--success-subtle)" : "var(--danger-subtle)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon
          name={isIn ? "arrowDown" : "arrowUp"}
          size={18}
          color={isIn ? "var(--success)" : "var(--danger)"}
        />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0,
          fontSize: 14,
          fontWeight: 700,
          color: "var(--text)",
          fontFamily: "'Inter', sans-serif",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {isIn ? "Pemasukan" : (t.kategori || "Pengeluaran")}
        </p>
        <p style={{
          margin: "2px 0 0",
          fontSize: 11,
          color: "var(--text-muted)",
          fontFamily: "'Inter', sans-serif",
        }}>
          {t.catatan && t.catatan !== "-" ? t.catatan : (t.metode ? t.metode.toUpperCase() : "")}
        </p>
      </div>

      {/* Amount */}
      <p style={{
        margin: 0,
        fontSize: 14,
        fontWeight: 800,
        color: isIn ? "var(--success)" : "var(--danger)",
        fontFamily: "'Inter', sans-serif",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}>
        {isIn ? "+" : "-"}{formatUang(t.jumlah)}
      </p>

      {/* Actions */}
      {showActions && (onEdit || onDelete) && (
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {onEdit && (
            <button
              onClick={() => onEdit?.()}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "none",
                background: "var(--accent-subtle)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="edit" size={14} color="var(--accent)" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete?.()}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "none",
                background: "var(--danger-subtle)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="trash" size={14} color="var(--danger)" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
