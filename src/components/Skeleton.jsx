import { memo, useEffect } from "react";

/* ─── Pulse animation keyframes — injected once client-side ─── */
const skeletonStyleId = "finly-skeleton-keyframes";
function useInjectSkeletonStyles() {
  useEffect(() => {
    if (!document.getElementById(skeletonStyleId)) {
      const style = document.createElement("style");
      style.id = skeletonStyleId;
      style.textContent = `
        @keyframes finly-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);
}

/* ─── SkeletonLine ─── */
export const SkeletonLine = memo(function SkeletonLine({ width = "100%", height = 14, style, rounded = true }) {
  useInjectSkeletonStyles();
  return (
    <div
      style={{
        width,
        height,
        borderRadius: rounded ? 8 : 4,
        background: "var(--border)",
        animation: "finly-pulse 1.5s ease-in-out infinite",
        ...style,
      }}
    />
  );
});

/* ─── SkeletonBlock ─── */
export const SkeletonBlock = memo(function SkeletonBlock({ width = "100%", height = 80, style, rounded = 12 }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: rounded,
        background: "var(--border)",
        animation: "finly-pulse 1.5s ease-in-out infinite",
        ...style,
      }}
    />
  );
});

/* ─── SkeletonCard ─── */
export const SkeletonCard = memo(function SkeletonCard({ lines = 3, lineHeight = 14, style }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        ...style,
      }}
    >
      <SkeletonBlock height={80} rounded={10} />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine
          key={i}
          width={i === lines - 1 ? "60%" : "100%"}
          height={lineHeight}
        />
      ))}
    </div>
  );
});

/* ─── SkeletonBalanceCard ─── */
export const SkeletonBalanceCard = memo(function SkeletonBalanceCard() {
  return (
    <div
      style={{
        borderRadius: 24,
        padding: "24px 22px",
        background: "var(--border)",
        animation: "finly-pulse 1.5s ease-in-out infinite",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -40,
          right: -20,
          width: 130,
          height: 130,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
          pointerEvents: "none",
        }}
      />
      <SkeletonLine width="40%" height={13} style={{ background: "rgba(255,255,255,0.2)", marginBottom: 8 }} />
      <SkeletonLine width="70%" height={34} style={{ background: "rgba(255,255,255,0.15)", marginBottom: 20 }} />
      <div style={{ display: "flex", gap: 10 }}>
        <SkeletonBlock height={44} rounded={14} style={{ flex: 1, background: "rgba(255,255,255,0.15)" }} />
        <SkeletonBlock height={44} rounded={14} style={{ flex: 1, background: "rgba(255,255,255,0.15)" }} />
      </div>
    </div>
  );
});

/* ─── SkeletonStats ─── */
export const SkeletonStats = memo(function SkeletonStats() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      <SkeletonBlock height={66} rounded={16} />
      <SkeletonBlock height={66} rounded={16} />
    </div>
  );
});

/* ─── SkeletonTransaksi ─── */
export const SkeletonTransaksi = memo(function SkeletonTransaksi() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 14px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 14,
          }}
        >
          <SkeletonBlock width={38} height={38} rounded={12} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <SkeletonLine width="50%" height={13} />
            <SkeletonLine width="30%" height={11} />
          </div>
          <SkeletonLine width={80} height={14} />
        </div>
      ))}
    </div>
  );
});

export default SkeletonCard;
