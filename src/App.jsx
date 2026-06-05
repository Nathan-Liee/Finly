import { useState, useEffect, useCallback, Suspense, lazy } from "react";
import { supabase } from "./utils/supabase";
import LoginScreen from "./screens/Login";

import Modal  from "./components/Modal";
import Btn   from "./components/Button";
import Field from "./components/Field";
import Icon  from "./components/Icon";
import Toast from "./components/Toast";
import RecurringForm from "./components/RecurringForm";

const HomeScreen = lazy(() => import("./screens/Home"));
const LaporanScreen = lazy(() => import("./screens/Laporan"));
const PengaturanScreen = lazy(() => import("./screens/Pengaturan"));

import { loadData, saveHarian, saveTransaksi, getCurrentDate, loadProfile } from "./utils/storage";
import { calcHarian } from "./utils/calc";
import { formatAngka } from "./utils/format";
import { toggleTheme } from "./theme";
import { saveTransaksiLocal, saveUangAwalLocal, addToSyncQueue } from "./db/index";
import { version } from "../package.json";

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
  const [toasts, setToasts]    = useState([]);
  const [modal, setModal]      = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem("kasapp-theme") === "dark"; } catch { return false; }
  });

  const [installPrompt, setInstallPrompt] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

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
  const [resetStart,   setResetStart]   = useState("");
  const [resetEnd,     setResetEnd]     = useState("");
  const [resetUangAwal,setResetUangAwal]= useState(false);
  const [kategoriList, setKategoriList] = useState(() => {
    try {
      const stored = localStorage.getItem("finly-kategori");
      return stored ? JSON.parse(stored) : ["Makanan & Minuman", "Transportasi", "Belanja", "Hiburan", "Kesehatan", "Pendidikan", "Tagihan", "Lainnya"];
    } catch {
      return ["Makanan & Minuman", "Transportasi", "Belanja", "Hiburan", "Kesehatan", "Pendidikan", "Tagihan", "Lainnya"];
    }
  });

  /* ─── Budget bulanan ─── */
  const [budgetMap, setBudgetMap] = useState(() => {
    try {
      const stored = localStorage.getItem("finly-budget");
      const parsed = stored ? JSON.parse(stored) : {};
      // Backward compat: convert old number format to new object format
      Object.keys(parsed).forEach(k => {
        if (typeof parsed[k] === 'number') {
          parsed[k] = {};
        }
      });
      return parsed;
    } catch {
      return {};
    }
  });

  const updateBudget = useCallback((monthKey, kategori, amount) => {
    setBudgetMap(prev => {
      const next = { ...prev };
      const current = typeof prev[monthKey] === 'number' ? {} : (prev[monthKey] || {});
      if (!kategori) {
        // Set total budget (old behavior) — store under "_total" key
        if (amount > 0) current._total = amount;
        else { delete current._total; if (Object.keys(current).length === 0) delete next[monthKey]; }
      } else {
        // Per-kategori budget
        if (amount > 0) current[kategori] = { amount };
        else { delete current[kategori]; if (Object.keys(current).length === 0) delete next[monthKey]; }
      }
      if (Object.keys(current).length > 0) next[monthKey] = current;
      try { localStorage.setItem("finly-budget", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  /* ─── Recurring Transactions ─── */
  const [recurringRules, setRecurringRules] = useState(() => {
    try {
      const stored = localStorage.getItem("finly-recurring");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const addRecurringRule = useCallback((rule) => {
    setRecurringRules(prev => {
      const next = [...prev, { ...rule, id: "rec_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6) }];
      try { localStorage.setItem("finly-recurring", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const removeRecurringRule = useCallback((id) => {
    setRecurringRules(prev => {
      const next = prev.filter(r => r.id !== id);
      try { localStorage.setItem("finly-recurring", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  /* ─── Auto-apply recurring transactions ─── */
  useEffect(() => {
    if (!data || Object.keys(data).length === 0) return;
    const todayStr = getCurrentDate();
    if (!data[todayStr]) return; // need setup first
    const now = new Date();
    const todayDOW = now.getDay(); // 0=Sun
    const todayDOM = now.getDate();
    let added = 0;
    recurringRules.forEach(rule => {
      let shouldAdd = false;
      if (rule.frequency === 'daily') shouldAdd = true;
      else if (rule.frequency === 'weekly' && rule.dayOfWeek === todayDOW) shouldAdd = true;
      else if (rule.frequency === 'monthly' && rule.dayOfMonth === todayDOM) shouldAdd = true;
      if (!shouldAdd) return;
      // Check if already added today
      const existingTx = data[todayStr]?.transaksi ?? [];
      const alreadyAdded = existingTx.some(t => t._recurringId === rule.id);
      if (alreadyAdded) return;
      added++;
      // Add transaction
      const newTx = {
        type: rule.type,
        jumlah: rule.jumlah,
        metode: rule.metode || 'cash',
        kategori: rule.kategori || 'Lainnya',
        catatan: rule.catatan || (rule.frequency === 'daily' ? 'Harian' : rule.frequency === 'weekly' ? 'Mingguan' : 'Bulanan'),
        _recurringId: rule.id,
      };
      setData(prev => {
        const d = { ...prev };
        if (!d[todayStr]) d[todayStr] = { uang_awal: 0, transaksi: [] };
        d[todayStr].transaksi = [...(d[todayStr]?.transaksi ?? []), newTx];
        return d;
      });
    });
    if (added > 0) {
      showToast(`${added} transaksi berulang ditambahkan`, "info");
    }
  }, [data, recurringRules]);

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
        let syncedCount = 0;
        let failedCount = 0;
        for (const item of queue) {
          try {
            if (item.action === 'transaksi') { await saveTransaksi(item.data.tanggal, item.data.transaksi); syncedCount++; }
            else if (item.action === 'uang_awal') { await saveHarian(item.data.tanggal, item.data.uang_awal); syncedCount++; }
          } catch (err) {
            console.error(`[Sync] Gagal sync ${item.action}:`, err.message);
            failedCount++;
          }
        }
        // Only clear queue if ALL items succeeded
        if (syncedCount > 0 && failedCount === 0) {
          await clearSyncQueue();
          showToast(`${syncedCount} data tersinkron!`, "success");
        } else if (failedCount > 0) {
          showToast(`${syncedCount} sync berhasil, ${failedCount} gagal. Akan dicoba lagi.`, "warning");
        }
      } catch (err) { console.error("[Sync] Gagal:", err); }
    };
    syncData();
  }, [isOnline, user]);

  /* ─── Keyboard shortcuts ─── */
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setModal("masuk");
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /* ─── PWA install prompt ─── */
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  /* ─── UI helpers ─── */
  const showToast = (msg, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2200);
  };

  const closeModal = () => {
    setModal(null);
    setFormJumlah(""); setFormKategori(""); setFormCatatan(""); setFormMetode("cash");
    setFormUangAwal(""); setHapusIdx(null);
    setEditIdx(null); setFormEditJumlah(""); setFormEditMetode("cash");
    setFormEditKategori(""); setFormEditCatatan("");
    setResetStart(""); setResetEnd(""); setResetUangAwal(false);
    setImportPreview(null);
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
      // 1. React state — UI update langsung
      setData(d => ({ ...d, [today]: { uang_awal: n, transaksi: [] } }));
      // 2. IndexedDB — persistent local
      await saveUangAwalLocal(today, n);
      // 3. Supabase — cloud sync
      if (isOnline) {
        await saveHarian(today, n);
        closeModal();
        setSetupUangAwal("");
        showToast("Hari baru berhasil dibuat!");
      } else {
        await addToSyncQueue('uang_awal', { tanggal: today, uang_awal: n });
        closeModal();
        setSetupUangAwal("");
        showToast("Data tersimpan di perangkat. Akan sync saat online.", "info");
      }
    } catch (err) {
      console.error("[doSetup] Error:", err);
      showToast("Gagal menyimpan: " + (err.message || "Terjadi kesalahan"), "error");
    }
    finally { setIsSubmitting(false); }
  };

  const doMasuk = async () => {
    if (isSubmitting) return;
    const n = parseInt(cleanNumber(formJumlah));
    if (isNaN(n) || n <= 0) return showToast("Jumlah harus lebih dari 0!", "error");
    if (!data[today]) return showToast("Setup uang awal dulu!", "error");
    setIsSubmitting(true);
    try {
      // Compute new transaction array ONCE to avoid stale closure issues
      const prevTx = data[today]?.transaksi ?? [];
      const newTx = { type: "masuk", jumlah: n, metode: formMetode };
      const updatedTx = [...prevTx, newTx];

      setData(prev => {
        const d = { ...prev };
        if (!d[today]) d[today] = { uang_awal: 0, transaksi: [] };
        d[today].transaksi = updatedTx;
        return d;
      });
      await saveTransaksiLocal(today, updatedTx);
      if (isOnline) { try { await saveTransaksi(today, updatedTx); } catch { /* offline */ } }
      else { await addToSyncQueue('transaksi', { tanggal: today, transaksi: updatedTx }); }
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
      // Compute new transaction array ONCE to avoid stale closure issues
      const prevTx = data[today]?.transaksi ?? [];
      const newTx = { type: "keluar", jumlah: n, kategori: formKategori || "Lainnya", catatan: formCatatan || "-" };
      const updatedTx = [...prevTx, newTx];

      setData(prev => {
        const d = { ...prev };
        if (!d[today]) d[today] = { uang_awal: 0, transaksi: [] };
        d[today].transaksi = updatedTx;
        return d;
      });
      await saveTransaksiLocal(today, updatedTx);
      if (isOnline) { try { await saveTransaksi(today, updatedTx); } catch { /* offline */ } }
      else { await addToSyncQueue('transaksi', { tanggal: today, transaksi: updatedTx }); }
      closeModal();
      showToast("Pengeluaran ditambahkan!");
    } catch { showToast("Gagal menyimpan!", "error"); }
    finally { setIsSubmitting(false); }
  };

  const doHapus = async () => {
    if (isSubmitting || hapusIdx === null) return;
    setIsSubmitting(true);
    const tgl = selectedDate || today;
    try {
      const d = { ...data };
      if (!d[tgl]?.transaksi) return closeModal();
      const updatedTx = d[tgl].transaksi.filter((_, i) => i !== hapusIdx);
      d[tgl].transaksi = updatedTx;
      setData({ ...d });
      await saveTransaksiLocal(tgl, updatedTx);
      if (isOnline) { try { await saveTransaksi(tgl, updatedTx); } catch { /* offline */ } }
      else { await addToSyncQueue('transaksi', { tanggal: tgl, transaksi: updatedTx }); }
      closeModal();
      showToast("Transaksi dihapus!", "info");
    } catch { showToast("Gagal menghapus!", "error"); }
    finally { setIsSubmitting(false); }
  };

  const doUbahAwal = async (overrideValue, overrideTarget) => {
    if (isSubmitting) return;
    // Defensive guard: React click event may leak as first argument
    if (typeof overrideValue === 'object' && overrideValue !== null && overrideValue.nativeEvent) overrideValue = undefined;
    const targetTanggal = overrideTarget || ubahTarget;
    if (!targetTanggal) {
      showToast("Tanggal uang awal tidak valid", "error");
      return;
    }
    const n = overrideValue !== undefined ? overrideValue : parseInt(cleanNumber(formUangAwal));
    if (isNaN(n) || n < 0) return showToast("Angka tidak valid!", "error");
    setIsSubmitting(true);
    try {
      // 1. React state — UI update langsung
      const d = { ...data };
      if (!d[targetTanggal]) d[targetTanggal] = { uang_awal: 0, transaksi: [] };
      d[targetTanggal].uang_awal = n;
      setData({ ...d });
      // 2. IndexedDB — persistent local
      await saveUangAwalLocal(targetTanggal, n);
      // 3. Supabase — cloud sync
      if (isOnline) {
        await saveHarian(targetTanggal, n);
        closeModal();
        showToast(overrideValue !== undefined ? "Uang awal berhasil dihapus" : "Uang awal diperbarui!");
      } else {
        await addToSyncQueue('uang_awal', { tanggal: targetTanggal, uang_awal: n });
        closeModal();
        showToast("Data tersimpan di perangkat. Akan sync saat online.", "info");
      }
    } catch (err) {
      console.error("[doUbahAwal] Error:", err);
      showToast("Gagal menyimpan: " + (err.message || "Terjadi kesalahan"), "error");
    }
    finally { setIsSubmitting(false); }
  };

  const doEdit = async () => {
    if (isSubmitting || editIdx === null) return;
    const n = parseInt(cleanNumber(formEditJumlah));
    if (isNaN(n) || n <= 0) return showToast("Jumlah harus lebih dari 0!", "error");
    setIsSubmitting(true);
    const tgl = selectedDate || today;
    try {
      const d = { ...data };
      const t = d[tgl]?.transaksi?.[editIdx];
      if (!t) return closeModal();
      const updatedTx = d[tgl].transaksi.map((item, i) =>
        i === editIdx
          ? { ...item, jumlah: n, ...(t.type === "masuk" ? { metode: formEditMetode } : { kategori: formEditKategori || "Lainnya", catatan: formEditCatatan || "-" }) }
          : item
      );
      d[tgl].transaksi = updatedTx;
      setData({ ...d });
      await saveTransaksiLocal(tgl, updatedTx);
      if (isOnline) { try { await saveTransaksi(tgl, updatedTx); } catch { /* offline */ } }
      else { await addToSyncQueue('transaksi', { tanggal: tgl, transaksi: updatedTx }); }
      closeModal();
      showToast("Transaksi diperbarui!");
    } catch { showToast("Gagal memperbarui!", "error"); }
    finally { setIsSubmitting(false); }
  };

  const doResetRange = async () => {
    if (isSubmitting) return;
    if (!resetStart || !resetEnd) return showToast("Pilih tanggal awal & akhir!", "error");
    if (resetStart > resetEnd) return showToast("Tanggal akhir harus setelah tanggal awal!", "error");
    setIsSubmitting(true);
    try {
      const d = { ...data };
      const datesToReset = Object.keys(d).filter(tgl => tgl >= resetStart && tgl <= resetEnd);
      if (datesToReset.length === 0) { showToast("Tidak ada data di range tersebut", "info"); setIsSubmitting(false); return; }
      for (const tgl of datesToReset) {
        if (!d[tgl]) continue;
        d[tgl].transaksi = [];
        if (resetUangAwal) d[tgl].uang_awal = 0;
      }
      setData({ ...d });
      for (const tgl of datesToReset) {
        await saveTransaksiLocal(tgl, d[tgl].transaksi);
        if (resetUangAwal) await saveUangAwalLocal(tgl, d[tgl].uang_awal);
        if (isOnline) {
          try { await saveTransaksi(tgl, d[tgl].transaksi); } catch {}
          if (resetUangAwal) try { await saveHarian(tgl, d[tgl].uang_awal); } catch {}
        } else {
          await addToSyncQueue('transaksi', { tanggal: tgl, transaksi: d[tgl].transaksi });
          if (resetUangAwal) await addToSyncQueue('uang_awal', { tanggal: tgl, uang_awal: d[tgl].uang_awal });
        }
      }
      closeModal();
      showToast(`${datesToReset.length} hari direset!`, "info");
    } catch (err) {
      console.error("[doResetRange] Error:", err);
      showToast("Gagal reset: " + (err.message || "Error"), "error");
    }
    finally { setIsSubmitting(false); }
  };

  /* ─── Computed ─── */
  const todayCalc = safeCalc(todayData);
  const dates = Object.keys(data).sort((a, b) => b.localeCompare(a));
  const calc = useCallback((tanggal) => safeCalc(data[tanggal]), [data]);

  /* Stable callbacks — MUST be before conditional returns */
  const handleEditTx = useCallback((idx, tanggal) => {
    const tgl = tanggal || today;
    setEditIdx(idx);
    const t = data[tgl]?.transaksi?.[idx];
    if (!t) return;
    setFormEditJumlah(String(t.jumlah ?? ""));
    setFormEditMetode(t.metode || "cash");
    setFormEditKategori(t.kategori || "");
    setFormEditCatatan(t.catatan || "");
    setSelectedDate(tgl);
    setModal("editTransaksi");
  }, [data, today, setEditIdx, setFormEditJumlah, setFormEditMetode, setFormEditKategori, setFormEditCatatan, setSelectedDate, setModal]);

  const handleDeleteTx = useCallback((idx, tanggal) => {
    setHapusIdx(idx);
    setSelectedDate(tanggal || today);
    setModal("konfirmHapus");
  }, [setHapusIdx, setSelectedDate, setModal, today]);

  const handleDeleteAllTx = useCallback(async (tanggal) => {
    setData(prev => {
      const next = { ...prev };
      if (next[tanggal]) {
        next[tanggal] = { ...next[tanggal], transaksi: [] };
      }
      return next;
    });
    // Persist to IndexedDB so deleted data doesn't reappear on reload
    try {
      const { saveTransaksiLocal } = await import("./db/index.js");
      await saveTransaksiLocal(tanggal, []);
    } catch (e) {
      console.warn("[handleDeleteAllTx] IndexedDB save failed:", e);
    }
  }, [setData]);

  const updateKategoriList = useCallback((newList) => {
    setKategoriList(newList);
    try { localStorage.setItem("finly-kategori", JSON.stringify(newList)); } catch {}
  }, []);

  /* ─── Export helpers (moved BEFORE early returns to avoid hook count mismatch) ─── */
  const getAllExportData = useCallback((filterDates) => {
    const allDates = filterDates && filterDates.length > 0
      ? filterDates : Object.keys(data).sort((a, b) => b.localeCompare(a));
    const rows = [];
    let totalMasuk = 0, totalKeluar = 0;
    allDates.forEach(tgl => {
      (data[tgl]?.transaksi ?? []).forEach(t => {
        const row = {
          tanggal: tgl,
          tipe: t.type === "masuk" ? "Pemasukan" : "Pengeluaran",
          metode: (t.metode || "cash").toUpperCase(),
          kategori: t.kategori || "-",
          catatan: t.catatan || "-",
          jumlah: t.jumlah ?? 0,
        };
        if (t.type === "masuk") totalMasuk += t.jumlah ?? 0;
        else totalKeluar += t.jumlah ?? 0;
        rows.push(row);
      });
    });
    return { rows, totalMasuk, totalKeluar, totalTransaksi: rows.length, saldoBersih: totalMasuk - totalKeluar };
  }, [data]);

  const exportPDF = useCallback(async () => {
    try {
      const { default: jspdf } = await import("jspdf");
      await import("jspdf-autotable");
      const { rows, totalMasuk, totalKeluar, totalTransaksi, saldoBersih } = getAllExportData();
      const doc = new jspdf({ orientation: "landscape", unit: "mm", format: "a4" });
      doc.setFontSize(16);
      doc.text("Laporan Keuangan", 14, 15);
      doc.setFontSize(9);
      doc.text(`Export: ${new Date().toLocaleString("id-ID")}`, 14, 22);
      doc.text(`Total: ${totalTransaksi} transaksi | Masuk: Rp ${totalMasuk.toLocaleString("id-ID")} | Keluar: Rp ${totalKeluar.toLocaleString("id-ID")} | Saldo: Rp ${saldoBersih.toLocaleString("id-ID")}`, 14, 28);
      const headers = [["Tanggal", "Tipe", "Metode", "Kategori", "Catatan", "Jumlah (Rp)"]];
      const body = rows.map(r => [r.tanggal, r.tipe, r.metode, r.kategori, r.catatan, r.jumlah.toLocaleString("id-ID")]);
      doc.autoTable({ head: headers, body, startY: 32, styles: { fontSize: 7 }, headStyles: { fillColor: [107, 126, 255] }, margin: { left: 14, right: 14 } });
      doc.save(`finly-laporan-${today}.pdf`);
      closeModal();
      showToast("PDF berhasil di-export!", "success");
    } catch (e) {
      showToast("Gagal export PDF: " + (e.message || e), "error");
    }
  }, [data, today, getAllExportData, closeModal, showToast]);

  const exportExcel = useCallback(async () => {
    try {
      const XLSX = await import("xlsx");
      const { rows, totalMasuk, totalKeluar, totalTransaksi, saldoBersih } = getAllExportData();
      const wsData = [
        ["Aplikasi", "Finly"],
        ["Tanggal Export", new Date().toLocaleString("id-ID")],
        ["Total Transaksi", totalTransaksi],
        ["Total Pemasukan", totalMasuk],
        ["Total Pengeluaran", totalKeluar],
        ["Saldo Bersih", saldoBersih],
        [],
        ["Tanggal", "Tipe", "Metode", "Kategori", "Catatan", "Jumlah"],
        ...rows.map(r => [r.tanggal, r.tipe, r.metode, r.kategori, r.catatan, r.jumlah]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Laporan");
      XLSX.writeFile(wb, `finly-laporan-${today}.xlsx`);
      closeModal();
      showToast("Excel berhasil di-export!", "success");
    } catch (e) {
      showToast("Gagal export Excel: " + (e.message || e), "error");
    }
  }, [data, today, getAllExportData, closeModal, showToast]);

  /* ─── Loading screen ─── */
  if (authLoading) return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 24,
      padding: 20,
      textAlign: "center"
    }}>
      <div className="pulse-logo" style={{
        width: 90,
        height: 90,
        borderRadius: 24,
        background: "var(--surface)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        overflow: "hidden"
      }}>
        <img src="/logo.png" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.05)" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h2 style={{ color: "var(--text)", fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>Finly</h2>
        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", animation: `bounce 1s ease-in-out ${i * 0.2}s infinite` }}/>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0);opacity:.3} 50%{transform:translateY(-6px);opacity:1} }
        .pulse-logo { animation: pulse-logo 2s infinite ease-in-out; }
        @keyframes pulse-logo { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.9; } }
      `}</style>
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

  /* ─── Import helpers ─── */
  const handleOpenImport = () => {
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
          showToast("Format file tidak valid. Harus berisi { data: {...} }", "error");
          return;
        }
        const days = Object.keys(imported.data).sort();
        let totalTx = 0;
        days.forEach(tgl => { totalTx += (imported.data[tgl]?.transaksi?.length ?? 0); });
        setImportPreview({
          data: imported.data,
          version: imported.version || "unknown",
          exportedAt: imported.exportedAt || "unknown",
          days: days.length,
          totalTx,
          dateRange: days.length > 0 ? `${days[0]} — ${days[days.length - 1]}` : "-",
        });
        setModal("importPreview");
      } catch (err) {
        showToast("Gagal import: " + (err.message || "File tidak valid"), "error");
      }
    };
    input.click();
  };

  const doImport = async (mode) => {
    if (!importPreview) return;
    setImportLoading(true);
    try {
      const importedData = importPreview.data;
      let mergedData;
      setData(prev => {
        let merged;
        if (mode === "overwrite") {
          merged = importedData;
        } else {
          merged = { ...prev };
          Object.keys(importedData).forEach(tgl => {
            if (merged[tgl]) {
              const existingTx = merged[tgl].transaksi || [];
              const newTx = importedData[tgl].transaksi || [];
              merged[tgl] = {
                uang_awal: importedData[tgl].uang_awal ?? merged[tgl].uang_awal,
                transaksi: [...existingTx, ...newTx],
              };
            } else {
              merged[tgl] = importedData[tgl];
            }
          });
        }
        mergedData = merged;
        try { localStorage.setItem("kasapp-data", JSON.stringify(merged)); } catch {}
        return merged;
      });
      // Persist to IndexedDB so data survives reload
      const { saveAllToLocal } = await import("./db/index.js");
      const kasHarian = Object.keys(mergedData).filter(tgl => mergedData[tgl].uang_awal != null).map(tgl => ({
        tanggal: tgl,
        uang_awal: mergedData[tgl].uang_awal,
      }));
      const transaksi = [];
      Object.keys(mergedData).forEach(tgl => {
        (mergedData[tgl]?.transaksi || []).forEach(t => {
          transaksi.push({ ...t, tanggal: tgl });
        });
      });
      await saveAllToLocal(kasHarian, transaksi);

      closeModal();
      setImportPreview(null);
      showToast(`Import berhasil! (mode: ${mode === "overwrite" ? "timpa" : "gabung"})`, "success");
    } catch (err) {
      showToast("Gagal menyimpan data import: " + (err.message || "Error"), "error");
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
        body { margin: 0; background: var(--bg); }
        input::placeholder { color: var(--text-muted); }
        ::-webkit-scrollbar { width: 0; }
        :root { --cw: min(100vw, 480px); --sidebar-width: 240px; }
        @media (min-width: 768px) { :root { --cw: min(100vw, 640px); } }
        @media (min-width: 1024px) { :root { --cw: min(100vw, 800px); } }
        .app-container {
          max-width: var(--cw); margin: 0 auto; min-height: 100vh;
          background: var(--bg); font-family: 'Inter', sans-serif; position: relative;
        }
        .app-offline-banner {
          position: fixed; top: 0; left: 50%; transform: translateX(-50%);
          width: 100%; max-width: var(--cw); background: var(--warning);
          z-index: 3000; padding: 8px 16px; text-align: center;
          font-size: 12px; font-weight: 600; color: #fff;
        }
        .app-nav {
          position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
          width: 100%; max-width: var(--cw); background: var(--navbar);
          border-top: 1px solid var(--navbar-border); display: flex; z-index: 100;
        }
        .app-fab {
          position: fixed; bottom: 84px;
          right: calc((100vw - var(--cw)) / 2 + 20px);
          display: flex; flex-direction: column; gap: 10px; z-index: 99;
        }
        /* ─── Sidebar — desktop only ─── */
        .app-sidebar {
          display: none;
          position: fixed; top: 0; left: 0;
          width: var(--sidebar-width); height: 100vh;
          background: var(--surface);
          border-right: 1px solid var(--border);
          z-index: 200; flex-direction: column;
          overflow-y: auto;
        }
        .app-sidebar-nav {
          padding: 12px; display: flex; flex-direction: column; gap: 2px;
        }
        .app-sidebar-nav button {
          width: 100%; display: flex; align-items: center; gap: 12px;
          padding: 11px 14px; border: none; border-radius: 10px;
          cursor: pointer; font-size: 14px; font-weight: 600;
          font-family: 'Inter', sans-serif; text-align: left; transition: all 0.15s;
        }
        .app-sidebar-nav button:hover {
          background: var(--accent-subtle);
        }
        .app-sidebar-footer {
          margin-top: auto; padding: 12px 12px 20px;
          border-top: 1px solid var(--border);
        }
        @media (min-width: 768px) {
          .app-sidebar { display: flex; }
          .app-nav { display: none; }
          .app-container {
            margin-left: var(--sidebar-width); margin-right: auto; max-width: var(--cw);
          }
          .app-fab {
            bottom: 24px;
            right: calc(100vw - var(--sidebar-width) - var(--cw) + 20px);
          }
          .app-offline-banner {
            left: calc(50% + var(--sidebar-width) / 2);
            max-width: calc(100vw - var(--sidebar-width));
          }
        }
      `}</style>

      {/* ─── Sidebar ─── */}
      <div className="app-sidebar">
        <div style={{
          padding: "20px 16px 16px",
          display: "flex", alignItems: "center", gap: 10,
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: "var(--gradient)", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 800, fontSize: 16,
          }}>
            F
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", letterSpacing: -0.5 }}>
            Finly
          </span>
        </div>
        <div className="app-sidebar-nav">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                background: tab === t.key ? "var(--accent-subtle)" : "none",
                color: tab === t.key ? "var(--accent)" : "var(--text-secondary)",
              }}
            >
              <Icon name={t.icon} size={20} color={tab === t.key ? "var(--accent)" : "var(--text-secondary)"} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
        <div className="app-sidebar-footer">
          {installPrompt && (
            <button onClick={async () => {
              installPrompt.prompt();
              const { outcome } = await installPrompt.userChoice;
              if (outcome === 'accepted') setInstallPrompt(null);
            }} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "11px 14px", border: "none", borderRadius: 10,
              background: "var(--accent-subtle)", cursor: "pointer",
              color: "var(--accent)", fontSize: 14, fontWeight: 600,
              fontFamily: "'Inter', sans-serif", width: "100%", textAlign: "left",
              transition: "all 0.15s", marginBottom: 4,
            }}>
              <Icon name="download" size={20} color="var(--accent)" />
              <span>Pasang Aplikasi</span>
            </button>
          )}
          <button onClick={() => {
            toggleTheme();
            setIsDark(prev => !prev);
          }} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "11px 14px", border: "none", borderRadius: 10,
            background: "none", cursor: "pointer",
            color: "var(--text-secondary)", fontSize: 14, fontWeight: 600,
            fontFamily: "'Inter', sans-serif", width: "100%", textAlign: "left",
            transition: "all 0.15s",
          }}>
            <Icon name={isDark ? "sun" : "moon"} size={20} color="var(--text-secondary)" />
            <span>{isDark ? "Mode Terang" : "Mode Gelap"}</span>
          </button>
        </div>
      </div>

      <div className="app-container">
        {toasts[0] && <Toast msg={toasts[0].msg} type={toasts[0].type} />}
        {!isOnline && (
          <div className="app-offline-banner">
            <span>Tidak ada koneksi internet</span>
            {dates.length > 0 && (
              <span style={{ marginLeft: 8, opacity: 0.8 }}>— {dates.length} hari data tersedia offline</span>
            )}
          </div>
        )}

        {/* ─── Screens ─── */}
        <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 60 }}>
          <div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>}>
        {tab === "home" && (
          <div key="home" className="page-transition">
            <HomeScreen
              data={data} today={today} todayCalc={todayCalc}
              setModal={setModal} setTab={setTab}
              profile={profile} user={user}
              onEditTx={handleEditTx}
              onDeleteTx={handleDeleteTx}
              budgetMap={budgetMap}
              kategoriList={kategoriList}
            />
          </div>
        )}
        {tab === "laporan" && (
          <div key="laporan" className="page-transition">
            <LaporanScreen
              data={data} today={today} dates={dates} calc={calc}
              selectedDate={selectedDate} setSelectedDate={setSelectedDate}
              modalOpen={modal} setModal={setModal} closeModal={closeModal}
              onEditTx={handleEditTx} onDeleteTx={handleDeleteTx}
              onDeleteAllTx={handleDeleteAllTx}
              onEditUangAwal={(tgl) => { setUbahTarget(tgl); setFormUangAwal(String(data[tgl]?.uang_awal ?? "0")); setModal("ubahAwal"); }}
            />
          </div>
        )}
        {tab === "pengaturan" && (
          <div key="pengaturan" className="page-transition">
            <PengaturanScreen
              data={data} today={today} dates={dates}
              setUbahTarget={setUbahTarget} setFormUangAwal={setFormUangAwal} setModal={setModal}
              profile={profile} setProfile={setProfile} user={user}
              onResetUangAwal={async (tanggal) => { await doUbahAwal(0, tanggal); }}
              onLogout={async () => { try { await supabase.auth.signOut(); } catch{} setUser(null); setData({}); setProfile(null); setTab("home"); }}
              kategoriList={kategoriList} onUpdateKategori={updateKategoriList}
              budgetMap={budgetMap} onUpdateBudget={updateBudget}
              recurringRules={recurringRules} onAddRecurringRule={addRecurringRule} onRemoveRecurringRule={removeRecurringRule}
              onOpenImport={handleOpenImport} installPrompt={installPrompt}
            />
          </div>
        )}
        </Suspense>

        {/* ─── Bottom nav ─── */}
        <div className="app-nav">
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
          <div className="app-fab">
            <button onClick={() => setModal("keluar")} style={{
              width: 50, height: 50, borderRadius: 16, background: "var(--danger)",
              border: "none", cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", boxShadow: "0 2px 8px rgba(239, 68, 68, 0.25)",
            }}>
              <Icon name="minus" size={22} color="#fff" />
            </button>
            <button onClick={() => setModal("masuk")} style={{
              width: 50, height: 50, borderRadius: 16, background: "var(--gradient)",
              border: "none", cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", boxShadow: "0 2px 8px rgba(107, 126, 255, 0.25)",
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
          <label style={{ color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 8 }}>Kategori</label>
          <select value={formKategori} onChange={(e) => setFormKategori(e.target.value)}
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 12,
              border: "1px solid var(--border)", background: "var(--input-bg)",
              color: formKategori ? "var(--text)" : "var(--text-muted)",
              fontSize: 14, fontFamily: "'Inter', sans-serif", outline: "none", marginBottom: 16,
            }}>
            <option value="">Pilih kategori</option>
            {kategoriList.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <Field label="Catatan" value={formCatatan} onChange={setFormCatatan} placeholder="Opsional" onKeyDown={(e) => { if (e.key === "Enter" && !isSubmitting) doKeluar(); }} />
          <Btn onClick={doKeluar} variant="danger" icon="minus" disabled={isSubmitting || !formKategori} fullWidth>Tambah Pengeluaran</Btn>
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
        <Modal show={modal === "konfirmHapus"} onClose={closeModal} title={`Hapus Transaksi${selectedDate && selectedDate !== today ? ` — ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}` : ''}`}>
          {hapusIdx !== null && (data[selectedDate || today]?.transaksi?.[hapusIdx]) && (
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
        <Modal show={modal === "editTransaksi"} onClose={closeModal} title={`Edit Transaksi${selectedDate && selectedDate !== today ? ` — ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}` : ''}`}>
          {editIdx !== null && (data[selectedDate || today]?.transaksi)?.[editIdx] && (() => {
            const t = (data[selectedDate || today]?.transaksi)?.[editIdx];
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
                    <label style={{ color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 8 }}>Kategori</label>
                    <select value={formEditKategori} onChange={(e) => setFormEditKategori(e.target.value)}
                      style={{
                        width: "100%", padding: "12px 14px", borderRadius: 12,
                        border: "1px solid var(--border)", background: "var(--input-bg)",
                        color: formEditKategori ? "var(--text)" : "var(--text-muted)",
                        fontSize: 14, fontFamily: "'Inter', sans-serif", outline: "none", marginBottom: 16,
                      }}>
                      <option value="">Pilih kategori</option>
                      {kategoriList.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
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
                <Btn onClick={() => doUbahAwal()} icon="check" disabled={isSubmitting}>Simpan</Btn>
              </div>
            </>
          )}
        </Modal>

        {/* Reset transaksi per range */}
        <Modal show={modal === "resetRange"} onClose={closeModal} title="Reset Transaksi per Range">
          <div>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
              Hapus semua transaksi dalam rentang tanggal tertentu.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <div>
                <label style={{ color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Tanggal Awal</label>
                <input type="date" value={resetStart} onChange={e => setResetStart(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)",
                    background: "var(--input-bg)", color: "var(--text)", fontSize: 13, fontFamily: "'Inter', sans-serif" }} />
              </div>
              <div>
                <label style={{ color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Tanggal Akhir</label>
                <input type="date" value={resetEnd} onChange={e => setResetEnd(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)",
                    background: "var(--input-bg)", color: "var(--text)", fontSize: 13, fontFamily: "'Inter', sans-serif" }} />
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, cursor: "pointer" }}>
              <input type="checkbox" checked={resetUangAwal} onChange={e => setResetUangAwal(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "var(--danger)" }} />
              <span style={{ color: "var(--text)", fontSize: 13 }}>Reset uang awal juga</span>
            </label>
            {resetStart && resetEnd && (() => {
              const c = Object.keys(data).filter(tgl => tgl >= resetStart && tgl <= resetEnd).length;
              const t = Object.keys(data).filter(tgl => tgl >= resetStart && tgl <= resetEnd)
                .reduce((s, tgl) => s + (data[tgl]?.transaksi?.length ?? 0), 0);
              return c > 0 ? (
                <p style={{ color: "var(--text-muted)", fontSize: 12, marginBottom: 16 }}>
                  {c} hari • {t} transaksi akan direset
                </p>
              ) : (
                <p style={{ color: "var(--warning)", fontSize: 12, marginBottom: 16 }}>Tidak ada data di range ini</p>
              );
            })()}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Btn onClick={closeModal} variant="ghost">Batal</Btn>
              <Btn onClick={doResetRange} variant="danger" icon="trash" disabled={isSubmitting || !resetStart || !resetEnd}>Reset</Btn>
            </div>
          </div>
        </Modal>

        {/* Clear all data */}
        <Modal show={modal === "clearData"} onClose={closeModal} title="Hapus Semua Data">
          <div>
            <div style={{
              width: 56, height: 56, borderRadius: 16, background: "var(--danger-subtle)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
            }}>
              <Icon name="trash" size={24} color="var(--danger)" />
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: "0 0 8px", textAlign: "center", lineHeight: 1.5 }}>
              Semua data transaksi, uang awal, dan riwayat akan dihapus permanen. Tindakan ini <strong>tidak bisa dibatalkan</strong>.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
              <Btn onClick={closeModal} variant="ghost">Batal</Btn>
              <Btn
                onClick={async () => {
                  try {
                    const { clearAllData } = await import("./db/index");
                    await clearAllData?.();
                  } catch {}
                  try { localStorage.removeItem("kasapp-data"); } catch {}
                  setData({}); setToday(getCurrentDate());
                  closeModal();
                  showToast("Semua data berhasil dihapus!", "info");
                }}
                variant="danger"
                icon="trash"
              >
                Hapus Semua
              </Btn>
            </div>
          </div>
        </Modal>

        {/* ─── Recurring Transaction Form ─── */}
        <RecurringForm
          show={modal === "tambahRecurring"}
          onClose={closeModal}
          kategoriList={kategoriList}
          addRecurringRule={addRecurringRule}
          showToast={showToast}
        />

        {/* Export data */}
        <Modal show={modal === "export"} onClose={closeModal} title="Export Data">
          <div>
            <div style={{
              width: 56, height: 56, borderRadius: 16, background: "var(--success-subtle)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
            }}>
              <Icon name="download" size={24} color="var(--success)" />
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: "0 0 16px", textAlign: "center", lineHeight: 1.5 }}>
              Download data transaksi dalam format pilihan Anda.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <Btn onClick={() => {
                const { rows } = getAllExportData();
                const esc = (v) => { let s = String(v ?? ""); if (/^[=+\-@]/.test(s)) s = '\t' + s; return /["\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
                const lines = [
                  [esc("Aplikasi"), esc("Finly")].join(","),
                  [esc("Tanggal Export"), esc(new Date().toLocaleString("id-ID"))].join(","),
                  [esc("Total Transaksi"), rows.length].join(","),
                  "",
                  [esc("Tanggal"), esc("Tipe"), esc("Metode"), esc("Kategori"), esc("Catatan"), esc("Jumlah")].join(","),
                  ...rows.map(r => [esc(r.tanggal), esc(r.tipe), esc(r.metode), esc(r.kategori), esc(r.catatan), r.jumlah].join(",")),
                ];
                const csv = "\uFEFF" + lines.join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a"); a.href = url; a.download = `finly-laporan-${today}.csv`; a.click();
                URL.revokeObjectURL(url);
                closeModal();
                showToast("CSV berhasil di-export!", "success");
              }} variant="ghost" icon="download">CSV</Btn>
              <Btn onClick={() => {
                try { exportPDF(); } catch (e) { showToast("Gagal export PDF: " + e.message, "error"); }
              }} variant="ghost" icon="download">PDF</Btn>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <Btn onClick={() => {
                try { exportExcel(); } catch (e) { showToast("Gagal export Excel: " + e.message, "error"); }
              }} variant="ghost" icon="download">Excel (XLSX)</Btn>
              <Btn onClick={() => {
                const exportDates = Object.keys(data).sort();
                let exportTx = 0;
                const dateRange = exportDates.length > 0 ? { from: exportDates[0], to: exportDates[exportDates.length - 1] } : null;
                exportDates.forEach(tgl => { exportTx += (data[tgl]?.transaksi?.length ?? 0); });
                const exportData = {
                  data,
                  exportedAt: new Date().toISOString(),
                  version,
                  appName: "Finly",
                  metadata: {
                    totalDays: exportDates.length,
                    totalTransactions: exportTx,
                    dateRange,
                  },
                };
                const json = JSON.stringify(exportData, null, 2);
                const blob = new Blob([json], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a"); a.href = url; a.download = `finly-backup-${today}.json`; a.click();
                URL.revokeObjectURL(url);
                closeModal();
                showToast("Backup JSON berhasil!", "success");
              }} variant="ghost" icon="download">Backup JSON</Btn>
            </div>
            <div style={{ marginTop: 10 }}>
              <Btn onClick={closeModal} variant="ghost" fullWidth>Tutup</Btn>
            </div>
          </div>
        </Modal>

        {/* Import preview */}
        <Modal show={modal === "importPreview"} onClose={() => { if (!importLoading) { closeModal(); setImportPreview(null); } }} title="Preview Import Data">
          {importPreview && (
            <div>
              <div style={{
                width: 56, height: 56, borderRadius: 16, background: "var(--accent-subtle)",
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
              }}>
                <Icon name="upload" size={24} color="var(--accent)" />
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ background: "var(--input-bg)", borderRadius: 12, padding: "12px", textAlign: "center" }}>
                    <p style={{ margin: "0 0 4px", fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Hari</p>
                    <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--text)" }}>{importPreview.days}</p>
                  </div>
                  <div style={{ background: "var(--input-bg)", borderRadius: 12, padding: "12px", textAlign: "center" }}>
                    <p style={{ margin: "0 0 4px", fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Transaksi</p>
                    <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "var(--text)" }}>{importPreview.totalTx}</p>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 12, textAlign: "center" }}>
                  <p style={{ margin: "0 0 2px" }}>Rentang: {importPreview.dateRange}</p>
                  <p style={{ margin: 0 }}>Versi file: {importPreview.version}</p>
                </div>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: 13, textAlign: "center", marginBottom: 20, lineHeight: 1.5 }}>
                Pilih mode import:
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <Btn onClick={() => doImport("merge")} variant="primary" icon="plus" disabled={importLoading}>
                  {importLoading ? "Memproses..." : "Gabung"}
                </Btn>
                <Btn onClick={() => doImport("overwrite")} variant="danger" icon="trash" disabled={importLoading}>
                  {importLoading ? "Memproses..." : "Timpa"}
                </Btn>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center", marginTop: 8 }}>
                Gabung: tambahkan data import ke data yang ada. Timpa: ganti semua data saat ini.
              </div>
              <div style={{ marginTop: 16 }}>
                <Btn onClick={() => { closeModal(); setImportPreview(null); }} variant="ghost" fullWidth disabled={importLoading}>Batal</Btn>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </>
  );
}
