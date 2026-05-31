import { useState } from "react";
import { supabase } from "../utils/supabase";
import Btn from "../components/Button";
import Field from "../components/Field";
import Icon from "../components/Icon";

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const resetForm = () => {
    setEmail(""); setPassword(""); setUsername("");
    setError(""); setMsg("");
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return setError("Masukkan email kamu dulu!");
    if (!trimmedEmail.includes('@')) return setError("Masukkan email yang valid!");
    setLoading(true);
    setError(""); setMsg("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: window.location.origin + "/?reset=true",
      });
      if (error) throw error;
      setMsg("Link reset password sudah dikirim! Cek inbox/spam email kamu.");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) return setError("Email/username dan password wajib diisi!");
    if (trimmedPassword.length < 6) return setError("Password minimal 6 karakter!");
    if (isRegister && !trimmedUsername) return setError("Username wajib diisi!");
    if (isRegister && trimmedUsername.includes(' ')) return setError("Username tidak boleh mengandung spasi!");
    if (isRegister && trimmedUsername.length < 3) return setError("Username minimal 3 karakter!");
    if (isRegister && !/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      return setError("Username hanya boleh huruf, angka, dan underscore!");
    }

    setLoading(true);
    setError(""); setMsg("");

    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: trimmedPassword,
          options: { data: { username: trimmedUsername } }
        });
        if (error) throw error;
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id, username: trimmedUsername, email: trimmedEmail,
          });
        }
        if (data.user && !data.user.confirmed_at) {
          setMsg("Pendaftaran berhasil! Cek email kamu untuk konfirmasi akun.");
          return;
        }
        onLogin();
      } else {
        let loginEmail = trimmedEmail;
        const isEmail = trimmedEmail.includes('@');
        if (!isEmail) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles').select('email').ilike('username', trimmedEmail).single();
          if (profileError || !profileData?.email) throw new Error("Username tidak ditemukan!");
          loginEmail = profileData.email;
        }
        const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: trimmedPassword });
        if (error) {
          if (error.message.includes('Email not confirmed')) throw new Error("Email belum dikonfirmasi. Cek inbox/spam!");
          throw error;
        }
        onLogin();
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "0 24px",
      background: "var(--bg)",
    }}>
      <div style={{ marginBottom: 28, textAlign: "center" }}>
        <div style={{
          width: 64, height: 64, margin: "0 auto 14px", borderRadius: 18,
          background: "var(--gradient)", display: "flex", alignItems: "center",
          justifyContent: "center", boxShadow: "0 8px 24px rgba(107,126,255,0.25)",
        }}>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 28, fontFamily: "'Inter', sans-serif" }}>K</span>
        </div>
        <h1 style={{ color: "var(--text)", fontSize: 24, fontFamily: "'Inter', sans-serif", fontWeight: 800, margin: "0 0 6px" }}>
          Kasapp
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: 0 }}>
          {isForgot ? "Reset password" : isRegister ? "Buat akun baru" : "Masuk ke akun kamu"}
        </p>
      </div>

      <div style={{
        width: "100%", maxWidth: 400, background: "var(--surface)",
        border: "1px solid var(--border)", borderRadius: 20, padding: 24,
        boxShadow: "var(--shadow-md)",
      }}>
        {isForgot ? (
          <>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
              Masukkan email akun kamu. Kami akan kirim link untuk reset password.
            </p>
            <Field label="Email" value={email} onChange={setEmail} placeholder="email@example.com"
              onKeyDown={(e) => e.key === "Enter" && handleForgotPassword()} />
            {error && <p style={{ color: "var(--danger)", fontSize: 13, margin: "-8px 0 12px", textAlign: "center" }}>{error}</p>}
            {msg && <p style={{ color: "var(--success)", fontSize: 13, margin: "-8px 0 12px", textAlign: "center", fontWeight: 600 }}>{msg}</p>}
            <div style={{ marginTop: 8 }}>
              <Btn onClick={handleForgotPassword} disabled={loading} fullWidth>
                {loading ? "Mengirim..." : "Kirim Link Reset"}
              </Btn>
            </div>
            <button onClick={() => { setIsForgot(false); resetForm(); }} style={{
              width: "100%", background: "none", border: "none", color: "var(--accent)",
              fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 16,
              fontFamily: "'Inter', sans-serif",
            }}>
              ← Kembali ke Login
            </button>
          </>
        ) : (
          <>
            {isRegister && (
              <Field label="Username" value={username} onChange={setUsername} placeholder="contoh: nathan"
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
            )}
            <Field label="Email atau Username" value={email} onChange={setEmail}
              placeholder={isRegister ? "email@example.com" : "email atau username"}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
            <div style={{ position: "relative" }}>
              <Field label="Password" value={password} onChange={setPassword}
                type={showPassword ? "text" : "password"} placeholder="Minimal 6 karakter"
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
              <button onClick={() => setShowPassword(!showPassword)} style={{
                position: "absolute", right: 14, top: 36, background: "none", border: "none",
                cursor: "pointer", color: "var(--text-muted)", padding: 4,
              }}>
                <Icon name={showPassword ? "close" : "edit"} size={16} />
              </button>
            </div>
            {error && <p style={{ color: "var(--danger)", fontSize: 13, margin: "-8px 0 12px", textAlign: "center" }}>{error}</p>}
            {msg && <p style={{ color: "var(--success)", fontSize: 13, margin: "-8px 0 12px", textAlign: "center", fontWeight: 600 }}>{msg}</p>}
            <div style={{ marginTop: 8 }}>
              <Btn onClick={handleSubmit} disabled={loading} fullWidth>
                {loading ? "Memproses..." : isRegister ? "Daftar" : "Masuk"}
              </Btn>
            </div>
            {!isRegister && (
              <button onClick={() => { setIsForgot(true); resetForm(); }} style={{
                width: "100%", background: "none", border: "none", color: "var(--text-secondary)",
                fontSize: 12, cursor: "pointer", marginTop: 12, fontFamily: "'Inter', sans-serif",
              }}>
                Lupa password?
              </button>
            )}
            <button onClick={() => { setIsRegister(!isRegister); resetForm(); }} style={{
              width: "100%", background: "none", border: "none", color: "var(--accent)",
              fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 8,
              fontFamily: "'Inter', sans-serif",
            }}>
              {isRegister ? "Sudah punya akun? Masuk" : "Belum punya akun? Daftar"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
