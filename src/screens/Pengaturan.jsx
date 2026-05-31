import { useState, useEffect } from "react";
import { version } from '../../package.json';
import Icon from "../components/Icon";
import { formatUang } from "../utils/format";
import { updateProfile, updatePassword, getDisplayName } from "../utils/storage";
import { supabase } from "../utils/supabase";
import { insertFeedback, getFeedbackList, updateFeedbackStatus } from "../utils/supabase-feedback";
import { toggleTheme } from "../theme";

/* ═══════════════════════════════════════════
 *  PENGATURAN SCREEN — NEW LAYOUT
 *  iOS-style settings list with sections
 * ═══════════════════════════════════════════ */

/* ─── Setting Row Component ─── */
function SettingRow({ icon, iconColor, title, subtitle, action, danger, toggle, toggleValue, badge }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={action || undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 14,
        padding: "14px 16px", background: hovered ? "var(--input-bg)" : "var(--surface)",
        border: "none", cursor: action ? "pointer" : "default",
        transition: "background 0.15s", textAlign: "left",
      }}
    >
      {/* Icon */}
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: danger ? "var(--danger-subtle)" : (iconColor ? `${iconColor}-subtle` : "var(--accent-subtle)"),
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name={icon} size={16} color={danger ? "var(--danger)" : (iconColor || "var(--accent)")} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: "0 0 1px", fontSize: 14, fontWeight: 600,
          color: danger ? "var(--danger)" : "var(--text)",
          fontFamily: "'Inter', sans-serif",
        }}>
          {title}
        </p>
        {subtitle && (
          <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", fontFamily: "'Inter', sans-serif" }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Right side */}
      {badge && (
        <span style={{
          fontSize: 11, fontWeight: 700, color: "var(--accent)",
          background: "var(--accent-subtle)", padding: "3px 8px", borderRadius: 8,
        }}>
          {badge}
        </span>
      )}
      {toggle !== undefined && (
        <div style={{
          width: 44, height: 24, borderRadius: 12, flexShrink: 0,
          background: toggle ? "var(--accent)" : "var(--border)",
          position: "relative", transition: "background 0.2s",
        }}>
          <div style={{
            width: 20, height: 20, borderRadius: "50%",
            background: "#fff", position: "absolute", top: 2,
            left: toggle ? 22 : 2,
            transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }} />
        </div>
      )}
      {action && !toggle && !badge && (
        <Icon name="chevronRight" size={16} color="var(--text-muted)" />
      )}
    </button>
  );
}

/* ─── Section Header ─── */
function SectionHeader({ title }) {
  return (
    <p style={{
      margin: "0 0 6px", paddingLeft: 16,
      color: "var(--text-muted)", fontSize: 11, fontWeight: 700,
      letterSpacing: 0.8, textTransform: "uppercase",
    }}>
      {title}
    </p>
  );
}

/* ─── Card Container ─── */
function SettingsCard({ children, style }) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 16, overflow: "hidden", margin: "0 20px 16px",
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ─── Divider ─── */
function Divider() {
  return <div style={{ height: 1, background: "var(--border)", margin: "0 16px" }} />;
}

/* ═══════════════════════════════════════════
 *  MAIN COMPONENT
 * ═══════════════════════════════════════════ */

export default function PengaturanScreen({
  data, today, dates,
  setUbahTarget, setFormUangAwal, setModal,
  profile, setProfile, user, onLogout
}) {
  /* ─── Profile editing ─── */
  const [editMode, setEditMode] = useState(null); // "username" | "password" | null
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [konfirmPassword, setKonfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  /* ─── Sub-view navigation ─── */
  const [settingsView, setSettingsView] = useState("settings"); // "settings" | "feedback-form" | "feedback-admin"
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  /* ─── Feedback form state ─── */
  const [feedbackKategori, setFeedbackKategori] = useState("Keluhan");
  const [feedbackJudul, setFeedbackJudul] = useState("");
  const [feedbackPesan, setFeedbackPesan] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  /* ─── Admin feedback list state ─── */
  const [isAdmin, setIsAdmin] = useState(false);
  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState("Semua");
  const [feedbackLoadingList, setFeedbackLoadingList] = useState(false);
  const [feedbackListMsg, setFeedbackListMsg] = useState("");

  /* ─── Theme ─── */
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem("kasapp-theme") === "dark"; } catch { return false; }
  });

  useEffect(() => {
    if (user?.email?.toLowerCase() === "xybcaa.454@gmail.com") {
      setIsAdmin(true);
    }
  }, [user]);

  const fetchFeedbackList = async (filter) => {
    const f = filter || feedbackStatusFilter;
    setFeedbackLoadingList(true);
    try {
      const data = await getFeedbackList(f);
      setFeedbackList(data);
      setFeedbackListMsg("");
    } catch (err) {
      setFeedbackListMsg("Gagal memuat feedback: " + (err.message || "Terjadi kesalahan"));
    } finally {
      setFeedbackLoadingList(false);
    }
  };

  const handleUpdateFeedbackStatus = async (id, status) => {
    setFeedbackLoadingList(true);
    try {
      await updateFeedbackStatus(id, status);
      setFeedbackListMsg("Status berhasil diupdate.");
      setTimeout(() => setFeedbackListMsg(""), 2000);
      await fetchFeedbackList();
    } catch (err) {
      setFeedbackListMsg("Gagal update status: " + (err.message || "Terjadi kesalahan"));
    } finally {
      setFeedbackLoadingList(false);
    }
  };

  const handleToggleTheme = () => {
    toggleTheme();
    setIsDark(prev => !prev);
  };

  const displayName = getDisplayName(profile, user);

  /* ─── Actions ─── */
  const doUpdateUsername = async () => {
    if (!newUsername.trim()) return setMsg("Username tidak boleh kosong!");
    setLoading(true);
    try {
      await updateProfile(newUsername.trim());
      setProfile({ ...profile, username: newUsername.trim() });
      setEditMode(null); setNewUsername(""); setMsg("Username berhasil diubah!");
      setTimeout(() => setMsg(""), 2000);
    } catch { setMsg("Gagal mengubah username!"); }
    finally { setLoading(false); }
  };

  const doUpdatePassword = async () => {
    if (!newPassword) return setMsg("Password tidak boleh kosong!");
    if (newPassword.length < 6) return setMsg("Password minimal 6 karakter!");
    if (newPassword !== konfirmPassword) return setMsg("Password tidak cocok!");
    setLoading(true);
    try {
      await updatePassword(newPassword);
      setEditMode(null); setNewPassword(""); setKonfirmPassword("");
      setMsg("Password berhasil diubah!"); setTimeout(() => setMsg(""), 2000);
    } catch { setMsg("Gagal mengubah password!"); }
    finally { setLoading(false); }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackJudul.trim()) return setFeedbackMsg("Judul wajib diisi!");
    if (!feedbackPesan.trim()) return setFeedbackMsg("Pesan wajib diisi!");
    setFeedbackLoading(true);
    setFeedbackMsg("");
    try {
      await insertFeedback({
        kategori: feedbackKategori,
        judul: feedbackJudul.trim(),
        pesan: feedbackPesan.trim(),
        email: profile?.email || user?.email,
      });
      setFeedbackSubmitted(true);
      setFeedbackMsg("Masukan berhasil dikirim. Terima kasih!");
      setFeedbackJudul("");
      setFeedbackPesan("");
      setFeedbackKategori("Keluhan");
    } catch (err) {
      setFeedbackMsg("Gagal mengirim: " + (err.message || "Terjadi kesalahan"));
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleClearData = () => {
    if (window.confirm("Hapus semua data transaksi? Tindakan ini tidak bisa dibatalkan.")) {
      setModal("clearData");
    }
  };

  const handleImportData = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported = JSON.parse(text);
        if (!imported.data || typeof imported.data !== "object") {
          alert("Format file tidak valid. Harus berisi { data: {...} }");
          return;
        }
        if (!window.confirm(`Import ${Object.keys(imported.data).length} hari data? Data lama akan ditimpa.`)) return;
        localStorage.setItem("kasapp-data", JSON.stringify(imported.data));
        window.location.reload();
      } catch (err) {
        alert("Gagal import: " + (err.message || "File tidak valid"));
      }
    };
    input.click();
  };

  const handleFilterChange = (status) => {
    setFeedbackStatusFilter(status);
    fetchFeedbackList(status);
  };

  /* ═══════════════════════════════════════════
   *  FEEDBACK FORM SUB-VIEW (user & admin)
   * ═══════════════════════════════════════════ */
  if (settingsView === "feedback-form") {
    return (
      <div style={{ background: "var(--bg)", minHeight: "100vh", paddingBottom: 100 }}>
        {/* Header */}
        <div style={{ padding: "44px 20px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => { setSettingsView("settings"); setFeedbackSubmitted(false); setFeedbackMsg(""); }}
            style={{
              width: 40, height: 40, borderRadius: 12, background: "var(--surface)",
              border: "1px solid var(--border)", display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer", color: "var(--text)"
            }}
          >
            <Icon name="chevronLeft" size={20} />
          </button>
          <div>
            <h2 style={{ color: "var(--text)", fontSize: 24, fontWeight: 800, margin: "0 0 2px", fontFamily: "'Inter', sans-serif" }}>
              Keluhan & Masukan
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>
              Bantu kami memperbaiki Finly dengan masukan Anda.
            </p>
          </div>
        </div>

        {/* Message */}
        {feedbackMsg && (
          <div style={{
            margin: "0 20px 16px", padding: "12px 16px", borderRadius: 12,
            background: feedbackMsg.includes("berhasil") ? "var(--success-subtle)" : "var(--danger-subtle)",
            color: feedbackMsg.includes("berhasil") ? "var(--success)" : "var(--danger)",
            fontSize: 13, fontWeight: 600, textAlign: "center",
            border: feedbackMsg.includes("berhasil")
              ? "1px solid rgba(16,185,129,0.2)"
              : "1px solid rgba(239,68,68,0.2)",
          }}>
            {feedbackMsg}
          </div>
        )}

        {feedbackSubmitted ? (
          /* ── Success state ── */
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "var(--success-subtle)", margin: "0 auto 20px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="check" size={28} color="var(--success)" />
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "var(--text)" }}>
              Masukan berhasil dikirim!
            </h3>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: "var(--text-muted)" }}>
              Terima kasih atas masukan Anda. Kami akan meninjaunya.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={() => { setFeedbackSubmitted(false); setFeedbackMsg(""); }}
                style={{
                  padding: "14px 24px", borderRadius: 14, border: "1px solid var(--border)",
                  background: "var(--surface)", color: "var(--text)", fontWeight: 700,
                  fontSize: 14, cursor: "pointer", fontFamily: "'Inter', sans-serif",
                }}
              >
                Kirim Masukan Lagi
              </button>
              <button
                onClick={() => { setSettingsView("settings"); setFeedbackSubmitted(false); setFeedbackMsg(""); }}
                style={{
                  padding: "14px 24px", borderRadius: 14, border: "none",
                  background: "var(--accent)", color: "#fff", fontWeight: 700,
                  fontSize: 14, cursor: "pointer", fontFamily: "'Inter', sans-serif",
                }}
              >
                Kembali ke Pengaturan
              </button>
            </div>
          </div>
        ) : (
          /* ── Form ── */
          <div style={{ padding: "0 20px" }}>
            <div style={{
              background: "var(--surface)", borderRadius: 16, padding: 20,
              border: "1px solid var(--border)",
            }}>
              {/* Kategori */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>Kategori</label>
                <select
                  value={feedbackKategori} onChange={(e) => setFeedbackKategori(e.target.value)}
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 12,
                    border: "1px solid var(--border)", background: "var(--input-bg)",
                    color: "var(--text)", fontSize: 14, fontFamily: "'Inter', sans-serif", outline: "none",
                  }}
                >
                  <option value="Keluhan">Keluhan</option>
                  <option value="Bug">Bug</option>
                  <option value="Saran Fitur">Saran Fitur</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              {/* Judul */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>Judul Singkat</label>
                <input
                  value={feedbackJudul} onChange={(e) => setFeedbackJudul(e.target.value)}
                  placeholder="Contoh: Tombol export tidak berfungsi"
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 12,
                    border: "1px solid var(--border)", background: "var(--input-bg)",
                    color: "var(--text)", fontSize: 14, fontFamily: "'Inter', sans-serif", outline: "none",
                  }}
                />
              </div>

              {/* Pesan */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>Detail Masukan</label>
                <textarea
                  value={feedbackPesan} onChange={(e) => setFeedbackPesan(e.target.value)}
                  placeholder="Jelaskan keluhan, bug, atau saran Anda secara detail..."
                  rows={5}
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 12,
                    border: "1px solid var(--border)", background: "var(--input-bg)",
                    color: "var(--text)", fontSize: 14, fontFamily: "'Inter', sans-serif", outline: "none",
                    resize: "none",
                  }}
                />
              </div>

              {/* Email (auto-filled) */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>Email</label>
                <input
                  value={profile?.email || user?.email || ""}
                  readOnly
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 12,
                    border: "1px solid var(--border)", background: "var(--input-bg)",
                    color: "var(--text-muted)", fontSize: 14, fontFamily: "'Inter', sans-serif",
                    outline: "none", opacity: 0.7,
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => { setSettingsView("settings"); setFeedbackSubmitted(false); setFeedbackMsg(""); }}
                  style={{
                    flex: 1, padding: "14px", borderRadius: 14, border: "1px solid var(--border)",
                    background: "var(--surface)", color: "var(--text)", fontWeight: 700,
                    fontSize: 14, cursor: "pointer", fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmitFeedback}
                  disabled={feedbackLoading}
                  style={{
                    flex: 1, padding: "14px", borderRadius: 14, border: "none",
                    background: "var(--accent)", color: "#fff", fontWeight: 700,
                    fontSize: 14, cursor: "pointer", fontFamily: "'Inter', sans-serif",
                    opacity: feedbackLoading ? 0.7 : 1,
                  }}
                >
                  {feedbackLoading ? "Mengirim..." : "Kirim Masukan"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════════
   *  ADMIN FEEDBACK VIEW
   * ═══════════════════════════════════════════ */
  if (settingsView === "feedback-admin" && isAdmin) {
    const statusBadge = (s) => {
      const map = {
        baru: { label: "Baru", color: "var(--warning)", bg: "var(--warning-subtle)" },
        diproses: { label: "Diproses", color: "var(--accent)", bg: "var(--accent-subtle)" },
        selesai: { label: "Selesai", color: "var(--success)", bg: "var(--success-subtle)" },
      };
      return map[s] || map.baru;
    };

    return (
      <div style={{ background: "var(--bg)", minHeight: "100vh", paddingBottom: 100 }}>
        <div style={{ padding: "44px 20px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => setSettingsView("settings")}
            style={{
              width: 40, height: 40, borderRadius: 12, background: "var(--surface)",
              border: "1px solid var(--border)", display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer", color: "var(--text)"
            }}
          >
            <Icon name="chevronLeft" size={20} />
          </button>
          <div>
            <h2 style={{ color: "var(--text)", fontSize: 24, fontWeight: 800, margin: "0 0 2px", fontFamily: "'Inter', sans-serif" }}>
              Feedback Masuk
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>
              Keluhan dan masukan dari pengguna Finly
            </p>
          </div>
        </div>

        {feedbackListMsg && (
          <div style={{
            margin: "0 20px 16px", padding: "12px 16px", borderRadius: 12,
            background: feedbackListMsg.includes("Gagal") ? "var(--danger-subtle)" : "var(--success-subtle)",
            color: feedbackListMsg.includes("Gagal") ? "var(--danger)" : "var(--success)",
            fontSize: 13, fontWeight: 600, textAlign: "center",
            border: feedbackListMsg.includes("Gagal") ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(16,185,129,0.2)",
          }}>
            {feedbackListMsg}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 20px 20px", scrollbarWidth: "none" }}>
          {["Semua", "Baru", "Diproses", "Selesai"].map(s => (
            <button
              key={s}
              onClick={() => handleFilterChange(s)}
              style={{
                padding: "8px 16px", borderRadius: 10, border: "none",
                background: feedbackStatusFilter === s ? "var(--accent)" : "var(--surface)",
                color: feedbackStatusFilter === s ? "#fff" : "var(--text-muted)",
                fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                border: feedbackStatusFilter === s ? "none" : "1px solid var(--border)",
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {feedbackLoadingList ? (
          <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 14, padding: "40px 0" }}>Memuat...</p>
        ) : (
          <div style={{ padding: "0 20px" }}>
            {feedbackList.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 14, padding: "40px 0" }}>Tidak ada feedback.</p>
            ) : (
              feedbackList.map(item => {
                const badge = statusBadge(item.status);
                const isSelesai = item.status === "selesai";
                const isDiproses = item.status === "diproses";
                return (
                  <div key={item.id} style={{
                    background: "var(--surface)", borderRadius: 16, padding: "18px 20px",
                    border: "1px solid var(--border)", marginBottom: 14
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                        color: item.kategori === "Bug" ? "var(--danger)" : (item.kategori === "Keluhan" ? "var(--warning)" : "var(--success)"),
                        background: item.kategori === "Bug" ? "var(--danger-subtle)" : (item.kategori === "Keluhan" ? "var(--warning-subtle)" : "var(--success-subtle)"),
                        padding: "3px 10px", borderRadius: 6
                      }}>
                        {item.kategori}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        {new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <h4 style={{ margin: "0 0 8px", fontSize: 15, color: "var(--text)", fontWeight: 700 }}>{item.judul}</h4>
                    <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{item.pesan}</p>

                    <div style={{
                      display: "flex", alignItems: "center", gap: 8,
                      paddingTop: 12, borderTop: "1px solid var(--border)",
                      flexWrap: "wrap",
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          margin: 0, fontSize: 10, fontWeight: 600, color: "var(--text-muted)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {item.email || "anonim"}
                        </p>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: badge.color, background: badge.bg,
                        padding: "3px 8px", borderRadius: 6,
                      }}>
                        {badge.label}
                      </span>
                      {!isDiproses && !isSelesai && (
                        <button
                          onClick={() => handleUpdateFeedbackStatus(item.id, "diproses")}
                          style={{
                            padding: "5px 10px", borderRadius: 6, border: "none",
                            background: "var(--accent)", color: "#fff", fontSize: 10, fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Diproses
                        </button>
                      )}
                      {!isSelesai && (
                        <button
                          onClick={() => handleUpdateFeedbackStatus(item.id, "selesai")}
                          style={{
                            padding: "5px 10px", borderRadius: 6, border: "none",
                            background: "var(--success)", color: "#fff", fontSize: 10, fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Selesai
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  }

  const totalSaldo = Object.keys(data).reduce((sum, tgl) => {
    const tx = data[tgl]?.transaksi ?? [];
    const masuk = tx.filter(t => t.type === "masuk").reduce((s, t) => s + (t.jumlah ?? 0), 0);
    const keluar = tx.filter(t => t.type === "keluar").reduce((s, t) => s + (t.jumlah ?? 0), 0);
    return sum + masuk - keluar;
  }, 0);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", paddingBottom: 100 }}>
      {/* ─── Header ─── */}
      <div style={{ padding: "44px 20px 20px" }}>
        <h2 style={{ color: "var(--text)", fontSize: 28, fontWeight: 800, margin: "0 0 16px", fontFamily: "'Inter', sans-serif" }}>
          Pengaturan
        </h2>

        {/* Profile header card */}
        <div style={{
          background: "var(--gradient)", borderRadius: 20, padding: "20px",
          display: "flex", alignItems: "center", gap: 16, position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: -20, right: -20, width: 100, height: 100,
            borderRadius: "50%", background: "rgba(255,255,255,0.08)", pointerEvents: "none",
          }} />
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 22, fontFamily: "'Inter', sans-serif" }}>
              {displayName[0].toUpperCase()}
            </span>
          </div>
          <div style={{ position: "relative" }}>
            <p style={{ margin: "0 0 2px", color: "#fff", fontWeight: 700, fontSize: 18, fontFamily: "'Inter', sans-serif" }}>
              {displayName}
            </p>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
              {profile?.email || "user@email.com"}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Success Message ─── */}
      {msg && (
        <div style={{
          margin: "0 20px 16px", padding: "12px 16px", borderRadius: 12,
          background: "var(--success-subtle)", border: "1px solid rgba(16,185,129,0.2)",
          color: "var(--success)", fontSize: 13, fontWeight: 600, textAlign: "center",
        }}>
          {msg}
        </div>
      )}

      {/* ─── Quick Stats ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "0 20px 20px" }}>
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 14, padding: "14px 16px", textAlign: "center",
        }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Total Saldo</p>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--accent)", fontFamily: "'Inter', sans-serif" }}>
            {formatUang(totalSaldo)}
          </p>
        </div>
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 14, padding: "14px 16px", textAlign: "center",
        }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Hari Aktif</p>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--text)", fontFamily: "'Inter', sans-serif" }}>
            {dates.length}
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/*  AKUN                                    */}
      {/* ═══════════════════════════════════════ */}
      <SectionHeader title="Akun" />
      <SettingsCard>
        {editMode === "username" ? (
          <div style={{ padding: 16 }}>
            <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Ubah Username</p>
            <input
              value={newUsername} onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Username baru"
              onKeyDown={(e) => e.key === "Enter" && doUpdateUsername()}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                border: "1px solid var(--border)", background: "var(--input-bg)",
                color: "var(--text)", fontSize: 14, fontFamily: "'Inter', sans-serif",
                outline: "none", marginBottom: 10,
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setEditMode(null)} style={{
                flex: 1, padding: "10px", borderRadius: 10, border: "1px solid var(--border)",
                background: "var(--surface)", color: "var(--text-secondary)", fontWeight: 600,
                fontSize: 13, cursor: "pointer", fontFamily: "'Inter', sans-serif",
              }}>Batal</button>
              <button onClick={doUpdateUsername} disabled={loading} style={{
                flex: 1, padding: "10px", borderRadius: 10, border: "none",
                background: "var(--accent)", color: "#fff", fontWeight: 600,
                fontSize: 13, cursor: "pointer", fontFamily: "'Inter', sans-serif",
              }}>{loading ? "..." : "Simpan"}</button>
            </div>
          </div>
        ) : (
          <>
            <SettingRow
              icon="user" iconColor="var(--accent)"
              title="Username" subtitle={displayName}
              action={() => { setEditMode("username"); setNewUsername(profile?.username || ""); }}
            />
            <Divider />
          </>
        )}

        {editMode === "password" ? (
          <div style={{ padding: 16 }}>
            <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Ubah Password</p>
            <input
              type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Password baru (min 6 karakter)"
              onKeyDown={(e) => e.key === "Enter" && doUpdatePassword()}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                border: "1px solid var(--border)", background: "var(--input-bg)",
                color: "var(--text)", fontSize: 14, fontFamily: "'Inter', sans-serif",
                outline: "none", marginBottom: 8,
              }}
            />
            <input
              type="password" value={konfirmPassword} onChange={(e) => setKonfirmPassword(e.target.value)}
              placeholder="Konfirmasi password"
              onKeyDown={(e) => e.key === "Enter" && doUpdatePassword()}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                border: "1px solid var(--border)", background: "var(--input-bg)",
                color: "var(--text)", fontSize: 14, fontFamily: "'Inter', sans-serif",
                outline: "none", marginBottom: 10,
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setEditMode(null)} style={{
                flex: 1, padding: "10px", borderRadius: 10, border: "1px solid var(--border)",
                background: "var(--surface)", color: "var(--text-secondary)", fontWeight: 600,
                fontSize: 13, cursor: "pointer", fontFamily: "'Inter', sans-serif",
              }}>Batal</button>
              <button onClick={doUpdatePassword} disabled={loading} style={{
                flex: 1, padding: "10px", borderRadius: 10, border: "none",
                background: "var(--accent)", color: "#fff", fontWeight: 600,
                fontSize: 13, cursor: "pointer", fontFamily: "'Inter', sans-serif",
              }}>{loading ? "..." : "Simpan"}</button>
            </div>
          </div>
        ) : (
          <>
            <SettingRow
              icon="lock" iconColor="var(--warning)"
              title="Password" subtitle="Ubah password akun"
              action={() => setEditMode("password")}
            />
          </>
        )}
      </SettingsCard>

      {/* ═══════════════════════════════════════ */}
      {/*  TAMPILAN                                */}
      {/* ═══════════════════════════════════════ */}
      <SectionHeader title="Tampilan" />
      <SettingsCard>
        <SettingRow
          icon={isDark ? "moon" : "sun"} iconColor="var(--info)"
          title={isDark ? "Dark Mode" : "Light Mode"} subtitle="Sesuaikan tampilan aplikasi"
          toggle={isDark} action={handleToggleTheme}
        />
      </SettingsCard>

      {/* ═══════════════════════════════════════ */}
      {/*  UANG AWAL                               */}
      {/* ═══════════════════════════════════════ */}
      {data[today] && (
        <>
          <SectionHeader title="Uang Awal" />
          <SettingsCard>
            <SettingRow
              icon="wallet" iconColor="var(--success)"
              title="Hari Ini" subtitle={formatUang(data[today]?.uang_awal ?? 0)}
              action={() => { setUbahTarget(today); setFormUangAwal(String(data[today]?.uang_awal ?? "")); setModal("ubahAwal"); }}
            />
          </SettingsCard>
        </>
      )}

      {/* ═══════════════════════════════════════ */}
      {/*  DATA & PRIVASI                          */}
      {/* ═══════════════════════════════════════ */}
      <SectionHeader title="Data & Privasi" />
      <SettingsCard>
        <SettingRow
          icon="download" iconColor="var(--success)"
          title="Export Data" subtitle="Download semua data (CSV)"
          action={() => setModal("export")}
        />
        <Divider />
        <SettingRow
          icon="upload" iconColor="var(--accent)"
          title="Import Data" subtitle="Restore dari file JSON"
          action={handleImportData}
        />
        <Divider />
        <SettingRow
          icon="trash" iconColor="var(--warning)"
          title="Hapus Semua Data" subtitle="Reset semua transaksi & uang awal"
          action={handleClearData} danger={false}
        />
      </SettingsCard>

      {/* ═══════════════════════════════════════
       *  TENTANG                                 
       * ═══════════════════════════════════════ */}
      <SectionHeader title="Tentang" />
      <SettingsCard>
        <SettingRow
          icon="info" iconColor="var(--accent)"
          title="Finly" subtitle={`Versi ${version}`}
          badge={dates.length > 0 ? `${dates.length} hari` : null}
        />
        <Divider />
        <SettingRow
          icon="messageSquare" iconColor="var(--info)"
          title="Keluhan & Masukan"
          subtitle="Kirim laporan bug, keluhan, atau saran fitur untuk pengembangan Finly"
          action={() => { setSettingsView("feedback-form"); setFeedbackSubmitted(false); setFeedbackMsg(""); }}
        />
        {isAdmin && (
          <>
            <Divider />
            <SettingRow
              icon="inbox" iconColor="var(--success)"
              title="Feedback Masuk"
              subtitle="Keluhan dan masukan dari pengguna Finly"
              action={() => { setSettingsView("feedback-admin"); fetchFeedbackList(); }}
            />
          </>
        )}
        <Divider />
        <SettingRow
          icon="code" iconColor="var(--text-muted)"
          title="Tech Stack" subtitle="React, Vite, Supabase"
        />
      </SettingsCard>

      {/* ═══════════════════════════════════════ */}
      {/*  LOGOUT / DELETE                         */}
      {/* ═══════════════════════════════════════ */}
      <div style={{ padding: "20px 20px 40px" }}>
        <button onClick={onLogout} style={{
          width: "100%", padding: "14px", borderRadius: 14,
          background: "var(--danger-subtle)", border: "1px solid rgba(239,68,68,0.15)",
          color: "var(--danger)", fontSize: 14, fontWeight: 700,
          cursor: "pointer", fontFamily: "'Inter', sans-serif",
        }}>
          Keluar
        </button>

        <button onClick={() => {
            if(window.confirm("Hapus akun permanen? Data tidak bisa dipulihkan.")) {
                supabase.auth.admin?.deleteUser?.(user.id).then(() => {
                    supabase.auth.signOut().then(() => onLogout());
                }).catch(() => {
                    supabase.auth.signOut().then(() => onLogout());
                });
            }
        }} style={{
          width: "100%", padding: "12px", borderRadius: 12, marginTop: 10,
          background: "none", border: "none", color: "var(--text-muted)",
          fontSize: 12, cursor: "pointer", fontFamily: "'Inter', sans-serif",
          textDecoration: "underline",
        }}>
          Hapus Akun Permanen
        </button>
      </div>
    </div>
  );
}
