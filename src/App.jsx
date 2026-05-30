import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./utils/supabase";
import { useRealtime } from './hooks/useRealtime';
import LoginScreen from "./screens/Login";

import Modal        from "./components/Modal";
import Btn          from "./components/Button";
import Field        from "./components/Field";
import Icon         from "./components/Icon";
import Toast        from "./components/Toast";
import TransaksiRow from "./components/TransaksiRow";

import HomeScreen       from "./screens/Home";
import TransaksiScreen  from "./screens/Transaksi";
import LaporanScreen    from "./screens/Laporan";
import GrafikScreen     from "./screens/Grafik";
import PengaturanScreen from "./screens/Pengaturan";

import { loadData, saveHarian, saveTransaksi, getCurrentDate, loadProfile } from "./utils/storage";
import { calcHarian } from "./utils/calc";
import { formatAngka } from "./utils/format";
import { saveTransaksiLocal, getTransaksiLocal, saveUangAwalLocal, getUangAwalLocal, addToSyncQueue, getSyncQueue, clearSyncQueue } from "./db/index";

/* ─── Helpers ─── */
const cleanNumber = (str) => String(str ?? "").replace(/\./g, "");

// Safe calc — tidak pernah throw
const safeCalc = (dayData) => {
  if (!dayData) return { uang_awal: 0, totalCash: 0, totalQris: 0, totalMasuk: 0, gaji: 0, nonGaji: 0, totalKeluar: 0, saldoCash: 0, saldoTotal: 0, saldoTanpaGaji: 0, transaksi: [], kategoriMap: {} };
  return calcHarian(dayData);
};

const TABS = [
  { key: "home",       icon: "home",  label: "Beranda"    },
  { key: "riwayat",    icon: "list",  label: "Transaksi"  },
  { key: "laporan",    icon: "wallet",label: "Laporan"    },
  { key: "grafik",     icon: "chart", label: "Grafik"     },
  { key: "pengaturan", icon: "edit",  label: "Pengaturan" },
];

export default function App() {
  const [data,  setData]       = useState({});
  const [tab,   setTab]        = useState("home");
  const [user,  setUser]       = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [profile, setProfile]  = useState(null);
  const [today, setToday]      = useState(getCurrentDate);
  const [toast, setToast]      = useState(null);
  const [modal, setModal]      = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  // Form states
  const [formJumlah,      setFormJumlah]      = useState("");
  const [formMetode,      setFormMetode]      = useState("cash");
  const [formKategori,    setFormKategori]    = useState("");
  const [formCatatan,     setFormCatatan]     = useState("");
  const [formUangAwal,    setFormUangAwal]    = useState("");
  const [hapusIdx,        setHapusIdx]        = useState(null);
  const [setupUangAwal,   setSetupUangAwal]   = useState("");
  const [ubahTarget,      setUbahTarget]      = useState(null);
  const [konfirmasiReset, setKonfirmasiReset] = useState("");
  const [isSubmitting,    setIsSubmitting]    = useState(false);
  const [editIdx,         setEditIdx]         = useState(null);
  const [formEditJumlah,  setFormEditJumlah]  = useState("");
  const [formEditMetode,  setFormEditMetode]  = useState("cash");
  const [formEditKategori,setFormEditKategori]= useState("");
  const [formEditCatatan, setFormEditCatatan] = useState("");

  const authTimedOut = useRef(false);

  // Realtime — hanya aktif kalau user ada
  const { data: realtimeTransaksi } = useRealtime('transaksi', user?.id ?? null);

  // Merge realtime data ke local state
  useEffect(() => {
    if (!user || !realtimeTransaksi?.length) return;

    setData(prev => {
      const updated = { ...prev };
      const perTanggal = {};
      realtimeTransaksi.forEach(t => {
        if (!perTanggal[t.tanggal]) perTanggal[t.tanggal] = [];
        perTanggal[t.tanggal].push({
          type: t.type, jumlah: t.jumlah, metode: t.metode,
          kategori: t.kategori, catatan: t.catatan,
        });
      });
      Object.keys(perTanggal).forEach(tanggal => {
        if (updated[tanggal] && updated[tanggal].transaksi?.length > 0) {
          updated[tanggal] = { ...updated[tanggal], transaksi: perTanggal[tanggal] };
        }
      });
      return updated;
    });
  }, [realtimeTransaksi, user]);

  /* ─── Auth init dengan timeout 3 detik ─── */
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const timeout = setTimeout(() => {
        if (!cancelled) {
          authTimedOut.current = true;
          console.warn("[Auth] Timeout — fallback offline mode");
          setUser(null);
          setAuthLoading(false);
        }
      }, 3000);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;
        clearTimeout(timeout);
        setUser(user ?? null);
        setAuthLoading(false);

        if (user) {
          const fb = user.user_metadata?.username || user.email?.split('@')?.[0] || 'user';
          try {
            const { data: existingProfile } = await supabase
              .from('profiles').select('*').eq('id', user.id).single();
            if (!existingProfile) {
              await supabase.from('profiles').insert({
                id: user.id,
                username: fb,
                email: user.email
              });
            } else if (!existingProfile.username) {
              await supabase.from('profiles').update({ username: fb }).eq('id', user.id);
            }
          } catch { /* skip */ }

          try {
            const p = await loadProfile();
            setProfile(p);
          } catch { setProfile(null); }

          try {
            const d = await loadData();
            setData(d || {});
            const td = getCurrentDate();
            if (!(d || {})[td]) setModal("setup");
          } catch (err) {
            console.error("[loadData] Error:", err);
            setData({});
            setModal("setup");
          }
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
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /* ─── Date ticker ─── */
  useEffect(() => {
    const interval = setInterval(() => {
      const newDate = getCurrentDate();
      if (newDate !== today) {
        setToday(newDate);
        // Cek apakah data hari ini sudah ada
        setData(prev => {
          if (!prev[newDate]) {
            // Tidak auto-set modal — biarkan user yang memulai
          }
          return prev;
        });
      }
    }, 60000); // setiap 1 menit
    return () => clearInterval(interval);
  }, [today]);

  /* ─── Sync queue saat online ─── */
  useEffect(() => {
    if (!isOnline || !user) return;

    const syncData = async () => {
      try {
        const queue = await getSyncQueue();
        if (!queue?.length) return;

        let synced = false;
        for (const item of queue) {
          try {
            if (item.action === 'transaksi') {
              await saveTransaksi(item.data.tanggal, item.data.transaksi);
              synced = true;
            } else if (item.action === 'uang_awal') {
              await saveHarian(item.data.tanggal, item.data.uang_awal);
              synced = true;
            }
          } catch { /* skip failed item */ }
        }
        if (synced) {
          await clearSyncQueue();
          showToast("Data tersinkron!", "success");
        }
      } catch (err) {
        console.error("[Sync] Gagal:", err);
      }
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
    setFormUangAwal(""); setHapusIdx(null); setKonfirmasiReset("");
    setEditIdx(null); setFormEditJumlah(""); setFormEditMetode("cash");
    setFormEditKategori(""); setFormEditCatatan("");
  };

  const handleFormJumlahChange    = (val) => setFormJumlah(formatAngka(val ?? ""));
  const handleFormEditJumlahChange = (val) => setFormEditJumlah(formatAngka(val ?? ""));
  const handleFormUangAwalChange  = (val) => setFormUangAwal(formatAngka(val ?? ""));
  const handleSetupUangAwalChange = (val) => setSetupUangAwal(formatAngka(val ?? ""));

  /* ─── Pastikan todayData selalu aman ─── */
  const todayData = data[today] || { uang_awal: 0, transaksi: [] };

  /* ─── Actions ─── */
  const doSetup = async () => {
    if (isSubmitting) return;
    const n = parseInt(cleanNumber(setupUangAwal));
    if (isNaN(n) || n < 0) return showToast("Masukkan angka yang valid!", "error");
    setIsSubmitting(true);
    try {
      const d = { ...data, [today]: { uang_awal: n, transaksi: [] } };
      setData(d);
      await saveUangAwalLocal(today, n);
      if (isOnline) {
        try { await saveHarian(today, n); } catch { /* offline */ }
      } else {
        await addToSyncQueue('uang_awal', { tanggal: today, uang_awal: n });
        showToast("Tersimpan offline — akan sync saat online", "info");
      }
      closeModal();
      setSetupUangAwal("");
      showToast("Hari baru berhasil dibuat!");
    } catch {
      showToast("Gagal setup, coba lagi!", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const doMasuk = async () => {
    if (isSubmitting) return;
    const n = parseInt(cleanNumber(formJumlah));
    if (isNaN(n) || n <= 0) return showToast("Jumlah harus lebih dari 0!", "error");
    if (!data[today]) return showToast("Setup uang awal dulu!", "error");
    setIsSubmitting(true);
    try {
      const d = { ...data };
      if (!d[today].transaksi) d[today].transaksi = [];
      d[today].transaksi.push({ type: "masuk", jumlah: n, metode: formMetode });
      setData({ ...d });
      await saveTransaksiLocal(today, d[today].transaksi);
      if (isOnline) {
        try { await saveTransaksi(today, d[today].transaksi); } catch { /* offline */ }
      } else {
        await addToSyncQueue('transaksi', { tanggal: today, transaksi: d[today].transaksi });
        showToast("Tersimpan offline", "info");
      }
      closeModal();
      showToast("Pemasukan ditambahkan!");
    } catch {
      showToast("Gagal menyimpan!", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const doKeluar = async () => {
    if (isSubmitting) return;
    const n = parseInt(cleanNumber(formJumlah));
    if (isNaN(n) || n <= 0) return showToast("Jumlah harus lebih dari 0!", "error");
    if (!data[today]) return showToast("Setup uang awal dulu!", "error");
    setIsSubmitting(true);
    try {
      const d = { ...data };
      if (!d[today].transaksi) d[today].transaksi = [];
      d[today].transaksi.push({ type: "keluar", jumlah: n, kategori: formKategori || "Lainnya", catatan: formCatatan || "-" });
      setData({ ...d });
      await saveTransaksiLocal(today, d[today].transaksi);
      if (isOnline) {
        try { await saveTransaksi(today, d[today].transaksi); } catch { /* offline */ }
      } else {
        await addToSyncQueue('transaksi', { tanggal: today, transaksi: d[today].transaksi });
        showToast("Tersimpan offline", "info");
      }
      closeModal();
      showToast("Pengeluaran ditambahkan!");
    } catch {
      showToast("Gagal menyimpan!", "error");
    } finally {
      setIsSubmitting(false);
    }
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
      if (isOnline) {
        try { await saveTransaksi(today, d[today].transaksi); } catch { /* offline */ }
      } else {
        await addToSyncQueue('transaksi', { tanggal: today, transaksi: d[today].transaksi });
        showToast("Tersimpan offline", "info");
      }
      closeModal();
      showToast("Transaksi dihapus!", "info");
    } catch {
      showToast("Gagal menghapus!", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const doReset = async () => {
    if (isSubmitting) return;
    if (konfirmasiReset.toLowerCase() !== "ya") return showToast("Ketik 'ya' untuk konfirmasi!", "error");
    setIsSubmitting(true);
    try {
      const d = { ...data };
      if (d[today]) d[today].transaksi = [];
      setData({ ...d });
      await saveTransaksiLocal(today, []);
      if (isOnline) {
        try { await saveTransaksi(today, []); } catch { /* offline */ }
      } else {
        await addToSyncQueue('transaksi', { tanggal: today, transaksi: [] });
        showToast("Direset offline", "info");
      }
      closeModal();
      showToast("Semua transaksi direset!", "info");
    } catch {
      showToast("Gagal mereset!", "error");
    } finally {
      setIsSubmitting(false);
    }
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
      if (isOnline) {
        try { await saveHarian(ubahTarget, n); } catch { /* offline */ }
      } else {
        await addToSyncQueue('uang_awal', { tanggal: ubahTarget, uang_awal: n });
        showToast("Tersimpan offline", "info");
      }
      closeModal();
      showToast("Uang awal diperbarui!");
    } catch {
      showToast("Gagal mengubah uang awal!", "error");
    } finally {
      setIsSubmitting(false);
    }
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
      if (isOnline) {
        try { await saveTransaksi(today, d[today].transaksi); } catch { /* offline */ }
      } else {
        await addToSyncQueue('transaksi', { tanggal: today, transaksi: d[today].transaksi });
        showToast("Tersimpan offline", "info");
      }
      closeModal();
      showToast("Transaksi diperbarui!");
    } catch {
      showToast("Gagal memperbarui!", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const doResetAkun = async () => {
    if (isSubmitting) return;
    if (konfirmasiReset.toLowerCase() !== "reset") return showToast("Ketik 'reset' untuk konfirmasi!", "error");
    setIsSubmitting(true);
    try {
      if (isOnline && user) {
        try {
          await supabase.from('transaksi').delete().eq('user_id', user.id);
          await supabase.from('uang_awal').delete().eq('user_id', user.id);
        } catch { /* skip */ }
      }
      try {
        const db = await (await import('./db/index.js')).openDB();
        db.transaction('transaksi', 'readwrite').objectStore('transaksi').clear();
        db.transaction('uang_awal', 'readwrite').objectStore('uang_awal').clear();
      } catch { /* skip */ }
      setData({});
      closeModal();
      showToast("Akun berhasil direset!", "info");
      setModal("setup");
    } catch {
      showToast("Gagal mereset akun!", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ─── Computed ─── */
  const todayCalc = safeCalc(todayData);
  const dates = Object.keys(data).sort((a, b) => b.localeCompare(a));
  const calc = useCallback((tanggal) => safeCalc(data[tanggal]), [data]);

  /* ─── Loading screen ─── */
  if (authLoading) return (
    <div style={{ minHeight: "100vh", background: "#0D0D1A", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#7C3AED,#4F46E5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#fff", fontWeight: 800, fontSize: 22, fontFamily: "'Sora',sans-serif" }}>K</span>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#7C3AED", animation: `bounce 1s ease-in-out ${i * 0.2}s infinite` }}/>
        ))}
      </div>
      <p style={{ color: "#6b6b88", fontSize: 13, fontFamily: "'Sora',sans-serif" }}>Memuat Kasapp...</p>
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
            if (!existingProfile) {
              await supabase.from('profiles').insert({
                id: user.id,
                username: fb,
                email: user.email
              });
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
        showToast("Login gagal: " + (err.message || "Unknown"), "error");
      }
    }} />
  );

  /* ─── Main app ─── */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
        body { margin: 0; background: #0D0D1A; }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
        input::placeholder { color: #444466; }
        ::-webkit-scrollbar { width: 0; }
      `}</style>

      <div style={{ maxWidth: 440, margin: "0 auto", background: "#0D0D1A", minHeight: "100vh", fontFamily: "'Sora', sans-serif", position: "relative" }}>
        {toast && <Toast msg={toast.msg} type={toast.type} />}
        {!isOnline && (
          <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 440, background: "#B45309", zIndex: 3000, padding: "10px 16px", textAlign: "center", fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: "'Sora',sans-serif" }}>
            Tidak ada koneksi internet
          </div>
        )}

        {tab === "home" && (
          <HomeScreen data={data} today={today} todayCalc={todayCalc} setModal={setModal} setTab={setTab} profile={profile} user={user} />
        )}
        {tab === "riwayat" && (
          <TransaksiScreen
            data={data} today={today} setModal={setModal}
            setHapusIdx={setHapusIdx}
            setEditIdx={(idx) => {
              setEditIdx(idx);
              const t = data[today]?.transaksi?.[idx];
              if (t) {
                setFormEditJumlah(formatAngka(String(t.jumlah)));
                setFormEditMetode(t.metode || "cash");
                setFormEditKategori(t.kategori || "");
                setFormEditCatatan(t.catatan || "");
              }
            }}
          />
        )}
        {tab === "laporan" && (
          <LaporanScreen
            data={data} today={today} dates={dates} calc={calc}
            selectedDate={selectedDate} setSelectedDate={setSelectedDate}
            modalOpen={modal} setModal={setModal} closeModal={closeModal}
          />
        )}
        {tab === "grafik" && (
          <GrafikScreen data={data} today={today} />
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
        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 440, background: "rgba(13,13,26,0.95)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", zIndex: 100 }}>
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", padding: "12px 0 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, color: tab === t.key ? "#7C3AED" : "#444466", transition: "all 0.2s" }}>
              <Icon name={t.icon} size={20} color={tab === t.key ? "#7C3AED" : "#444466"} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.3 }}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ─── FAB buttons ─── */}
        {(tab === "home" || tab === "riwayat") && (
          <div style={{ position: "fixed", bottom: 80, right: "calc(50% - 180px)", display: "flex", flexDirection: "column", gap: 12, zIndex: 99 }}>
            <button onClick={() => setModal("keluar")} style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#DC2626,#B91C1C)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(220,38,38,0.4)", touchAction: "manipulation" }}>
              <Icon name="minus" size={24} color="#fff" />
            </button>
            <button onClick={() => setModal("masuk")} style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#059669,#047857)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(5,150,105,0.4)", touchAction: "manipulation" }}>
              <Icon name="plus" size={24} color="#fff" />
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════ */}
        {/*  MODALS — SEMUA SEJAJAR, TIDAK NESTED   */}
        {/* ═══════════════════════════════════════ */}

        {/* Setup uang awal */}
        <Modal show={modal === "setup"} onClose={closeModal} title={`Hari Baru — ${today}`}>
          <p style={{ color: "#8888aa", fontSize: 13, marginBottom: 16 }}>Masukkan uang awal (cash) untuk memulai hari ini.</p>
          <Field label="Uang Awal (Cash)" value={setupUangAwal} onChange={handleSetupUangAwalChange} type="number" placeholder="0" prefix="Rp" onKeyDown={(e) => e.key === 'Enter' && doSetup()} />
          <div style={{ marginTop: 16 }}>
            <Btn onClick={doSetup} icon="check" disabled={isSubmitting}>Mulai Hari Ini</Btn>
          </div>
        </Modal>

        {/* Tambah pemasukan */}
        <Modal show={modal === "masuk"} onClose={closeModal} title="Tambah Pemasukan">
          <Field label="Jumlah" value={formJumlah} onChange={handleFormJumlahChange} type="number" placeholder="0" prefix="Rp" onKeyDown={(e) => { if (e.key === "Enter" && !isSubmitting) doMasuk(); }} />
          <label style={{ color: "#8888aa", fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Metode</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {["cash", "qris"].map((m) => (
              <button key={m} onClick={() => setFormMetode(m)} style={{ padding: "12px", borderRadius: 12, border: `2px solid ${formMetode === m ? "#6366F1" : "rgba(255,255,255,0.1)"}`, background: formMetode === m ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)", color: formMetode === m ? "#6366F1" : "#aaa", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "'Sora',sans-serif" }}>
                <Icon name={m === "cash" ? "cash" : "qris"} size={16} color={formMetode === m ? "#6366F1" : "#aaa"} />
                {m.toUpperCase()}
              </button>
            ))}
          </div>
          <Btn onClick={doMasuk} variant="success" icon="plus" disabled={isSubmitting}>Tambah Pemasukan</Btn>
        </Modal>

        {/* Tambah pengeluaran */}
        <Modal show={modal === "keluar"} onClose={closeModal} title="Tambah Pengeluaran">
          <Field label="Jumlah (dari Cash)" value={formJumlah} onChange={handleFormJumlahChange} type="number" placeholder="0" prefix="Rp" onKeyDown={(e) => { if (e.key === "Enter" && !isSubmitting) doKeluar(); }} />
          <Field label="Kategori" value={formKategori} onChange={setFormKategori} placeholder="Belanja, Gaji, dll." onKeyDown={(e) => { if (e.key === "Enter" && !isSubmitting) doKeluar(); }} />
          <p style={{ color: "#F59E0B", fontSize: 12, margin: "-8px 0 10px", display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name="warning" size={12} color="#F59E0B" /> Ketik 'Gaji' pada kategori untuk pengeluaran gaji
          </p>
          <Field label="Catatan" value={formCatatan} onChange={setFormCatatan} placeholder="Opsional" onKeyDown={(e) => { if (e.key === "Enter" && !isSubmitting) doKeluar(); }} />
          <Btn onClick={doKeluar} variant="danger" icon="minus" disabled={isSubmitting}>Tambah Pengeluaran</Btn>
        </Modal>

        {/* Hapus transaksi */}
        <Modal show={modal === "hapus"} onClose={closeModal} title="Hapus Transaksi">
          {(todayData.transaksi?.length ?? 0) === 0 ? (
            <p style={{ color: "#555577", textAlign: "center", margin: "16px 0" }}>Tidak ada transaksi</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {todayData.transaksi.map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, animation: "fadeIn 0.2s ease-out" }}>
                  <div style={{ flex: 1 }}><TransaksiRow t={t} /></div>
                  <button onClick={() => { setHapusIdx(i); setModal("konfirmHapus"); }} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "8px 10px", cursor: "pointer", color: "#EF4444", flexShrink: 0 }}>
                    <Icon name="trash" size={16} />
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
              <TransaksiRow t={todayData.transaksi[hapusIdx]} />
              <p style={{ color: "#aaa", fontSize: 13, margin: "12px 0 16px" }}>Yakin ingin menghapus transaksi ini?</p>
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
                    <label style={{ color: "#8888aa", fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Metode</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                      {["cash", "qris"].map((m) => (
                        <button key={m} onClick={() => setFormEditMetode(m)}
                          style={{ padding: "12px", borderRadius: 12, border: `2px solid ${formEditMetode === m ? "#6366F1" : "rgba(255,255,255,0.1)"}`, background: formEditMetode === m ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)", color: formEditMetode === m ? "#6366F1" : "#aaa", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'Sora',sans-serif" }}>
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

        {/* Reset transaksi */}
        <Modal show={modal === "reset"} onClose={closeModal} title="Reset Transaksi">
          <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 12, padding: 12, marginBottom: 16 }}>
            <p style={{ color: "#F59E0B", margin: 0, fontSize: 13, display: "flex", gap: 6 }}>
              <Icon name="warning" size={16} color="#F59E0B" />
              Semua transaksi hari ini akan dihapus. Uang awal tidak akan berubah.
            </p>
          </div>
          <Field label="Ketik 'ya' untuk konfirmasi" value={konfirmasiReset} onChange={setKonfirmasiReset} placeholder="ya" onKeyDown={(e) => e.key === 'Enter' && doReset()} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Btn onClick={closeModal} variant="ghost">Batal</Btn>
            <Btn onClick={doReset} variant="warning" disabled={isSubmitting}>Reset</Btn>
          </div>
        </Modal>

        {/* Ubah uang awal */}
        <Modal show={modal === "ubahAwal"} onClose={closeModal} title={`Ubah Uang Awal — ${ubahTarget}`}>
          {ubahTarget && (
            <>
              <p style={{ color: "#aaa", fontSize: 13, margin: "0 0 12px" }}>
                Saat ini: <strong style={{ color: "#fff" }}>{`Rp ${Number(data[ubahTarget]?.uang_awal ?? 0).toLocaleString("id-ID")}`}</strong>
              </p>
              <Field label="Uang Awal Baru" value={formUangAwal} onChange={handleFormUangAwalChange} type="number" placeholder="0" prefix="Rp" onKeyDown={(e) => { if (e.key === "Enter" && !isSubmitting) doUbahAwal(); }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Btn onClick={closeModal} variant="ghost">Batal</Btn>
                <Btn onClick={doUbahAwal} icon="check" disabled={isSubmitting}>Simpan</Btn>
              </div>
            </>
          )}
        </Modal>

        {/* Reset akun — sekarang sejajar, BUKAN nested */}
        <Modal show={modal === "resetAkun"} onClose={closeModal} title="Reset Akun">
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: 12, marginBottom: 16 }}>
            <p style={{ color: "#EF4444", margin: 0, fontSize: 13, display: "flex", gap: 6 }}>
              <Icon name="warning" size={16} color="#EF4444" />
              Semua riwayat transaksi dan uang awal akan dihapus permanen!
            </p>
          </div>
          <Field label="Ketik 'reset' untuk konfirmasi" value={konfirmasiReset} onChange={setKonfirmasiReset} placeholder="reset" onKeyDown={(e) => e.key === 'Enter' && konfirmasiReset === 'reset' && doResetAkun()} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Btn onClick={closeModal} variant="ghost">Batal</Btn>
            <Btn onClick={() => { if (konfirmasiReset !== 'reset') return showToast("Ketik 'reset' untuk konfirmasi!", "error"); doResetAkun(); }} variant="danger" disabled={isSubmitting}>Reset Akun</Btn>
          </div>
        </Modal>
      </div>
    </>
  );
}
