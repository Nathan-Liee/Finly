import { useState } from "react";
import Card from "../components/Card";
import Icon from "../components/Icon";
import { formatUang } from "../utils/format";

/* ═══════════════════════════════════════════
 *  LAPORAN SCREEN — NEW LAYOUT
 *  Analytics dashboard style
 * ═══════════════════════════════════════════ */

/* ─── Enhanced Bar Chart ─── */
function AnalyticsChart({ data, today }) {
  const dates = Object.keys(data).sort().slice(-14);
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
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 16, padding: "16px", marginBottom: 16,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--text)", fontFamily: "'Inter', sans-serif" }}>
          Trend {dates.length > 7 ? "14" : "7"} Hari
        </p>
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

      {/* Bars */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80, marginBottom: 8 }}>
        {bars.map(({ tgl, masuk, keluar }) => {
          const masukH = (masuk / maxVal) * 64;
          const keluarH = (keluar / maxVal) * 64;
          const isToday = tgl === today;
          return (
            <div key={tgl} style={{ flex: 1, display: "flex", gap: 1, alignItems: "flex-end", height: 64 }}>
              <div style={{
                width: "50%", height: Math.max(masukH, 2),
                background: masuk > 0 ? "var(--success)" : "var(--border)",
                borderRadius: "3px 3px 0 0", opacity: masuk > 0 ? 1 : 0.3,
                transition: "height 0.3s",
              }} />
              <div style={{
                width: "50%", height: Math.max(keluarH, 2),
                background: keluar > 0 ? "var(--danger)" : "var(--border)",
                borderRadius: "3px 3px 0 0", opacity: keluar > 0 ? 1 : 0.3,
                transition: "height 0.3s",
              }} />
            </div>
          );
        })}
      </div>

      {/* Day labels */}
      <div style={{ display: "flex", gap: 4 }}>
        {bars.map(({ tgl }) => {
          const isToday = tgl === today;
          const d = new Date(tgl + "T00:00:00");
          return (
            <div key={tgl} style={{
              flex: 1, textAlign: "center", fontSize: 9, fontWeight: 600,
              color: isToday ? "var(--accent)" : "var(--text-muted)",
              fontFamily: "'Inter', sans-serif",
            }}>
              {d.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
 *  MAIN COMPONENT
 * ═══════════════════════════════════════════ */

export default function LaporanScreen({
  data, today, dates, calc,
  selectedDate, setSelectedDate,
  modalOpen, setModal, closeModal,
  onEditTx, onDeleteTx, onDeleteAllTx,
  onEditUangAwal,
}) {
  const [activeTab, setActiveTab] = useState("harian");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // all | masuk | keluar
  const [filterMetode, setFilterMetode] = useState("all"); // all | cash | qris

  /* ─── Search filter ─── */
  const filteredDates = searchQuery.trim()
    ? dates.filter(tgl => {
        const txs = data[tgl]?.transaksi ?? [];
        return txs.some(t =>
          (t.kategori || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.catatan || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.metode || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.type.toLowerCase().includes(searchQuery.toLowerCase())
        );
      })
    : dates;

  /* ─── Apply type/metode filter on transactions ─── */
  const filteredTx = (transaksi) => {
    if (!transaksi) return [];
    let result = transaksi;
    if (searchQuery.trim()) {
      result = result.filter(t =>
        (t.kategori || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.catatan || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.metode || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (filterType !== "all") result = result.filter(t => t.type === filterType);
    if (filterMetode !== "all") result = result.filter(t => (t.metode || "cash") === filterMetode);
    return result;
  };

  /* ─── Compute totals (respects search + filter) ─── */
  let totalMasuk = 0, totalKeluar = 0, totalTx = 0;
  filteredDates.forEach(tgl => {
    const c = calc(tgl);
    const filtered = filteredTx(c.transaksi);
    const m = filtered.filter(t => t.type === "masuk").reduce((s, t) => s + (t.jumlah || 0), 0);
    const k = filtered.filter(t => t.type === "keluar").reduce((s, t) => s + (t.jumlah || 0), 0);
    totalMasuk += m;
    totalKeluar += k;
    totalTx += filtered.length;
  });
  const saldoBersih = totalMasuk - totalKeluar;

  /* ─── Export CSV ─── */
  const exportCSV = () => {
    const esc = (v) => {
      const s = String(v ?? "");
      return /["\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [];
    lines.push([esc("Aplikasi"), esc("Kasapp")].join(","));
    lines.push([esc("Tanggal Export"), esc(new Date().toLocaleString("id-ID"))].join(","));
    lines.push([esc("Total Transaksi"), totalTx].join(","));
    lines.push([esc("Total Pemasukan"), totalMasuk].join(","));
    lines.push([esc("Total Pengeluaran"), totalKeluar].join(","));
    lines.push([esc("Saldo Bersih"), saldoBersih].join(","));
    lines.push("");
    lines.push([esc("Tanggal"), esc("Tipe"), esc("Metode"), esc("Kategori"), esc("Catatan"), esc("Jumlah")].join(","));
    filteredDates.forEach(tgl => {
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

  /* ─── Weekly ─── */
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
    if (weekKeys.length === 0) return (
      <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
        <p style={{ margin: "0 0 4px", fontSize: 15 }}>Belum ada data</p>
      </div>
    );

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {weekKeys.map(weekKey => {
          const weekDates = weeks[weekKey];
          const wMasuk = weekDates.reduce((s, tgl) => s + (calc(tgl).totalMasuk ?? 0), 0);
          const wKeluar = weekDates.reduce((s, tgl) => s + (calc(tgl).totalKeluar ?? 0), 0);
          const endDate = new Date(weekKey + "T00:00:00");
          endDate.setDate(endDate.getDate() + 6);
          return (
            <div key={weekKey} style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 14, padding: "14px 16px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 14, color: "var(--text)", fontFamily: "'Inter', sans-serif" }}>
                    {new Date(weekKey + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" })} — {endDate.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 12 }}>{weekDates.length} hari</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: "0 0 2px", color: "var(--success)", fontWeight: 700, fontSize: 13 }}>+{formatUang(wMasuk)}</p>
                  <p style={{ margin: 0, color: "var(--danger)", fontSize: 12 }}>-{formatUang(wKeluar)}</p>
                </div>
              </div>
              {/* Mini bars for the week */}
              <div style={{ display: "flex", gap: 3, height: 32, alignItems: "flex-end", marginTop: 8 }}>
                {weekDates.map(tgl => {
                  const c = calc(tgl);
                  const total = (c.totalMasuk ?? 0) + (c.totalKeluar ?? 0);
                  const maxW = Math.max(...weekDates.map(d => (calc(d).totalMasuk ?? 0) + (calc(d).totalKeluar ?? 0)), 1);
                  const h = (total / maxW) * 28;
                  return (
                    <div key={tgl} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      <div style={{
                        width: "100%", maxWidth: 20, height: Math.max(h, 3),
                        background: total > 0 ? "var(--accent)" : "var(--border)",
                        borderRadius: "3px 3px 0 0", opacity: total > 0 ? 1 : 0.2,
                      }} />
                      <span style={{ fontSize: 8, color: "var(--text-muted)", fontWeight: 600 }}>
                        {new Date(tgl + "T00:00:00").toLocaleDateString("id-ID", { weekday: "short" }).charAt(0)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /* ─── Monthly ─── */
  const renderBulanan = () => {
    const months = {};
    dates.forEach(tgl => {
      const monthKey = tgl.substring(0, 7);
      if (!months[monthKey]) months[monthKey] = [];
      months[monthKey].push(tgl);
    });
    const monthKeys = Object.keys(months).sort((a, b) => b.localeCompare(a));
    if (monthKeys.length === 0) return (
      <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
        <p style={{ margin: "0 0 4px", fontSize: 15 }}>Belum ada data</p>
      </div>
    );

    const maxMonthly = Math.max(...monthKeys.map(mk => {
      const md = months[mk];
      return md.reduce((s, tgl) => s + (calc(tgl).totalMasuk ?? 0) + (calc(tgl).totalKeluar ?? 0), 0);
    }), 1);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {monthKeys.map(monthKey => {
          const monthDates = months[monthKey];
          const mMasuk = monthDates.reduce((s, tgl) => s + (calc(tgl).totalMasuk ?? 0), 0);
          const mKeluar = monthDates.reduce((s, tgl) => s + (calc(tgl).totalKeluar ?? 0), 0);
          const mSaldo = mMasuk - mKeluar;
          const mTotal = mMasuk + mKeluar;
          const [year, month] = monthKey.split("-");
          const monthName = new Date(year, month - 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
          const progressPct = maxMonthly > 0 ? (mTotal / maxMonthly) * 100 : 0;

    const monthKat = {};
          monthDates.forEach(tgl => {
            (calc(tgl).transaksi ?? []).filter(t => t.type === "keluar").forEach(t => {
              const k = t.kategori || "Lainnya";
              monthKat[k] = (monthKat[k] || 0) + (t.jumlah || 0);
            });
          });
          const katSorted = Object.entries(monthKat).sort((a, b) => b[1] - a[1]);

          return (
            <div key={monthKey} style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 14, padding: "14px 16px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 15, color: "var(--text)", fontFamily: "'Inter', sans-serif" }}>
                    {monthName}
                  </p>
                  <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 12 }}>{monthDates.length} hari • {mTotal > 0 ? `${monthDates.reduce((s, tgl) => s + (calc(tgl).transaksi?.length ?? 0), 0)} transaksi` : "belum ada transaksi"}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: "0 0 2px", color: mSaldo >= 0 ? "var(--success)" : "var(--danger)", fontWeight: 800, fontSize: 14 }}>
                    {formatUang(mSaldo)}
                  </p>
                  <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 11 }}>saldo bersih</p>
                </div>
              </div>
              {/* Progress bar */}
              <div style={{
                height: 4, borderRadius: 2, background: "var(--border)", overflow: "hidden", marginTop: 8,
              }}>
                <div style={{
                  height: "100%", width: `${progressPct}%`, borderRadius: 2,
                  background: "var(--gradient)", transition: "width 0.3s",
                }} />
              </div>
              {/* Kategori breakdown */}
              {katSorted.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Top Kategori
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {katSorted.slice(0, 5).map(([k, v]) => (
                      <div key={k} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "4px 10px", background: "var(--input-bg)", borderRadius: 6,
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text)" }}>{k}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--danger)" }}>-{formatUang(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  /* ─── Daily detail modal ─── */
  const DailyDetail = () => {
    const tgl = selectedDate;
    if (!tgl || !data[tgl]) return null;
    const c = calc(tgl);

    return (
      <div>
        {/* Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          <div style={{
            background: "var(--success-subtle)", borderRadius: 12, padding: "12px",
          }}>
            <p style={{ color: "var(--success)", fontSize: 10, margin: "0 0 4px", fontWeight: 600 }}>Pemasukan</p>
            <p style={{ color: "var(--success)", fontSize: 16, fontWeight: 800, margin: 0 }}>{formatUang(c.totalMasuk)}</p>
          </div>
          <div style={{
            background: "var(--danger-subtle)", borderRadius: 12, padding: "12px",
          }}>
            <p style={{ color: "var(--danger)", fontSize: 10, margin: "0 0 4px", fontWeight: 600 }}>Pengeluaran</p>
            <p style={{ color: "var(--danger)", fontSize: 16, fontWeight: 800, margin: 0 }}>{formatUang(c.totalKeluar)}</p>
          </div>
        </div>

        {/* Uang awal */}
        <div style={{
          background: "var(--accent-subtle)", borderRadius: 12, padding: "10px 14px",
          display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16,
        }}>
          <span style={{ color: "var(--text-secondary)", fontSize: 12, fontWeight: 600 }}>Uang Awal</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "var(--accent)", fontWeight: 800, fontSize: 14 }}>{formatUang(c.uang_awal)}</span>
            <button onClick={(e) => { e.stopPropagation(); onEditUangAwal?.(tgl); closeModal?.(); }} style={{
              width: 24, height: 24, borderRadius: 6, border: "none",
              background: "transparent", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", fontSize: 12, opacity: 0.6,
            }}>✏️</button>
          </div>
        </div>

        {/* Kategori breakdown */}
        {(() => {
          const katMap = {};
          c.transaksi.filter(t => t.type === "keluar").forEach(t => {
            const k = t.kategori || "Lainnya";
            katMap[k] = (katMap[k] || 0) + (t.jumlah || 0);
          });
          const katEntries = Object.entries(katMap).sort((a, b) => b[1] - a[1]);
          if (katEntries.length === 0) return null;
          return (
            <div style={{ marginBottom: 12 }}>
              <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Breakdown Kategori
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {katEntries.map(([k, v]) => (
                  <div key={k} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "6px 12px", background: "var(--surface)", borderRadius: 8,
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{k}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--danger)" }}>-{formatUang(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Transactions */}
        {c.transaksi.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: "16px 0" }}>Tidak ada transaksi</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {c.transaksi.map((t, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                background: "var(--input-bg)", borderRadius: 10,
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                  background: t.type === "masuk" ? "var(--success)" : "var(--danger)",
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                    {t.type === "masuk" ? "Pemasukan" : (t.kategori || "Pengeluaran")}
                  </p>
                  <p style={{ margin: "1px 0 0", fontSize: 11, color: "var(--text-muted)" }}>
                    {t.catatan && t.catatan !== "-" ? t.catatan : (t.metode?.toUpperCase() || "")}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <p style={{
                    margin: 0, fontSize: 13, fontWeight: 800,
                    color: t.type === "masuk" ? "var(--success)" : "var(--danger)",
                  }}>
                    {t.type === "masuk" ? "+" : "-"}{formatUang(t.jumlah)}
                  </p>
                  <button onClick={(e) => { e.stopPropagation(); onEditTx?.(i, tgl); closeModal?.(); }} aria-label="Edit transaksi" style={{
                    width: 28, height: 28, borderRadius: 8, border: "none",
                    background: "var(--accent-subtle)", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginLeft: 4,
                  }}>
                    ✏️
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onDeleteTx?.(i, tgl); closeModal?.(); }} aria-label="Hapus transaksi" style={{
                    width: 28, height: 28, borderRadius: 8, border: "none",
                    background: "var(--danger-subtle)", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Saldo */}
        <div style={{
          marginTop: 16, padding: "12px 14px", borderRadius: 12,
          background: c.saldoCash >= 0 ? "var(--success-subtle)" : "var(--danger-subtle)",
          display: "flex", justifyContent: "space-between",
        }}>
          <span style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 600 }}>Saldo Akhir</span>
          <span style={{ color: c.saldoCash >= 0 ? "var(--success)" : "var(--danger)", fontWeight: 800, fontSize: 15 }}>
            {formatUang(c.saldoCash)}
          </span>
        </div>

        {/* Hapus semua transaksi di tanggal ini */}
        {c.transaksi.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Hapus semua ${c.transaksi.length} transaksi di ${new Date(tgl + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}?`)) {
                onDeleteAllTx?.(tgl);
                closeModal?.();
              }
            }}
            style={{
              marginTop: 12, width: "100%", padding: "10px 14px", borderRadius: 10,
              border: "1px solid var(--danger)", background: "transparent", color: "var(--danger)",
              fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            🗑️ Hapus Semua Transaksi
          </button>
        )}
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
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setModal("resetRange")} style={{
            background: "var(--danger-subtle)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 10, padding: "8px 14px", cursor: "pointer", color: "var(--danger)",
            fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6,
            fontFamily: "'Inter', sans-serif",
          }}>
            <Icon name="trash" size={14} color="var(--danger)" /> Reset
          </button>
          <button onClick={exportCSV} style={{
            background: "var(--success-subtle)", border: "1px solid rgba(16,185,129,0.2)",
            borderRadius: 10, padding: "8px 14px", cursor: "pointer", color: "var(--success)",
            fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6,
            fontFamily: "'Inter', sans-serif",
          }}>
            <Icon name="download" size={14} color="var(--success)" /> Export
          </button>
        </div>
      </div>

      {/* ─── Search ─── */}
      <div style={{ padding: "0 20px 12px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 14px", background: "var(--input-bg)",
          border: "1px solid var(--input-border)", borderRadius: 12,
        }}>
          <Icon name="search" size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Cari kategori, catatan, metode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1, border: "none", background: "none", outline: "none",
              fontSize: 13, color: "var(--text)", fontFamily: "'Inter', sans-serif",
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} style={{
              border: "none", background: "none", cursor: "pointer", padding: 2,
              display: "flex", alignItems: "center",
            }}>
              <Icon name="close" size={14} color="var(--text-muted)" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Filter Pills ─── */}
      <div style={{ padding: "0 20px 12px", display: "flex", gap: 8, flexWrap: "wrap" }}>
        {/* Type filter */}
        <div style={{ display: "flex", gap: 4 }}>
          {[
            { key: "all", label: "Semua" },
            { key: "masuk", label: "Masuk" },
            { key: "keluar", label: "Keluar" },
          ].map(f => (
            <button key={f.key} onClick={() => setFilterType(f.key)} style={{
              padding: "5px 12px", borderRadius: 16, border: "none",
              background: filterType === f.key ? "var(--accent)" : "var(--surface)",
              color: filterType === f.key ? "#fff" : "var(--text-secondary)",
              fontWeight: 600, fontSize: 11, cursor: "pointer",
              fontFamily: "'Inter', sans-serif", transition: "all 0.15s",
              border: filterType !== f.key ? "1px solid var(--border)" : "none",
            }}>
              {f.label}
            </button>
          ))}
        </div>
        {/* Metode filter */}
        <div style={{ display: "flex", gap: 4 }}>
          {[
            { key: "all", label: "Semua" },
            { key: "cash", label: "Cash" },
            { key: "qris", label: "QRIS" },
          ].map(f => (
            <button key={f.key} onClick={() => setFilterMetode(f.key)} style={{
              padding: "5px 12px", borderRadius: 16, border: "none",
              background: filterMetode === f.key ? "var(--accent)" : "var(--surface)",
              color: filterMetode === f.key ? "#fff" : "var(--text-secondary)",
              fontWeight: 600, fontSize: 11, cursor: "pointer",
              fontFamily: "'Inter', sans-serif", transition: "all 0.15s",
              border: filterMetode !== f.key ? "1px solid var(--border)" : "none",
            }}>
              {f.key === "all" ? "Semua Metode" : f.label}
            </button>
          ))}
        </div>
        {searchQuery && (
          <button onClick={() => { setSearchQuery(""); setFilterType("all"); setFilterMetode("all"); }}
            style={{
              padding: "5px 12px", borderRadius: 16, border: "1px solid var(--danger-subtle)",
              background: "var(--danger-subtle)", color: "var(--danger)",
              fontWeight: 600, fontSize: 11, cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
          }}>
            Reset
          </button>
        )}
      </div>

      {/* ─── Summary Cards ─── */}
      {dates.length > 0 && (
        <div style={{ padding: "0 20px 16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 12, padding: "10px 12px", textAlign: "center",
          }}>
            <p style={{ margin: "0 0 2px", fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Masuk</p>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "var(--success)" }}>{formatUang(totalMasuk)}</p>
          </div>
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 12, padding: "10px 12px", textAlign: "center",
          }}>
            <p style={{ margin: "0 0 2px", fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Keluar</p>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "var(--danger)" }}>{formatUang(totalKeluar)}</p>
          </div>
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 12, padding: "10px 12px", textAlign: "center",
          }}>
            <p style={{ margin: "0 0 2px", fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Saldo</p>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: saldoBersih >= 0 ? "var(--accent)" : "var(--danger)" }}>
              {formatUang(saldoBersih)}
            </p>
          </div>
        </div>
      )}

      {/* ─── Chart ─── */}
      <div style={{ padding: "0 20px" }}>
        <AnalyticsChart data={data} today={today} />
      </div>

      {/* ─── Filter Tabs ─── */}
      {searchQuery.trim() && (
        <div style={{ padding: "0 20px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
            {filteredDates.length} dari {dates.length} tanggal • {totalTx} transaksi
          </span>
        </div>
      )}
      <div style={{ padding: "0 20px 16px" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { key: "harian", label: "Harian" },
            { key: "mingguan", label: "Mingguan" },
            { key: "bulanan", label: "Bulanan" },
          ].map(t => (
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
          filteredDates.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
              <p style={{ margin: "0 0 4px", fontSize: 15 }}>
                {searchQuery ? "Tidak ditemukan" : "Belum ada data"}
              </p>
              <p style={{ margin: 0, fontSize: 13 }}>
                {searchQuery ? "Coba kata kunci lain" : "Mulai catat transaksi dari Beranda"}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filteredDates.map(tgl => {
                const c = calc(tgl);
                return (
                  <button key={tgl} onClick={() => { setSelectedDate(tgl); setModal("laporanHarian"); }} style={{
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: 14, padding: "14px 16px", cursor: "pointer", textAlign: "left",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    transition: "all 0.15s",
                  }}>
                    <div>
                      <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 14, color: "var(--text)", fontFamily: "'Inter', sans-serif" }}>
                        {tgl === today ? "Hari Ini" : new Date(tgl + "T00:00:00").toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
                      </p>
                      <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 12 }}>
                        {c.transaksi?.length ?? 0} transaksi
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ margin: "0 0 1px", color: "var(--success)", fontWeight: 700, fontSize: 12 }}>
                          +{formatUang(c.totalMasuk ?? 0)}
                        </p>
                        <p style={{ margin: 0, color: "var(--danger)", fontSize: 11 }}>
                          -{formatUang(c.totalKeluar ?? 0)}
                        </p>
                      </div>
                      <Icon name="chevronRight" size={16} color="var(--text-muted)" />
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
      {modalOpen === "laporanHarian" && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 2000,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }} onClick={closeModal}>
          <div style={{
            background: "var(--bg)", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 440,
            maxHeight: "80vh", overflow: "auto", padding: "20px",
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--text)", fontFamily: "'Inter', sans-serif" }}>
                Detail — {selectedDate === today ? "Hari Ini" : new Date(selectedDate + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
              </h3>
              <button onClick={closeModal} style={{
                width: 32, height: 32, borderRadius: 10, border: "none",
                background: "var(--surface)", cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center",
              }}>
                <Icon name="close" size={16} color="var(--text-muted)" />
              </button>
            </div>
            <DailyDetail />
          </div>
        </div>
      )}
    </div>
  );
}
