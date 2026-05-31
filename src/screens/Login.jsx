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
      alignItems: "center", justifyContent: "center", padding: "20px",
      background: "var(--bg)",
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        width: "100%", maxWidth: 400,
        display: "flex", flexDirection: "column", gap: 32
      }}>
        {/* Header Section */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 84, height: 84, margin: "0 auto 20px", borderRadius: 22,
            background: "var(--surface)", display: "flex", alignItems: "center",
            justifyContent: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            overflow: "hidden"
          }}>
            <img src="/logo.png" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.05)" }} />
          </div>
          <h1 style={{ color: "var(--text)", fontSize: 28, fontWeight: 800, margin: "0 0 8px", letterSpacing: -1 }}>
            {isForgot ? "Reset Password" : isRegister ? "Daftar Akun" : "Selamat Datang"}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0 }}>
            {isForgot ? "Masukkan email untuk mereset sandi" : isRegister ? "Mulai kelola keuanganmu sekarang" : "Silakan masuk ke akun Finly Anda"}
          </p>
        </div>

        {/* Form Card */}
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 24,
          padding: "28px",
          boxShadow: "var(--shadow-md)",
          display: "flex",
          flexDirection: "column",
          gap: 16
        }}>
          {isForgot ? (
            <>
              <Field label="Email" value={email} onChange={setEmail} placeholder="nama@email.com"
                onKeyDown={(e) => e.key === "Enter" && handleForgotPassword()} />
              {error && <p style={{ color: "var(--danger)", fontSize: 13, textAlign: "center", margin: 0 }}>{error}</p>}
              {msg && <p style={{ color: "var(--success)", fontSize: 13, textAlign: "center", fontWeight: 600, margin: 0 }}>{msg}</p>}
              <Btn onClick={handleForgotPassword} disabled={loading} fullWidth>
                {loading ? "Mengirim..." : "Kirim Link Reset"}
              </Btn>
              <button onClick={() => { setIsForgot(false); resetForm(); }} style={{
                background: "none", border: "none", color: "var(--text-muted)",
                fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 8
              }}>
                Kembali ke Login
              </button>
            </>
          ) : (
            <>
              {isRegister && (
                <Field label="Username" value={username} onChange={setUsername} placeholder="nathan_lie"
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
              )}
              <Field label="Email atau Username" value={email} onChange={setEmail}
                placeholder={isRegister ? "nama@email.com" : "Email atau username"}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
              
              <div style={{ position: "relative" }}>
                <Field label="Password" value={password} onChange={setPassword}
                  type={showPassword ? "text" : "password"} placeholder="••••••••"
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
                <button onClick={() => setShowPassword(!showPassword)} style={{
                  position: "absolute", right: 14, top: 38, background: "none", border: "none",
                  cursor: "pointer", color: "var(--text-muted)", padding: 4
                }}>
                  <Icon name={showPassword ? "close" : "edit"} size={18} />
                </button>
              </div>

              {error && <p style={{ color: "var(--danger)", fontSize: 13, textAlign: "center", margin: 0 }}>{error}</p>}
              {msg && <p style={{ color: "var(--success)", fontSize: 13, textAlign: "center", fontWeight: 600, margin: 0 }}>{msg}</p>}

              <div style={{ marginTop: 8 }}>
                <Btn onClick={handleSubmit} disabled={loading} fullWidth>
                  {loading ? "Memproses..." : isRegister ? "Buat Akun" : "Masuk"}
                </Btn>
              </div>

              {!isRegister && (
                <button onClick={() => { setIsForgot(true); resetForm(); }} style={{
                  background: "none", border: "none", color: "var(--text-secondary)",
                  fontSize: 13, cursor: "pointer", alignSelf: "center"
                }}>
                  Lupa password?
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer Toggle */}
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            {isRegister ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
            <button onClick={() => { setIsRegister(!isRegister); resetForm(); }} style={{
              background: "none", border: "none", color: "var(--accent)",
              fontSize: 14, fontWeight: 700, cursor: "pointer", padding: 0
            }}>
              {isRegister ? "Masuk di sini" : "Daftar sekarang"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
