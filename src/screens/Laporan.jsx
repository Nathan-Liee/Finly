import { useState } from "react";
import Card from "../components/Card";
import Badge from "../components/Badge";
import TransaksiRow from "../components/TransaksiRow";
import Modal from "../components/Modal";
import Icon from "../components/Icon";
import { formatUang } from "../utils/format";

/* ═══════════════════════════════════════════
 *  LAPORAN SCREEN
 *  Combined: daily detail + weekly/monthly + simple chart
 * ═══════════════════════════════════════════ */

/* ─── Simple Bar Chart ─── */
function SimpleChart({ data, today }) {
  const dates = Object.keys(data).sort().slice(-7);
  if (dates.length === 0) return null;

  let maxVal = 0;
  const bars = dates.map(tgl => {
    const transaksi = data[tgl]?.transaksi ?? [];
    const masuk = transaksi.filter(t => t.type === "masuk").reduce((s, t) => s + (t.jumlah ?? 0), 0);
    const keluar = transaksi.filter(t => t.type === "keluar").reduce((s, t) => s + (t.jumlah ?? 0), 0);
    maxVal = Math.max(maxVal, masuk, keluar);
    return { tgl, masuk, keluar };
  });

  if (maxVal === 0) return null;

  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--text)", fontFamily: "'Inter', sans-serif" }}>7 Hari Terakhir</p>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: "var(--success)" }} />
            <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>Masuk</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: "var(--danger)" }} />
            <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>Keluar</span>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
        {bars.map(({ tgl, masuk, keluar }) => {
          const masukH = (masuk / maxVal) * 80;
          const keluarH = (keluar / maxVal) * 80;
          const isToday = tgl === today;
          return (
            <div key={tgl} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 80 }}>
                <div style={{
                  width: "40%", maxWidth: 16, height: Math.max(masukH, 2),
                  background: "var(--success)", borderRadius: "3px 3px 0 0",
                  opacity: masuk > 0 ? 1 : 0.2,
                }} />
                <div style={{
                  width: "40%", maxWidth: 16, height: Math.max(keluarH, 2),
                  background: "var(--danger)", borderRadius: "3px 3px 0 0",
                  opacity: keluar > 0 ? 1 : 0.2,
                }} />
              </div>
              <span style={{
                fontSize: 9, fontWeight: 600, color: isToday ? "var(--accent)" : "var(--text-muted)",
                fontFamily: "'Inter', sans-serif",
              }}>
                {new Date(tgl + "T00:00:00").toLocaleDateString("id-ID", { weekday: "short" }).charAt(0)}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ─── Daily Detail Modal Content ─── */
function LaporanHarianContent({ data, selectedDate, calc }) {
  const tgl = selectedDate;
  if (!tgl || !data[tgl]) return null;
  const c = calc(tgl);

  return (
    <div>
      {/* Uang Awal */}
      <div style={{
        background: "var(--accent-subtle)", border: "1px solid var(--accent-border)",
        borderRadius: 14, padding: 14, marginBottom: 16,
      }}>
        <p style={{ color: "var(--text-secondary)", fontSize: 11, margin: "0 0 4px", fontWeight: 600 }}>Uang Awal</p>
        <p style={{ color: "var(--accent)", fontWeight: 800, fontSize: 20, margin: 0, fontFamily: "'Inter', sans-serif" }}>
          {formatUang(c.uang_awal)}
        </p>
      </div>

      {/* Pemasukan */}
      <p style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Pemasukan</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        <div style={{ background: "var(--success-subtle)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: 12, padding: "10px 12px" }}>
          <p style={{ color: "var(--success)", fontSize: 10, margin: "0 0 4px", fontWeight: 600, opacity: 0.7 }}>Cash</p>
          <p style={{ color: "var(--success)", fontSize: 13, fontWeight: 800, margin: 0 }}>{formatUang(c.totalCash)}</p>
        </div>
        <div style={{ background: "var(--info-subtle)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 12, padding: "10px 12px" }}>
          <p style={{ color: "var(--info)", fontSize: 10, margin: "0 0 4px", fontWeight: 600, opacity: 0.7 }}>QRIS</p>
          <p style={{ color: "var(--info)", fontSize: 13, fontWeight: 800, margin: 0 }}>{formatUang(c.totalQris)}</p>
        </div>
      </div>

      {/* Pengeluaran per Kategori */}
      {c.kategoriMap && Object.keys(c.kategoriMap).length > 0 && (
        <>
          <p style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Pengeluaran per Kategori</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
            {Object.entries(c.kategoriMap).map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "var(--surface)", borderRadius: 10, border: "1px solid var(--border)" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 500 }}>{k}</span>
                <span style={{ color: "var(--danger)", fontWeight: 700, fontSize: 13 }}>{formatUang(v)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Saldo */}
      <p style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Saldo Akhir</p>
      <div style={{
        display: "flex", justifyContent: "space-between", padding: "12px 14px",
        background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)",
        marginBottom: 16,
      }}>
        <span style={{ color: "var(--text-secondary)", fontSize: 14, fontWeight: 600 }}>Saldo</span>
        <span style={{ color: c.saldoCash >= 0 ? "var(--success)" : "var(--danger)", fontWeight: 800, fontSize: 16 }}>
          {formatUang(c.saldoCash)}
        </span>
      </div>

      {/* Transactions */}
      <p style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Transaksi</p>
      {c.transaksi.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Tidak ada transaksi</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {c.transaksi.map((t, i) => <TransaksiRow key={i} t={t} showActions={false} />)}
        </div>
      )}
    </div>
  );
}

export default function LaporanScreen({
  data, today, dates, calc,
  selectedDate, setSelectedDate,
  modalOpen, setModal, closeModal,
}) {
  const [activeTab, setActiveTab] = useState("harian");

  const tabs = [
    { key: "harian", label: "Harian", icon: "calendar" },
    { key: "mingguan", label: "Mingguan", icon: "chart" },
    { key: "bulanan", label: "Bulanan", icon: "list" },
  ];

  /* ─── Export CSV ─── */
  const exportCSV = () => {
    const esc = (v) => {
      const s = String(v ?? "");
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    let totalMasuk = 0, totalKeluar = 0, totalTransaksi = 0;
    dates.forEach(tgl => {
      const c = calc(tgl);
      totalMasuk += c.totalMasuk ?? 0;
      totalKeluar += c.totalKeluar ?? 0;
      totalTransaksi += c.transaksi?.length ?? 0;
    });

    const lines = [];
    lines.push([esc("Aplikasi"), esc("Kasapp")].join(","));
    lines.push([esc("Tanggal Export"), esc(new Date().toLocaleString("id-ID"))].join(","));
    lines.push([esc("Total Transaksi"), totalTransaksi].join(","));
    lines.push([esc("Total Pemasukan"), totalMasuk].join(","));
    lines.push([esc("Total Pengeluaran"), totalKeluar].join(","));
    lines.push([esc("Saldo Bersih"), totalMasuk - totalKeluar].join(","));
    lines.push("");
    lines.push([esc("Tanggal"), esc("Tipe"), esc("Metode"), esc("Kategori"), esc("Catatan"), esc("Jumlah")].join(","));
    dates.forEach(tgl => {
      const c = calc(tgl);
      c.transaksi?.forEach(t => {
        lines.push([
          esc(tgl), esc(t.type === "masuk" ? "Pemasukan" : "Pengeluaran"),
          esc(t.metode?.toUpperCase() || "-"), esc(t.kategori || "-"),
          esc(t.catatan || "-"), t.jumlah,
        ].join(","));
      });
    });

    const csv = "\uFEFF" + lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kasapp-laporan-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ─── Weekly aggregation ─── */
  const renderMingguan = () => {
    const weeks = {};
    dates.forEach(tgl => {
      const date = new Date(tgl + "T00:00:00");
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(date.setDate(diff));
      const weekKey = monday.toISOString().split("T")[0];
      if (!weeks[weekKey]) weeks[weekKey] = [];
      weeks[weekKey].push(tgl);
    });

    const weekKeys = Object.keys(weeks).sort((a, b) => b.localeCompare(a));
    if (weekKeys.length === 0) return <Card><p style={{ color: "var(--text-muted)", textAlign: "center", margin: "24px 0", fontSize: 14 }}>Belum ada data</p></Card>;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {weekKeys.map(weekKey => {
          const weekDates = weeks[weekKey];
          const totalMasuk = weekDates.reduce((s, tgl) => s + (calc(tgl).totalMasuk ?? 0), 0);
          const totalKeluar = weekDates.reduce((s, tgl) => s + (calc(tgl).totalKeluar ?? 0), 0);
          const endDate = new Date(weekKey + "T00:00:00");
          endDate.setDate(endDate.getDate() + 6);
          return (
            <Card key={weekKey} style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 14, fontFamily: "'Inter', sans-serif", color: "var(--text)" }}>
                    {new Date(weekKey + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" })} — {endDate.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 12 }}>{weekDates.length} hari aktif</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: "0 0 2px", color: "var(--success)", fontWeight: 700, fontSize: 13 }}>+{formatUang(totalMasuk)}</p>
                  <p style={{ margin: 0, color: "var(--danger)", fontSize: 12 }}>-{formatUang(totalKeluar)}</p>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {weekDates.map(tgl => {
                  const c = calc(tgl);
                  return (
                    <div key={tgl} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", background: "var(--input-bg)", borderRadius: 8 }}>
                      <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                        {new Date(tgl + "T00:00:00").toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
                      </span>
                      <div style={{ display: "flex", gap: 12 }}>
                        <span style={{ color: "var(--success)", fontSize: 12, fontWeight: 600 }}>+{formatUang(c.totalMasuk ?? 0)}</span>
                        <span style={{ color: "var(--danger)", fontSize: 12, fontWeight: 600 }}>-{formatUang(c.totalKeluar ?? 0)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  /* ─── Monthly aggregation ─── */
  const renderBulanan = () => {
    const months = {};
    dates.forEach(tgl => {
      const monthKey = tgl.substring(0, 7);
      if (!months[monthKey]) months[monthKey] = [];
      months[monthKey].push(tgl);
    });
    const monthKeys = Object.keys(months).sort((a, b) => b.localeCompare(a));
    if (monthKeys.length === 0) return <Card><p style={{ color: "var(--text-muted)", textAlign: "center", margin: "24px 0", fontSize: 14 }}>Belum ada data</p></Card>;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {monthKeys.map(monthKey => {
          const monthDates = months[monthKey];
          const totalMasuk = monthDates.reduce((s, tgl) => s + (calc(tgl).totalMasuk ?? 0), 0);
          const totalKeluar = monthDates.reduce((s, tgl) => s + (calc(tgl).totalKeluar ?? 0), 0);
          const saldo = totalMasuk - totalKeluar;
          const [year, month] = monthKey.split("-");
          const monthName = new Date(year, month - 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
          return (
            <Card key={monthKey} style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 15, fontFamily: "'Inter', sans-serif", color: "var(--text)" }}>{monthName}</p>
                  <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 12 }}>{monthDates.length} hari aktif</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: "0 0 2px", color: "var(--success)", fontWeight: 700, fontSize: 13 }}>+{formatUang(totalMasuk)}</p>
                  <p style={{ margin: 0, color: "var(--danger)", fontSize: 12 }}>-{formatUang(totalKeluar)}</p>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", background: saldo >= 0 ? "var(--success-subtle)" : "var(--danger-subtle)", borderRadius: 10, padding: "8px 12px" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 500 }}>Saldo Bersih</span>
                <span style={{ color: saldo >= 0 ? "var(--success)" : "var(--danger)", fontWeight: 800, fontSize: 14 }}>{formatUang(saldo)}</span>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", paddingBottom: 100 }}>
      {/* ─── Header ─── */}
      <div style={{ padding: "44px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ color: "var(--text)", fontSize: 20, fontWeight: 800, margin: 0, fontFamily: "'Inter', sans-serif" }}>
          Laporan
        </h2>
        <button onClick={exportCSV} style={{
          background: "var(--success-subtle)", border: "1px solid rgba(16,185,129,0.2)",
          borderRadius: 10, padding: "8px 14px", cursor: "pointer", color: "var(--success)",
          fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6,
          fontFamily: "'Inter', sans-serif",
        }}>
          <Icon name="download" size={14} color="var(--success)" /> Export
        </button>
      </div>

      {/* ─── Chart ─── */}
      <div style={{ padding: "0 20px" }}>
        <SimpleChart data={data} today={today} />
      </div>

      {/* ─── Tabs ─── */}
      <div style={{ padding: "0 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              padding: "7px 14px", borderRadius: 20,
              border: `1.5px solid ${activeTab === t.key ? "var(--accent)" : "var(--border)"}`,
              background: activeTab === t.key ? "var(--accent-subtle)" : "var(--surface)",
              color: activeTab === t.key ? "var(--accent)" : "var(--text-secondary)",
              fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "'Inter', sans-serif",
              transition: "all 0.15s", whiteSpace: "nowrap",
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Content ─── */}
      <div style={{ padding: "0 20px" }}>
        {activeTab === "harian" && (
          dates.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
              <p style={{ margin: "0 0 4px", fontSize: 15 }}>Belum ada data</p>
              <p style={{ margin: 0, fontSize: 13 }}>Mulai catat transaksi dari Beranda</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {dates.map(tgl => {
                const c = calc(tgl);
                return (
                  <button key={tgl} onClick={() => { setSelectedDate(tgl); setModal("laporanHarian"); }} style={{
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: 14, padding: "14px 16px", cursor: "pointer", textAlign: "left",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <div>
                      <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 14, fontFamily: "'Inter', sans-serif", color: "var(--text)" }}>
                        {tgl === today ? "Hari Ini" : new Date(tgl + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short" })}
                        {tgl === today && <Badge color="var(--accent)" style={{ marginLeft: 6 }}>Hari Ini</Badge>}
                      </p>
                      <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 12 }}>{c.transaksi?.length ?? 0} transaksi</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: "0 0 2px", color: "var(--success)", fontWeight: 700, fontSize: 13 }}>+{formatUang(c.totalMasuk ?? 0)}</p>
                      <p style={{ margin: 0, color: "var(--danger)", fontSize: 12 }}>-{formatUang(c.totalKeluar ?? 0)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )
        )}

        {activeTab === "mingguan" && renderMingguan()}
        {activeTab === "bulanan" && renderBulanan()}
      </div>

      {/* ─── Daily Detail Modal ─── */}
      <Modal show={modalOpen === "laporanHarian"} onClose={closeModal} title={`Detail — ${selectedDate}`}>
        <LaporanHarianContent data={data} selectedDate={selectedDate} calc={calc} />
      </Modal>
    </div>
  );
}
