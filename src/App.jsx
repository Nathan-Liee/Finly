import { useState, useEffect, useCallback } from "react";
import { supabase } from "./utils/supabase";
import LoginScreen from "./screens/Login";

import Modal  from "./components/Modal";
import Btn   from "./components/Button";
import Field from "./components/Field";
import Icon  from "./components/Icon";
import Toast from "./components/Toast";

import HomeScreen       from "./screens/Home";
import LaporanScreen    from "./screens/Laporan";
import PengaturanScreen from "./screens/Pengaturan";

import { loadData, saveHarian, saveTransaksi, getCurrentDate, loadProfile } from "./utils/storage";
import { calcHarian } from "./utils/calc";
import { formatAngka } from "./utils/format";
import { saveTransaksiLocal, saveUangAwalLocal, addToSyncQueue } from "./db/index";

/* ─── Helpers ─── */
const cleanNumber = (str) => String(str ?? "").replace(/\./g, "");

const safeCalc = (dayData) => {
  if (!dayData) return { uang_awal: 0, totalCash: 0, totalQris: 0, totalMasuk: 0, gaji: 0, nonGaji: 0, totalKeluar: 0, saldoCash: 0, saldoTotal: 0, saldoTanpaGaji: 0, transaksi: [], kategoriMap: {} };
  return calcHarian(dayData);
};

const TABS = [
  { key: "home",       icon: "home",  label: "Beranda"    },
  { key: "laporan",    icon: "chart", label: "Laporan"    },
  { key: "pengaturan", icon: "settings", label: "Pengaturan" },
];

export default function App() {
  const [data, setData]        = useState({});
  const [tab, setTab]          = useState("home");
  const [user, setUser]        = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [profile, setProfile]  = useState(null);
  const [today, setToday]      = useState(getCurrentDate);
  const [toast, setToast]      = useState(null);
  const [modal, setModal]      = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  // Form states
  const [formJumlah,    setFormJumlah]    = useState("");
  const [formMetode,    setFormMetode]    = useState("cash");
  const [formKategori,  setFormKategori]  = useState("");
  const [formCatatan,   setFormCatatan]   = useState("");
  const [formUangAwal,  setFormUangAwal]  = useState("");
  const [hapusIdx,      setHapusIdx]      = useState(null);
  const [setupUangAwal, setSetupUangAwal] = useState("");
  const [ubahTarget,    setUbahTarget]    = useState(null);
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [editIdx,       setEditIdx]       = useState(null);
  const [formEditJumlah,  setFormEditJumlah]  = useState("");
  const [formEditMetode,  setFormEditMetode]  = useState("cash");
  const [formEditKategori,setFormEditKategori]= useState("");
  const [formEditCatatan, setFormEditCatatan] = useState("");

  /* ─── Auth init ─── */
  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) {
        console.warn("[Auth] Timeout — fallback offline mode");
        setUser(null);
        setAuthLoading(false);
      }
    }, 3000);

    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;
        clearTimeout(timeout);
        setUser(user ?? null);
        setAuthLoading(false);

        if (user) {
          const fb = user.user_metadata?.username || user.email?.split('@')?.[0] || 'user';
          try {
            const { data: existingProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (!existingProfile) {
              await supabase.from('profiles').insert({ id: user.id, username: fb, email: user.email });
            } else if (!existingProfile.username) {
              await supabase.from('profiles').update({ username: fb }).eq('id', user.id);
            }
          } catch { /* skip */ }

          try { setProfile(await loadProfile()); } catch { setProfile(null); }
          try {
            const d = await loadData();
            setData(d || {});
            if (!(d || {})[getCurrentDate()]) setModal("setup");
          } catch { setData({}); setModal("setup"); }
        }
      } catch (err) {
        if (cancelled) return;
        clearTimeout(timeout);
        console.error("[Auth] Init error:", err);
        setUser(null);
        setAuthLoading(false);
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /* ─── Date ticker ─── */
  useEffect(() => {
    const interval = setInterval(() => {
      const newDate = getCurrentDate();
      if (newDate !== today) setToday(newDate);
    }, 60000);
    return () => clearInterval(interval);
  }, [today]);

  /* ─── Sync queue saat online ─── */
  useEffect(() => {
    if (!isOnline || !user) return;
    const syncData = async () => {
      try {
        const { getSyncQueue, clearSyncQueue } = await import('./db/index');
        const queue = await getSyncQueue();
        if (!queue?.length) return;
        let synced = false;
        for (const item of queue) {
          try {
            if (item.action === 'transaksi') { await saveTransaksi(item.data.tanggal, item.data.transaksi); synced = true; }
            else if (item.action === 'uang_awal') { await saveHarian(item.data.tanggal, item.data.uang_awal); synced = true; }
          } catch { /* skip */ }
        }
        if (synced) { await clearSyncQueue(); showToast("Data tersinkron!", "success"); }
      } catch (err) { console.error("[Sync] Gagal:", err); }
    };
    syncData();
  }, [isOnline, user]);

  /* ─── UI helpers ─── */
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2200);
  };

  const closeModal = () => {
    setModal(null);
    setFormJumlah(""); setFormKategori(""); setFormCatatan(""); setFormMetode("cash");
    setFormUangAwal(""); setHapusIdx(null);
    setEditIdx(null); setFormEditJumlah(""); setFormEditMetode("cash");
    setFormEditKategori(""); setFormEditCatatan("");
  };

  const handleFormJumlahChange    = (val) => setFormJumlah(formatAngka(val ?? ""));
  const handleFormEditJumlahChange = (val) => setFormEditJumlah(formatAngka(val ?? ""));
  const handleFormUangAwalChange  = (val) => setFormUangAwal(formatAngka(val ?? ""));
  const handleSetupUangAwalChange = (val) => setSetupUangAwal(formatAngka(val ?? ""));

  const todayData = data[today] || { uang_awal: 0, transaksi: [] };

  /* ─── Actions ─── */
  const doSetup = async () => {
    if (isSubmitting) return;
    const n = parseInt(cleanNumber(setupUangAwal));
    if (isNaN(n) || n < 0) return showToast("Masukkan angka yang valid!", "error");
    setIsSubmitting(true);
    try {
      setData(d => ({ ...d, [today]: { uang_awal: n, transaksi: [] } }));
      await saveUangAwalLocal(today, n);
      if (isOnline) { try { await saveHarian(today, n); } catch { /* offline */ } }
      else { await addToSyncQueue('uang_awal', { tanggal: today, uang_awal: n }); }
      closeModal();
      setSetupUangAwal("");
      showToast("Hari baru berhasil dibuat!");
    } catch { showToast("Gagal setup, coba lagi!", "error"); }
    finally { setIsSubmitting(false); }
  };

  const doMasuk = async () => {
    if (isSubmitting) return;
    const n = parseInt(cleanNumber(formJumlah));
    if (isNaN(n) || n <= 0) return showToast("Jumlah harus lebih dari 0!", "error");
    if (!data[today]) return showToast("Setup uang awal dulu!", "error");
    setIsSubmitting(true);
    try {
      setData(prev => {
        const d = { ...prev };
        if (!d[today].transaksi) d[today].transaksi = [];
        d[today].transaksi.push({ type: "masuk", jumlah: n, metode: formMetode });
        return d;
      });
      await saveTransaksiLocal(today, [...(data[today]?.transaksi ?? []), { type: "masuk", jumlah: n, metode: formMetode }]);
      if (isOnline) { try { await saveTransaksi(today, [...(data[today]?.transaksi ?? []), { type: "masuk", jumlah: n, metode: formMetode }]); } catch { /* offline */ } }
      else { await addToSyncQueue('transaksi', { tanggal: today, transaksi: [...(data[today]?.transaksi ?? []), { type: "masuk", jumlah: n, metode: formMetode }] }); }
      closeModal();
      showToast("Pemasukan ditambahkan!");
    } catch { showToast("Gagal menyimpan!", "error"); }
    finally { setIsSubmitting(false); }
  };

  const doKeluar = async () => {
    if (isSubmitting) return;
    const n = parseInt(cleanNumber(formJumlah));
    if (isNaN(n) || n <= 0) return showToast("Jumlah harus lebih dari 0!", "error");
    if (!data[today]) return showToast("Setup uang awal dulu!", "error");
    setIsSubmitting(true);
    try {
      const newTx = { type: "keluar", jumlah: n, kategori: formKategori || "Lainnya", catatan: formCatatan || "-" };
      setData(prev => {
        const d = { ...prev };
        if (!d[today].transaksi) d[today].transaksi = [];
        d[today].transaksi.push(newTx);
        return d;
      });
      await saveTransaksiLocal(today, [...(data[today]?.transaksi ?? []), newTx]);
      if (isOnline) { try { await saveTransaksi(today, [...(data[today]?.transaksi ?? []), newTx]); } catch { /* offline */ } }
      else { await addToSyncQueue('transaksi', { tanggal: today, transaksi: [...(data[today]?.transaksi ?? []), newTx] }); }
      closeModal();
      showToast("Pengeluaran ditambahkan!");
    } catch { showToast("Gagal menyimpan!", "error"); }
    finally { setIsSubmitting(false); }
  };

  const doHapus = async () => {
    if (isSubmitting || hapusIdx === null) return;
    setIsSubmitting(true);
    try {
      const d = { ...data };
      if (!d[today]?.transaksi) return closeModal();
      d[today].transaksi.splice(hapusIdx, 1);
      setData({ ...d });
      await saveTransaksiLocal(today, d[today].transaksi);
      if (isOnline) { try { await saveTransaksi(today, d[today].transaksi); } catch { /* offline */ } }
      else { await addToSyncQueue('transaksi', { tanggal: today, transaksi: d[today].transaksi }); }
      closeModal();
      showToast("Transaksi dihapus!", "info");
    } catch { showToast("Gagal menghapus!", "error"); }
    finally { setIsSubmitting(false); }
  };

  const doUbahAwal = async () => {
    if (isSubmitting) return;
    const n = parseInt(cleanNumber(formUangAwal));
    if (isNaN(n) || n < 0) return showToast("Angka tidak valid!", "error");
    setIsSubmitting(true);
    try {
      const d = { ...data };
      if (!d[ubahTarget]) d[ubahTarget] = { uang_awal: 0, transaksi: [] };
      d[ubahTarget].uang_awal = n;
      setData({ ...d });
      await saveUangAwalLocal(ubahTarget, n);
      if (isOnline) { try { await saveHarian(ubahTarget, n); } catch { /* offline */ } }
      else { await addToSyncQueue('uang_awal', { tanggal: ubahTarget, uang_awal: n }); }
      closeModal();
      showToast("Uang awal diperbarui!");
    } catch { showToast("Gagal mengubah uang awal!", "error"); }
    finally { setIsSubmitting(false); }
  };

  const doEdit = async () => {
    if (isSubmitting || editIdx === null) return;
    const n = parseInt(cleanNumber(formEditJumlah));
    if (isNaN(n) || n <= 0) return showToast("Jumlah harus lebih dari 0!", "error");
    setIsSubmitting(true);
    try {
      const d = { ...data };
      const t = d[today]?.transaksi?.[editIdx];
      if (!t) return closeModal();
      d[today].transaksi[editIdx] = {
        ...t, jumlah: n,
        ...(t.type === "masuk" ? { metode: formEditMetode } : { kategori: formEditKategori || "Lainnya", catatan: formEditCatatan || "-" }),
      };
      setData({ ...d });
      await saveTransaksiLocal(today, d[today].transaksi);
      if (isOnline) { try { await saveTransaksi(today, d[today].transaksi); } catch { /* offline */ } }
      else { await addToSyncQueue('transaksi', { tanggal: today, transaksi: d[today].transaksi }); }
      closeModal();
      showToast("Transaksi diperbarui!");
    } catch { showToast("Gagal memperbarui!", "error"); }
    finally { setIsSubmitting(false); }
  };

  /* ─── Computed ─── */
  const todayCalc = safeCalc(todayData);
  const dates = Object.keys(data).sort((a, b) => b.localeCompare(a));
  const calc = useCallback((tanggal) => safeCalc(data[tanggal]), [data]);

  /* ─── Loading screen ─── */
  if (authLoading) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <div style={{ width: 52, height: 52, borderRadius: 16, background: "var(--gradient)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#fff", fontWeight: 800, fontSize: 24, fontFamily: "'Inter', sans-serif" }}>K</span>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", animation: `bounce 1s ease-in-out ${i * 0.2}s infinite` }}/>
        ))}
      </div>
      <p style={{ color: "var(--text-muted)", fontSize: 13, fontFamily: "'Inter', sans-serif" }}>Memuat Kasapp...</p>
      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0);opacity:.4} 50%{transform:translateY(-8px);opacity:1} }`}</style>
    </div>
  );

  /* ─── Login screen ─── */
  if (!user) return (
    <LoginScreen onLogin={async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
          const fb = user.user_metadata?.username || user.email?.split('@')?.[0] || 'user';
          try {
            const { data: existingProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (!existingProfile) await supabase.from('profiles').insert({ id: user.id, username: fb, email: user.email });
            else if (!existingProfile.username) await supabase.from('profiles').update({ username: fb }).eq('id', user.id);
          } catch { /* skip */ }
          try { setProfile(await loadProfile()); } catch { setProfile(null); }
          try {
            const d = await loadData();
            setData(d || {});
            if (!(d || {})[getCurrentDate()]) setModal("setup");
          } catch { setData({}); setModal("setup"); }
        }
      } catch (err) { showToast("Login gagal: " + (err.message || "Unknown"), "error"); }
    }} />
  );

  /* ─── Main app ─── */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
        body { margin: 0; background: var(--bg); }
        input::placeholder { color: var(--text-muted); }
        ::-webkit-scrollbar { width: 0; }
      `}</style>

      <div style={{ maxWidth: 440, margin: "0 auto", background: "var(--bg)", minHeight: "100vh", fontFamily: "'Inter', sans-serif", position: "relative" }}>
        {toast && <Toast msg={toast.msg} type={toast.type} />}
        {!isOnline && (
          <div style={{
            position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
            width: "100%", maxWidth: 440, background: "var(--warning)", zIndex: 3000,
            padding: "8px 16px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#fff",
          }}>
            Tidak ada koneksi internet
          </div>
        )}

        {/* ─── Screens ─── */}
        {tab === "home" && (
          <HomeScreen data={data} today={today} todayCalc={todayCalc} setModal={setModal} setTab={setTab} profile={profile} user={user} />
        )}
        {tab === "laporan" && (
          <LaporanScreen
            data={data} today={today} dates={dates} calc={calc}
            selectedDate={selectedDate} setSelectedDate={setSelectedDate}
            modalOpen={modal} setModal={setModal} closeModal={closeModal}
          />
        )}
        {tab === "pengaturan" && (
          <PengaturanScreen
            data={data} today={today} dates={dates}
            setUbahTarget={setUbahTarget} setFormUangAwal={setFormUangAwal} setModal={setModal}
            profile={profile} setProfile={setProfile} user={user}
            onLogout={async () => { try { await supabase.auth.signOut(); } catch{} setUser(null); setData({}); setProfile(null); setTab("home"); }}
          />
        )}

        {/* ─── Bottom nav ─── */}
        <div style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 440, background: "var(--navbar)", backdropFilter: "blur(20px)",
          borderTop: "1px solid var(--navbar-border)", display: "flex", zIndex: 100,
        }}>
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, background: "none", border: "none", cursor: "pointer",
              padding: "10px 0 14px", display: "flex", flexDirection: "column",
              alignItems: "center", gap: 3,
              color: tab === t.key ? "var(--accent)" : "var(--tab-inactive)",
              transition: "all 0.15s",
            }}>
              <Icon name={t.icon} size={20} color={tab === t.key ? "var(--accent)" : "var(--tab-inactive)"} />
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.2 }}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ─── FAB buttons ─── */}
        {tab === "home" && (
          <div style={{
            position: "fixed", bottom: 84, right: "calc(50% - 170px)",
            display: "flex", flexDirection: "column", gap: 10, zIndex: 99,
          }}>
            <button onClick={() => setModal("keluar")} style={{
              width: 50, height: 50, borderRadius: 16, background: "var(--danger)",
              border: "none", cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
            }}>
              <Icon name="minus" size={22} color="#fff" />
            </button>
            <button onClick={() => setModal("masuk")} style={{
              width: 50, height: 50, borderRadius: 16, background: "var(--gradient)",
              border: "none", cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", boxShadow: "0 4px 12px rgba(107, 126, 255, 0.3)",
            }}>
              <Icon name="plus" size={22} color="#fff" />
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════ */
        /*  MODALS                                  */
        /* ═══════════════════════════════════════ */}

        {/* Setup uang awal */}
        <Modal show={modal === "setup"} onClose={closeModal} title={`Hari Baru — ${today}`}>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>Masukkan uang awal (cash) untuk memulai hari ini.</p>
          <Field label="Uang Awal (Cash)" value={setupUangAwal} onChange={handleSetupUangAwalChange} type="number" placeholder="0" prefix="Rp" onKeyDown={(e) => e.key === 'Enter' && doSetup()} />
          <div style={{ marginTop: 16 }}>
            <Btn onClick={doSetup} icon="check" disabled={isSubmitting} fullWidth>Mulai Hari Ini</Btn>
          </div>
        </Modal>

        {/* Tambah pemasukan */}
        <Modal show={modal === "masuk"} onClose={closeModal} title="Tambah Pemasukan">
          <Field label="Jumlah" value={formJumlah} onChange={handleFormJumlahChange} type="number" placeholder="0" prefix="Rp" onKeyDown={(e) => { if (e.key === "Enter" && !isSubmitting) doMasuk(); }} />
          <label style={{ color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 8 }}>Metode</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {["cash", "qris"].map((m) => (
              <button key={m} onClick={() => setFormMetode(m)} style={{
                padding: "12px", borderRadius: 12,
                border: `2px solid ${formMetode === m ? "var(--accent)" : "var(--border)"}`,
                background: formMetode === m ? "var(--accent-subtle)" : "var(--surface)",
                color: formMetode === m ? "var(--accent)" : "var(--text-secondary)",
                fontWeight: 700, fontSize: 14, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                fontFamily: "'Inter', sans-serif",
              }}>
                <Icon name={m === "cash" ? "cash" : "qris"} size={16} color={formMetode === m ? "var(--accent)" : "var(--text-secondary)"} />
                {m.toUpperCase()}
              </button>
            ))}
          </div>
          <Btn onClick={doMasuk} variant="success" icon="plus" disabled={isSubmitting} fullWidth>Tambah Pemasukan</Btn>
        </Modal>

        {/* Tambah pengeluaran */}
        <Modal show={modal === "keluar"} onClose={closeModal} title="Tambah Pengeluaran">
          <Field label="Jumlah (dari Cash)" value={formJumlah} onChange={handleFormJumlahChange} type="number" placeholder="0" prefix="Rp" onKeyDown={(e) => { if (e.key === "Enter" && !isSubmitting) doKeluar(); }} />
          <Field label="Kategori" value={formKategori} onChange={setFormKategori} placeholder="Belanja, Gaji, dll." onKeyDown={(e) => { if (e.key === "Enter" && !isSubmitting) doKeluar(); }} />
          <Field label="Catatan" value={formCatatan} onChange={setFormCatatan} placeholder="Opsional" onKeyDown={(e) => { if (e.key === "Enter" && !isSubmitting) doKeluar(); }} />
          <Btn onClick={doKeluar} variant="danger" icon="minus" disabled={isSubmitting} fullWidth>Tambah Pengeluaran</Btn>
        </Modal>

        {/* Hapus transaksi */}
        <Modal show={modal === "hapus"} onClose={closeModal} title="Hapus Transaksi">
          {(todayData.transaksi?.length ?? 0) === 0 ? (
            <p style={{ color: "var(--text-muted)", textAlign: "center", margin: "16px 0" }}>Tidak ada transaksi</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {todayData.transaksi.map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
                      borderBottom: i < todayData.transaksi.length - 1 ? "1px solid var(--border)" : "none",
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 10,
                        background: t.type === "masuk" ? "var(--success-subtle)" : "var(--danger-subtle)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Icon name={t.type === "masuk" ? "arrowDown" : "arrowUp"} size={14} color={t.type === "masuk" ? "var(--success)" : "var(--danger)"} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                          {t.type === "masuk" ? "Pemasukan" : (t.kategori || "Pengeluaran")}
                        </p>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: t.type === "masuk" ? "var(--success)" : "var(--danger)" }}>
                        {formatAngka(String(t.jumlah))}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => { setHapusIdx(i); setModal("konfirmHapus"); }} style={{
                    background: "var(--danger-subtle)", border: "none", borderRadius: 8,
                    padding: "8px 10px", cursor: "pointer", color: "var(--danger)",
                  }}>
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Modal>

        {/* Konfirmasi hapus */}
        <Modal show={modal === "konfirmHapus"} onClose={closeModal} title="Konfirmasi Hapus">
          {hapusIdx !== null && todayData.transaksi?.[hapusIdx] && (
            <div>
              <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: "0 0 16px" }}>
                Yakin ingin menghapus transaksi ini?
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Btn onClick={closeModal} variant="ghost">Batal</Btn>
                <Btn onClick={doHapus} variant="danger" icon="trash" disabled={isSubmitting}>Hapus</Btn>
              </div>
            </div>
          )}
        </Modal>

        {/* Edit transaksi */}
        <Modal show={modal === "editTransaksi"} onClose={closeModal} title="Edit Transaksi">
          {editIdx !== null && todayData.transaksi?.[editIdx] && (() => {
            const t = todayData.transaksi[editIdx];
            return (
              <div>
                <Field label="Jumlah" value={formEditJumlah} onChange={handleFormEditJumlahChange} type="number" placeholder="0" prefix="Rp"
                  onKeyDown={(e) => { if (e.key === "Enter" && !isSubmitting) doEdit(); }} />
                {t.type === "masuk" ? (
                  <>
                    <label style={{ color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 8 }}>Metode</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                      {["cash", "qris"].map((m) => (
                        <button key={m} onClick={() => setFormEditMetode(m)} style={{
                          padding: "12px", borderRadius: 12,
                          border: `2px solid ${formEditMetode === m ? "var(--accent)" : "var(--border)"}`,
                          background: formEditMetode === m ? "var(--accent-subtle)" : "var(--surface)",
                          color: formEditMetode === m ? "var(--accent)" : "var(--text-secondary)",
                          fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Inter', sans-serif",
                        }}>
                          {m.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <Field label="Kategori" value={formEditKategori} onChange={setFormEditKategori} placeholder="Belanja, Gaji, dll."
                      onKeyDown={(e) => { if (e.key === "Enter" && !isSubmitting) doEdit(); }} />
                    <Field label="Catatan" value={formEditCatatan} onChange={setFormEditCatatan} placeholder="Opsional"
                      onKeyDown={(e) => { if (e.key === "Enter" && !isSubmitting) doEdit(); }} />
                  </>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Btn onClick={closeModal} variant="ghost">Batal</Btn>
                  <Btn onClick={doEdit} icon="check" disabled={isSubmitting}>Simpan</Btn>
                </div>
              </div>
            );
          })()}
        </Modal>

        {/* Ubah uang awal */}
        <Modal show={modal === "ubahAwal"} onClose={closeModal} title={`Ubah Uang Awal — ${ubahTarget}`}>
          {ubahTarget && (
            <>
              <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: "0 0 12px" }}>
                Saat ini: <strong style={{ color: "var(--text)" }}>{`Rp ${Number(data[ubahTarget]?.uang_awal ?? 0).toLocaleString("id-ID")}`}</strong>
              </p>
              <Field label="Uang Awal Baru" value={formUangAwal} onChange={handleFormUangAwalChange} type="number" placeholder="0" prefix="Rp" onKeyDown={(e) => { if (e.key === "Enter" && !isSubmitting) doUbahAwal(); }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Btn onClick={closeModal} variant="ghost">Batal</Btn>
                <Btn onClick={doUbahAwal} icon="check" disabled={isSubmitting}>Simpan</Btn>
              </div>
            </>
          )}
        </Modal>
      </div>
    </>
  );
}
