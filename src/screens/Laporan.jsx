import { useState } from "react";
import Card from "../components/Card";
import Badge from "../components/Badge";
import TransaksiRow from "../components/TransaksiRow";
import Modal from "../components/Modal";
import { formatUang } from "../utils/format";

function LaporanHarianContent({ data, selectedDate, calc }) {
  const tgl = selectedDate;
  if (!tgl || !data[tgl]) return null;
  const c = calc(tgl);

  return (
    <div>
      <div style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 14, padding: 14, marginBottom: 16 }}>
        <p style={{ color: "#aaa", fontSize: 11, margin: "0 0 4px" }}>Uang Awal</p>
        <p style={{ color: "#fff", fontWeight: 800, fontSize: 20, margin: 0, fontFamily: "'Sora',sans-serif" }}>{formatUang(c.uang_awal)}</p>
      </div>

      <p style={{ color: "#6366F1", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Pemasukan</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[["Cash", c.totalCash, "#10B981"], ["QRIS", c.totalQris, "#06B6D4"], ["Total", c.totalMasuk, "#6366F1"]].map(([l, v, col]) => (
          <div key={l} style={{ background: `${col}11`, border: `1px solid ${col}33`, borderRadius: 12, padding: "10px 12px" }}>
            <p style={{ color: col + "99", fontSize: 10, margin: "0 0 4px", fontWeight: 600 }}>{l}</p>
            <p style={{ color: col, fontSize: 12, fontWeight: 700, margin: 0 }}>{formatUang(v)}</p>
          </div>
        ))}
      </div>

      <p style={{ color: "#6366F1", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Pengeluaran per Kategori</p>
      {Object.keys(c.kategoriMap ?? {}).length === 0 ? (
        <p style={{ color: "#555577", fontSize: 13, marginBottom: 14 }}>Belum ada pengeluaran</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
          {Object.entries(c.kategoriMap).map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "8px 12px" }}>
              <span style={{ color: "#ccc", fontSize: 13 }}>{k}</span>
              <span style={{ color: "#EF4444", fontWeight: 700, fontSize: 13 }}>{formatUang(v)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(239,68,68,0.1)", borderRadius: 10, padding: "8px 12px" }}>
            <span style={{ color: "#EF4444", fontSize: 13, fontWeight: 700 }}>Total</span>
            <span style={{ color: "#EF4444", fontWeight: 700, fontSize: 13 }}>{formatUang(c.totalKeluar)}</span>
          </div>
        </div>
      )}

      <p style={{ color: "#6366F1", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Saldo Akhir</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {[["Cash Fisik", c.saldoCash, "#10B981"], ["Total Sistem", c.saldoTotal, "#6366F1"], ["Tanpa Gaji", c.saldoTanpaGaji, "#F59E0B"]].map(([l, v, col]) => (
          <div key={l} style={{ display: "flex", justifyContent: "space-between", background: `${col}11`, border: `1px solid ${col}22`, borderRadius: 12, padding: "10px 14px" }}>
            <span style={{ color: "#aaa", fontSize: 13 }}>{l}</span>
            <span style={{ color: col, fontWeight: 700, fontSize: 14 }}>{formatUang(v)}</span>
          </div>
        ))}
      </div>

      <p style={{ color: "#6366F1", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Riwayat Transaksi</p>
      {c.transaksi.length === 0 ? (
        <p style={{ color: "#555577", fontSize: 13 }}>Tidak ada transaksi</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {c.transaksi.map((t, i) => <TransaksiRow key={i} t={t} />)}
        </div>
      )}
    </div>
  );
}

function LaporanMingguan({ data, calc, dates }) {
  const weeks = {};
  dates.forEach(tgl => {
    const date = new Date(tgl + 'T00:00:00');
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    const weekKey = monday.toISOString().split('T')[0];
    if (!weeks[weekKey]) weeks[weekKey] = [];
    weeks[weekKey].push(tgl);
  });
  const weekKeys = Object.keys(weeks).sort((a, b) => b.localeCompare(a));

  if (weekKeys.length === 0) return (
    <Card><p style={{ color: "#555577", textAlign: "center", margin: "24px 0", fontSize: 14 }}>Belum ada data</p></Card>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {weekKeys.map(weekKey => {
        const weekDates = weeks[weekKey];
        const totalMasuk = weekDates.reduce((s, tgl) => s + (calc(tgl).totalMasuk ?? 0), 0);
        const totalKeluar = weekDates.reduce((s, tgl) => s + (calc(tgl).totalKeluar ?? 0), 0);
        const endDate = new Date(weekKey + 'T00:00:00');
        endDate.setDate(endDate.getDate() + 6);
        return (
          <div key={weekKey} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 14, fontFamily: "'Sora',sans-serif", color: "#fff" }}>
                  {new Date(weekKey + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <p style={{ margin: 0, color: "#6b6b88", fontSize: 12 }}>{weekDates.length} hari aktif</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: "0 0 2px", color: "#10B981", fontWeight: 700, fontSize: 13 }}>+{formatUang(totalMasuk)}</p>
                <p style={{ margin: 0, color: "#EF4444", fontSize: 12 }}>-{formatUang(totalKeluar)}</p>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {weekDates.map(tgl => {
                const c = calc(tgl);
                return (
                  <div key={tgl} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
                    <span style={{ color: "#aaa", fontSize: 12 }}>{new Date(tgl + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                    <div style={{ display: "flex", gap: 12 }}>
                      <span style={{ color: "#10B981", fontSize: 12, fontWeight: 600 }}>+{formatUang(c.totalMasuk ?? 0)}</span>
                      <span style={{ color: "#EF4444", fontSize: 12, fontWeight: 600 }}>-{formatUang(c.totalKeluar ?? 0)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LaporanBulanan({ data, calc, dates }) {
  const months = {};
  dates.forEach(tgl => {
    const monthKey = tgl.substring(0, 7);
    if (!months[monthKey]) months[monthKey] = [];
    months[monthKey].push(tgl);
  });
  const monthKeys = Object.keys(months).sort((a, b) => b.localeCompare(a));

  if (monthKeys.length === 0) return (
    <Card><p style={{ color: "#555577", textAlign: "center", margin: "24px 0", fontSize: 14 }}>Belum ada data</p></Card>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {monthKeys.map(monthKey => {
        const monthDates = months[monthKey];
        const totalMasuk = monthDates.reduce((s, tgl) => s + (calc(tgl).totalMasuk ?? 0), 0);
        const totalKeluar = monthDates.reduce((s, tgl) => s + (calc(tgl).totalKeluar ?? 0), 0);
        const saldo = totalMasuk - totalKeluar;
        const [year, month] = monthKey.split('-');
        const monthName = new Date(year, month - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        return (
          <div key={monthKey} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 15, fontFamily: "'Sora',sans-serif", color: "#fff" }}>{monthName}</p>
                <p style={{ margin: 0, color: "#6b6b88", fontSize: 12 }}>{monthDates.length} hari aktif</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: "0 0 2px", color: "#10B981", fontWeight: 700, fontSize: 13 }}>+{formatUang(totalMasuk)}</p>
                <p style={{ margin: 0, color: "#EF4444", fontSize: 12 }}>-{formatUang(totalKeluar)}</p>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "8px 12px", marginBottom: 10 }}>
              <span style={{ color: "#aaa", fontSize: 13 }}>Saldo Bersih</span>
              <span style={{ color: saldo >= 0 ? "#10B981" : "#EF4444", fontWeight: 700, fontSize: 13 }}>{formatUang(saldo)}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {monthDates.map(tgl => {
                const c = calc(tgl);
                return (
                  <div key={tgl} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
                    <span style={{ color: "#aaa", fontSize: 12 }}>{new Date(tgl + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' })}</span>
                    <div style={{ display: "flex", gap: 12 }}>
                      <span style={{ color: "#10B981", fontSize: 12, fontWeight: 600 }}>+{formatUang(c.totalMasuk ?? 0)}</span>
                      <span style={{ color: "#EF4444", fontSize: 12, fontWeight: 600 }}>-{formatUang(c.totalKeluar ?? 0)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function LaporanScreen({
  data, today, dates, calc,
  selectedDate, setSelectedDate,
  modalOpen, setModal, closeModal,
}) {
  const [activeTab, setActiveTab] = useState("harian");
  const [filterDari, setFilterDari] = useState("");
  const [filterSampai, setFilterSampai] = useState("");

  // Filter rentang tanggal (hanya mempengaruhi tampilan, bukan data asli)
  const filteredDates = dates.filter(tgl => {
    if (filterDari && tgl < filterDari) return false;
    if (filterSampai && tgl > filterSampai) return false;
    return true;
  });

  const tabs = [
    { key: "harian",   label: "Harian" },
    { key: "mingguan", label: "Mingguan" },
    { key: "bulanan",  label: "Bulanan" },
  ];

  const exportCSV = () => {
    // Escape CSV field: wrap in quotes if contains comma, quote, or newline
    const esc = (v) => {
      const s = String(v ?? "");
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    // Hitung ringkasan dari filtered dates
    let totalMasuk = 0;
    let totalKeluar = 0;
    let totalTransaksi = 0;
    filteredDates.forEach(tgl => {
      const c = calc(tgl);
      totalMasuk += c.totalMasuk ?? 0;
      totalKeluar += c.totalKeluar ?? 0;
      totalTransaksi += c.transaksi?.length ?? 0;
    });
    const saldoBersih = totalMasuk - totalKeluar;

    // Nama file dinamis
    let filename;
    if (filterDari || filterSampai) {
      const dari = filterDari || "awal";
      const sampai = filterSampai || "sekarang";
      filename = `kasapp-laporan-${dari}_sampai_${sampai}.csv`;
    } else {
      filename = "kasapp-laporan-semua.csv";
    }

    // Bangun baris CSV
    const lines = [];
    // Header ringkasan
    lines.push([esc("Aplikasi"), esc("Kas App")].join(","));
    lines.push([esc("Tanggal Export"), esc(new Date().toLocaleString("id-ID"))].join(","));
    lines.push([esc("Rentang Laporan"), esc(filterDari || filterSampai ? `${filterDari || "awal"} s/d ${filterSampai || "sekarang"}` : "Semua")].join(","));
    lines.push([esc("Total Transaksi"), totalTransaksi].join(","));
    lines.push([esc("Total Pemasukan"), totalMasuk].join(","));
    lines.push([esc("Total Pengeluaran"), totalKeluar].join(","));
    lines.push([esc("Saldo Bersih"), saldoBersih].join(","));
    // Baris kosong pemisah
    lines.push("");
    // Header tabel transaksi
    lines.push([esc("Tanggal"), esc("Tipe"), esc("Metode"), esc("Kategori"), esc("Catatan"), esc("Jumlah")].join(","));
    // Data transaksi
    filteredDates.forEach(tgl => {
      const c = calc(tgl);
      c.transaksi?.forEach(t => {
        lines.push([
          esc(tgl),
          esc(t.type === "masuk" ? "Pemasukan" : "Pengeluaran"),
          esc(t.metode?.toUpperCase() || "-"),
          esc(t.kategori || "-"),
          esc(t.catatan || "-"),
          t.jumlah,
        ].join(","));
      });
    });

    // BOM + CSV content
    const csv = "\uFEFF" + lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <div style={{ paddingTop: 60, paddingBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ color: "#fff", fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 22, margin: 0 }}>
          Laporan
        </h2>
        <button onClick={exportCSV}
          style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, padding: "8px 12px", cursor: "pointer", color: "#10B981", fontSize: 12, fontWeight: 600, fontFamily: "'Sora',sans-serif" }}>
          Export CSV
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{ padding: "10px", borderRadius: 12, border: `1.5px solid ${activeTab === t.key ? "#6366F1" : "rgba(255,255,255,0.1)"}`, background: activeTab === t.key ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)", color: activeTab === t.key ? "#6366F1" : "#aaa", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Sora',sans-serif" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Filter rentang tanggal */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 120 }}>
          <label style={{ color: "#8888aa", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 6 }}>Dari</label>
          <input type="date" value={filterDari} onChange={e => setFilterDari(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 14, fontFamily: "'Sora',sans-serif", outline: "none", boxSizing: "border-box", colorScheme: "dark" }} />
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <label style={{ color: "#8888aa", fontSize: 11, fontWeight: 600, letterSpacing: 0.5, display: "block", marginBottom: 6 }}>Sampai</label>
          <input type="date" value={filterSampai} onChange={e => setFilterSampai(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 14, fontFamily: "'Sora',sans-serif", outline: "none", boxSizing: "border-box", colorScheme: "dark" }} />
        </div>
        {(filterDari || filterSampai) && (
          <button onClick={() => { setFilterDari(""); setFilterSampai(""); }}
            style={{ alignSelf: "flex-end", padding: "10px 14px", borderRadius: 12, border: "1.5px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.12)", color: "#EF4444", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'Sora',sans-serif" }}>
            Reset
          </button>
        )}
      </div>

      {activeTab === "harian" && (
        filteredDates.length === 0 ? (
          <Card><p style={{ color: "#555577", textAlign: "center", margin: "24px 0", fontSize: 14 }}>
            {dates.length === 0 ? "Belum ada data" : "Tidak ada data dalam rentang ini"}
          </p></Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredDates.map(tgl => {
              const c = calc(tgl);
              return (
                <button key={tgl} onClick={() => { setSelectedDate(tgl); setModal("laporanHarian"); }}
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "14px 16px", cursor: "pointer", textAlign: "left", color: "#fff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 15, fontFamily: "'Sora',sans-serif" }}>
                        {tgl} {tgl === today && <Badge color="#6366F1">HARI INI</Badge>}
                      </p>
                      <p style={{ margin: 0, color: "#6b6b88", fontSize: 12 }}>{c.transaksi?.length ?? 0} transaksi</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: "0 0 2px", color: "#10B981", fontWeight: 700, fontSize: 13 }}>+{formatUang(c.totalMasuk ?? 0)}</p>
                      <p style={{ margin: 0, color: "#EF4444", fontSize: 12 }}>-{formatUang(c.totalKeluar ?? 0)}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )
      )}

      {activeTab === "mingguan" && <LaporanMingguan data={data} calc={calc} dates={filteredDates} />}
      {activeTab === "bulanan" && <LaporanBulanan data={data} calc={calc} dates={filteredDates} />}

      <Modal show={modalOpen === "laporanHarian"} onClose={closeModal} title={`Laporan — ${selectedDate}`}>
        <LaporanHarianContent data={data} selectedDate={selectedDate} calc={calc} />
      </Modal>
    </div>
  );
}