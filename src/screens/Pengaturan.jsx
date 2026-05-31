import { useState } from "react";
import { version } from '../../package.json';
import Icon from "../components/Icon";
import { formatUang } from "../utils/format";
import { updateProfile, updatePassword, getDisplayName } from "../utils/storage";
import { supabase } from "../utils/supabase";
import { insertFeedback } from "../utils/supabase-feedback";
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
  const [modalFeedback, setModalFeedback] = useState(false);
  const [feedbackKategori, setFeedbackKategori] = useState("Keluhan");
  const [feedbackJudul, setFeedbackJudul] = useState("");
  const [feedbackPesan, setFeedbackPesan] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  /* ─── Theme ─── */
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem("kasapp-theme") === "dark"; } catch { return false; }
  });

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
    try {
      await insertFeedback({
        kategori: feedbackKategori,
        judul: feedbackJudul.trim(),
        pesan: feedbackPesan.trim(),
        email: profile?.email || user?.email,
      });
      setFeedbackMsg("Masukan berhasil dikirim. Terima kasih!");
      setTimeout(() => {
        setModalFeedback(false);
        setFeedbackJudul("");
        setFeedbackPesan("");
        setFeedbackMsg("");
      }, 2000);
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
          icon="message" iconColor="var(--info)"
          title="Keluhan & Masukan"
          subtitle="Kirim laporan bug, keluhan, atau saran fitur untuk pengembangan Finly"
          action={() => setModalFeedback(true)}
        />
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

      {/* ═══════════════════════════════════════ */}
      {/*  MODAL FEEDBACK                          */}
      {/* ═══════════════════════════════════════ */}
      {modalFeedback && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.6)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20, backdropFilter: "blur(4px)",
        }}>
          <div style={{
            background: "var(--surface)", borderRadius: 24, width: "100%", maxWidth: 400,
            padding: 24, border: "1px solid var(--border)",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)",
          }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: "var(--text)" }}>Keluhan & Masukan</h3>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--text-muted)" }}>
              Bantu kami memperbaiki Finly dengan masukan Anda.
            </p>

            {feedbackMsg && (
              <div style={{
                marginBottom: 16, padding: "10px 14px", borderRadius: 10,
                background: feedbackMsg.includes("berhasil") ? "var(--success-subtle)" : "var(--danger-subtle)",
                color: feedbackMsg.includes("berhasil") ? "var(--success)" : "var(--danger)",
                fontSize: 12, fontWeight: 600, textAlign: "center",
              }}>
                {feedbackMsg}
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>Kategori</label>
              <select
                value={feedbackKategori} onChange={(e) => setFeedbackKategori(e.target.value)}
                style={{
                  width: "100%", padding: "12px", borderRadius: 12,
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

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>Judul</label>
              <input
                value={feedbackJudul} onChange={(e) => setFeedbackJudul(e.target.value)}
                placeholder="Judul singkat"
                style={{
                  width: "100%", padding: "12px", borderRadius: 12,
                  border: "1px solid var(--border)", background: "var(--input-bg)",
                  color: "var(--text)", fontSize: 14, fontFamily: "'Inter', sans-serif", outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>Pesan</label>
              <textarea
                value={feedbackPesan} onChange={(e) => setFeedbackPesan(e.target.value)}
                placeholder="Detail masukan Anda..."
                rows={4}
                style={{
                  width: "100%", padding: "12px", borderRadius: 12,
                  border: "1px solid var(--border)", background: "var(--input-bg)",
                  color: "var(--text)", fontSize: 14, fontFamily: "'Inter', sans-serif", outline: "none",
                  resize: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { setModalFeedback(false); setFeedbackMsg(""); }}
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
                {feedbackLoading ? "Mengirim..." : "Kirim"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
