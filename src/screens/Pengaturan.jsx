import { useState } from "react";
import { version } from '../../package.json';
import Card from "../components/Card";
import Badge from "../components/Badge";
import Icon from "../components/Icon";
import Btn from "../components/Button";
import Field from "../components/Field";
import { formatUang } from "../utils/format";
import { updateProfile, updatePassword, getDisplayName } from "../utils/storage";
import { supabase } from "../utils/supabase";
import { toggleTheme } from "../theme";

/* ═══════════════════════════════════════════
 *  PENGATURAN SCREEN
 * ═══════════════════════════════════════════ */

/* ─── Riwayat Uang Awal ─── */
function RiwayatUangAwal({ dates, data, setUbahTarget, setFormUangAwal, setModal }) {
  const [show, setShow] = useState(false);
  if (dates.length === 0) return null;
  return (
    <div>
      <button onClick={() => setShow(!show)} style={{
        width: "100%", background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 12, padding: "10px 14px", cursor: "pointer", color: "var(--text-secondary)",
        fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 12, textAlign: "left",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span>Riwayat uang awal ({dates.length} hari)</span>
        <span style={{ fontSize: 10 }}>{show ? "▲" : "▼"}</span>
      </button>
      {show && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
          {dates.map(tgl => (
            <div key={tgl} style={{
              background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12,
              padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <p style={{ margin: "0 0 2px", color: "var(--text)", fontWeight: 600, fontSize: 13 }}>{tgl}</p>
                <p style={{ margin: 0, color: "var(--success)", fontSize: 12, fontWeight: 700 }}>{formatUang(data[tgl]?.uang_awal ?? 0)}</p>
              </div>
              <button onClick={() => { setUbahTarget(tgl); setFormUangAwal(String(data[tgl]?.uang_awal ?? "")); setModal("ubahAwal"); }} style={{
                background: "var(--accent-subtle)", border: "none", borderRadius: 8,
                padding: "6px 10px", cursor: "pointer", color: "var(--accent)",
              }}>
                <Icon name="edit" size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PengaturanScreen({
  data, today, dates,
  setUbahTarget, setFormUangAwal, setModal,
  profile, setProfile, user, onLogout
}) {
  const [editUsername, setEditUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [editPassword, setEditPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [konfirmPassword, setKonfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [konfirmLogout, setKonfirmLogout] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem("kasapp-theme") === "dark"; } catch { return false; }
  });

  const handleToggleTheme = () => {
    toggleTheme();
    setIsDark(prev => !prev);
  };

  const displayName = getDisplayName(profile, user);

  const doUpdateUsername = async () => {
    if (!newUsername.trim()) return setMsg("Username tidak boleh kosong!");
    setLoading(true);
    try {
      await updateProfile(newUsername.trim());
      setProfile({ ...profile, username: newUsername.trim() });
      setEditUsername(false);
      setNewUsername("");
      setMsg("Username berhasil diubah!");
      setTimeout(() => setMsg(""), 2000);
    } catch {
      setMsg("Gagal mengubah username!");
    } finally {
      setLoading(false);
    }
  };

  const doUpdatePassword = async () => {
    if (!newPassword) return setMsg("Password tidak boleh kosong!");
    if (newPassword.length < 6) return setMsg("Password minimal 6 karakter!");
    if (newPassword !== konfirmPassword) return setMsg("Password tidak cocok!");
    setLoading(true);
    try {
      await updatePassword(newPassword);
      setEditPassword(false);
      setNewPassword("");
      setKonfirmPassword("");
      setMsg("Password berhasil diubah!");
      setTimeout(() => setMsg(""), 2000);
    } catch {
      setMsg("Gagal mengubah password!");
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      title: "Ubah Username",
      show: !editUsername,
      action: () => { setEditUsername(true); setNewUsername(profile?.username || ""); setEditPassword(false); },
      button: true,
    },
  ];

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", paddingBottom: 100 }}>
      {/* ─── Header ─── */}
      <div style={{ padding: "44px 20px 16px" }}>
        <h2 style={{ color: "var(--text)", fontSize: 20, fontWeight: 800, margin: 0, fontFamily: "'Inter', sans-serif" }}>
          Pengaturan
        </h2>
      </div>

      {/* ─── Profile Card ─── */}
      <div style={{ padding: "0 20px 20px" }}>
        <Card style={{ padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, background: "var(--gradient)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: 18, fontFamily: "'Inter', sans-serif" }}>
                {displayName[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p style={{ margin: "0 0 2px", color: "var(--text)", fontWeight: 700, fontSize: 16, fontFamily: "'Inter', sans-serif" }}>
                {displayName}
              </p>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 12 }}>{profile?.email || ""}</p>
            </div>
          </div>

          {msg && <p style={{ color: "var(--success)", fontSize: 13, margin: "0 0 12px", textAlign: "center", fontWeight: 600 }}>{msg}</p>}

          {!editUsername ? (
            <button onClick={() => { setEditUsername(true); setNewUsername(profile?.username || ""); setEditPassword(false); }} style={{
              width: "100%", background: "var(--accent-subtle)", border: "1px solid var(--accent-border)",
              borderRadius: 12, padding: "11px", cursor: "pointer", color: "var(--accent)",
              fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13, marginBottom: 8,
            }}>
              Ubah Username
            </button>
          ) : (
            <div style={{ marginBottom: 8 }}>
              <Field label="Username Baru" value={newUsername} onChange={setNewUsername} placeholder="Username baru" onKeyDown={(e) => e.key === 'Enter' && doUpdateUsername()} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Btn onClick={() => setEditUsername(false)} variant="ghost">Batal</Btn>
                <Btn onClick={doUpdateUsername} disabled={loading}>{loading ? "Menyimpan..." : "Simpan"}</Btn>
              </div>
            </div>
          )}

          {!editPassword ? (
            <button onClick={() => { setEditPassword(true); setEditUsername(false); }} style={{
              width: "100%", background: "var(--accent-subtle)", border: "1px solid var(--accent-border)",
              borderRadius: 12, padding: "11px", cursor: "pointer", color: "var(--accent)",
              fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13,
            }}>
              Ubah Password
            </button>
          ) : (
            <div>
              <Field label="Password Baru" value={newPassword} onChange={setNewPassword} type="password" placeholder="Minimal 6 karakter" onKeyDown={(e) => e.key === 'Enter' && doUpdatePassword()} />
              <Field label="Konfirmasi Password" value={konfirmPassword} onChange={setKonfirmPassword} type="password" placeholder="Ulangi password baru" onKeyDown={(e) => e.key === 'Enter' && doUpdatePassword()} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Btn onClick={() => setEditPassword(false)} variant="ghost">Batal</Btn>
                <Btn onClick={doUpdatePassword} disabled={loading}>{loading ? "Menyimpan..." : "Simpan"}</Btn>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ─── Uang Awal ─── */}
      <div style={{ padding: "0 20px 20px" }}>
        <p style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Uang Awal</p>
        {!data[today] && (
          <button onClick={() => setModal("setup")} style={{
            width: "100%", background: "var(--accent-subtle)", border: "1px solid var(--accent-border)",
            borderRadius: 14, padding: "13px", cursor: "pointer", color: "var(--accent)",
            fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 10,
          }}>
            Setup Uang Awal Hari Ini
          </button>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {data[today] && (
            <div style={{
              background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12,
              padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <p style={{ margin: "0 0 2px", color: "var(--text)", fontWeight: 600, fontSize: 13 }}>
                  Hari Ini
                </p>
                <p style={{ margin: 0, color: "var(--success)", fontSize: 13, fontWeight: 700 }}>
                  {formatUang(data[today]?.uang_awal ?? 0)}
                </p>
              </div>
              <button onClick={() => { setUbahTarget(today); setFormUangAwal(String(data[today]?.uang_awal ?? "")); setModal("ubahAwal"); }} style={{
                background: "var(--accent-subtle)", border: "none", borderRadius: 8,
                padding: "6px 10px", cursor: "pointer", color: "var(--accent)",
              }}>
                <Icon name="edit" size={14} />
              </button>
            </div>
          )}
          <RiwayatUangAwal
            dates={dates.filter(tgl => tgl !== today)}
            data={data}
            setUbahTarget={setUbahTarget}
            setFormUangAwal={setFormUangAwal}
            setModal={setModal}
          />
        </div>
      </div>

      {/* ─── Info ─── */}
      <div style={{ padding: "0 20px 20px" }}>
        <p style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Info</p>
        <Card style={{ padding: "14px 16px" }}>
          <p style={{ margin: "0 0 4px", color: "var(--text)", fontWeight: 700, fontSize: 15, fontFamily: "'Inter', sans-serif" }}>Kasapp</p>
          <p style={{ margin: "0 0 10px", color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.5 }}>Manajemen kas harian dengan laporan cash, QRIS, dan pengeluaran per kategori.</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            <Badge color="var(--accent)">v{version}</Badge>
            <Badge color="var(--success)">{dates.length} Hari</Badge>
          </div>

          {/* Dark mode toggle */}
          <button onClick={handleToggleTheme} style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 14px", borderRadius: 12, border: "1px solid var(--border)",
            background: "var(--input-bg)", cursor: "pointer",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>{isDark ? "🌙" : "☀️"}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", fontFamily: "'Inter', sans-serif" }}>
                {isDark ? "Dark Mode" : "Light Mode"}
              </span>
            </div>
            <div style={{
              width: 44, height: 24, borderRadius: 12,
              background: isDark ? "var(--accent)" : "var(--border)",
              position: "relative", transition: "background 0.2s",
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%",
                background: "#fff", position: "absolute", top: 2,
                left: isDark ? 22 : 2,
                transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }} />
            </div>
          </button>
        </Card>
      </div>

      {/* ─── Actions ─── */}
      <div style={{ padding: "0 20px" }}>
        <button onClick={() => setKonfirmLogout(!konfirmLogout)} style={{
          width: "100%", background: konfirmLogout ? "var(--danger)" : "var(--danger-subtle)",
          border: konfirmLogout ? "none" : "1px solid rgba(239,68,68,0.15)",
          borderRadius: 14, padding: "13px", cursor: "pointer", color: "#fff",
          fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 14, marginBottom: 8,
          transition: "all 0.2s",
        }}>
          {konfirmLogout ? "Konfirmasi Keluar?" : "Keluar"}
        </button>
        {konfirmLogout && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <Btn onClick={() => setKonfirmLogout(false)} variant="ghost">Batal</Btn>
            <Btn onClick={onLogout} variant="danger">Keluar</Btn>
          </div>
        )}
      </div>
    </div>
  );
}
