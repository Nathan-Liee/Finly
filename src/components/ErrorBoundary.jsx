import { Component } from "react";
import Icon from "./Icon";

/* ─── Error Boundary ───
 * Catches render errors in child components.
 * Prevents whitescreen — shows fallback UI with retry button.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh", background: "var(--bg)",
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: 24, textAlign: "center",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: "var(--danger-subtle)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 20,
          }}>
            <Icon name="warning" size={28} color="var(--danger)" />
          </div>
          <h2 style={{ color: "var(--text)", fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>
            Terjadi Kesalahan
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "0 0 24px", maxWidth: 300, lineHeight: 1.5 }}>
            {this.state.error?.message || "Komponen mengalami error tidak terduga."}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              padding: "12px 24px", borderRadius: 12, border: "none",
              background: "var(--gradient)", color: "#fff",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}
          >
            Muat Ulang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
