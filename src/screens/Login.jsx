import { useState } from "react";
import { supabase } from "../utils/supabase";
import Btn from "../components/Button";
import Field from "../components/Field";

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const resetForm = () => {
    setEmail(""); setPassword(""); setUsername("");
    setError(""); setMsg("");
  };

  const handleResend = async () => {
    if (!email) return setError("Masukkan email kamu dulu!");
    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      setMsg("Email konfirmasi sudah dikirim ulang! Cek inbox/spam kamu.");
    } catch (err) {
      setError(err.message);
    } finally {
      setResendLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return setError("Masukkan email kamu dulu!");
    if (!trimmedEmail.includes('@')) return setError("Masukkan email yang valid!");

    setLoading(true);
    setError("");
    setMsg("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: window.location.origin + "/?reset=true",
      });
      if (error) throw error;
      setMsg("Link reset password sudah dikirim! Cek inbox/spam email kamu.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
    setError("");
    setMsg("");

    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: trimmedPassword,
          options: {
            data: { username: trimmedUsername }
          }
        });
        if (error) throw error;

        if (data.user) {
          // upsert agar tidak gagal kalau trigger Supabase sudah buat row profile
          await supabase.from('profiles').upsert({
            id: data.user.id,
            username: trimmedUsername,
            email: trimmedEmail,
          });
        }

        if (data.user && !data.user.confirmed_at) {
          setMsg("Pendaftaran berhasil! Cek email kamu untuk konfirmasi akun sebelum login.");
          return;
        }

        onLogin();

      } else {
        let loginEmail = trimmedEmail;
        const isEmail = trimmedEmail.includes('@');

        if (!isEmail) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('email')
            .ilike('username', trimmedEmail)
            .single();

          if (profileError || !profileData?.email) {
            throw new Error("Username tidak ditemukan!");
          }
          loginEmail = profileData.email;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: trimmedPassword,
        });

        if (error) {
          if (error.message.includes('Email not confirmed')) {
            throw new Error("Email belum dikonfirmasi. Cek inbox/spam kamu!");
          }
          throw error;
        }

        onLogin();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", background: "#0D0D1A" }}>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ width: 72, height: 72, margin: "0 auto 16px", borderRadius: 20, background: "linear-gradient(135deg,#7C3AED,#4F46E5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="44" height="44" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="16" width="48" height="32" rx="8" fill="rgba(255,255,255,0.16)" />
            <rect x="12" y="20" width="40" height="20" rx="5" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
            <path d="M16 28H44" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="48" cy="32" r="7" fill="rgba(255,255,255,0.22)" />
            <path d="M45 32H51" stroke="rgba(255,255,255,0.95)" strokeWidth="2" strokeLinecap="round" />
            <path d="M48 29V35" stroke="rgba(255,255,255,0.95)" strokeWidth="2" strokeLinecap="round" />
            <path d="M22 28L22 36" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
            <path d="M26 28L26 36" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
          </svg>
        </div>
        <h1 style={{ color: "#fff", fontSize: 28, fontFamily: "'Sora', sans-serif", fontWeight: 800, margin: "0 0 8px" }}>
          Kas Toko
        </h1>
        <p style={{ color: "#6b6b88", fontSize: 14, margin: 0 }}>
          {isForgot ? "Reset password" : isRegister ? "Buat akun baru" : "Masuk ke akun kamu"}
        </p>
      </div>

      <div style={{ width: "100%", maxWidth: 400, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 24 }}>

        {/* MODE: LUPA PASSWORD */}
        {isForgot ? (
          <>
            <p style={{ color: "#8888aa", fontSize: 13, marginBottom: 16 }}>
              Masukkan email akun kamu. Kami akan kirim link untuk reset password.
            </p>
            <Field
              label="Email"
              value={email}
              onChange={setEmail}
              placeholder="email@example.com"
              onKeyDown={(e) => e.key === "Enter" && handleForgotPassword()}
            />
            {error && <p style={{ color: "#EF4444", fontSize: 13, margin: "-8px 0 12px", textAlign: "center" }}>{error}</p>}
            {msg && <p style={{ color: "#10B981", fontSize: 13, margin: "-8px 0 12px", textAlign: "center", fontWeight: 600 }}>{msg}</p>}
            <div style={{ marginTop: 8 }}>
              <Btn onClick={handleForgotPassword} disabled={loading}>
                {loading ? "Mengirim..." : "Kirim Link Reset"}
              </Btn>
            </div>
            <button
              onClick={() => { setIsForgot(false); resetForm(); }}
              style={{ width: "100%", background: "none", border: "none", color: "#6366F1", fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 16, fontFamily: "'Sora', sans-serif" }}
            >
              ← Kembali ke Login
            </button>
          </>
        ) : (
          <>
            {/* MODE: LOGIN / REGISTER */}
            {isRegister && (
              <Field label="Username" value={username} onChange={setUsername} placeholder="contoh: nathan"
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
            )}
            <Field
              label="Email atau Username"
              value={email}
              onChange={setEmail}
              placeholder={isRegister ? "email@example.com" : "email atau username"}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
           <div style={{ position: "relative" }}>
  <Field
    label="Password"
    value={password}
    onChange={setPassword}
    type={showPassword ? "text" : "password"}
    placeholder="Minimal 6 karakter"
    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
  />
  <button
    onClick={() => setShowPassword(!showPassword)}
    style={{ position: "absolute", right: 12, top: 34, background: "none", border: "none", cursor: "pointer", color: "#6b6b88", padding: 4 }}
  >
    {showPassword ? (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
    ) : (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    )}
  </button>
</div>

            {error && <p style={{ color: "#EF4444", fontSize: 13, margin: "-8px 0 12px", textAlign: "center" }}>{error}</p>}
            {msg && <p style={{ color: "#10B981", fontSize: 13, margin: "-8px 0 12px", textAlign: "center", fontWeight: 600 }}>{msg}</p>}

            <div style={{ marginTop: 8 }}>
              <Btn onClick={handleSubmit} disabled={loading}>
                {loading ? "Memproses..." : isRegister ? "Daftar" : "Masuk"}
              </Btn>
            </div>

            {/* Lupa password — hanya tampil di mode login */}
            {!isRegister && (
              <button
                onClick={() => { setIsForgot(true); resetForm(); }}
                style={{ width: "100%", background: "none", border: "none", color: "#8888aa", fontSize: 12, cursor: "pointer", marginTop: 12, fontFamily: "'Sora', sans-serif" }}
              >
                Lupa password?
              </button>
            )}

            <button
              onClick={() => { setIsRegister(!isRegister); resetForm(); }}
              style={{ width: "100%", background: "none", border: "none", color: "#6366F1", fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 8, fontFamily: "'Sora', sans-serif" }}
            >
              {isRegister ? "Sudah punya akun? Masuk" : "Belum punya akun? Daftar"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}