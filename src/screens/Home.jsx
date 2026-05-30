import { useState } from "react";
import Card from "../components/Card";
import Icon from "../components/Icon";
import { formatHari, formatUang } from "../utils/format";
import { getDisplayName } from "../utils/storage";
import TransaksiRow from "../components/TransaksiRow";

/* ─── Smart Daily Report ─── */
function SmartDailyReport({ todayCalc, today }) {
  const { totalMasuk, totalKeluar, saldoCash, transaksi, kategoriMap } = todayCalc;
  const jmlTransaksi = transaksi?.length ?? 0;

  if (jmlTransaksi === 0) return null;

  // Generate smart insights
  const insights = [];

  if (totalMasuk > 0 && totalKeluar > 0) {
    const profit = totalMasuk - totalKeluar;
    const margin = totalMasuk > 0 ? ((profit / totalMasuk) * 100).toFixed(0) : 0;
    insights.push(
      profit >= 0
        ? `📈 Profit hari ini ${formatUang(profit)} (margin ${margin}%)`
        : `📉 Defisit ${formatUang(Math.abs(profit))} — pengeluaran melebihi pemasukan`
    );
  }

  if (totalMasuk > 0) {
    insights.push(`💰 Pemasukan ${formatUang(totalMasuk)} dari ${transaksi?.filter(t => t.type === "masuk").length ?? 0} transaksi`);
  }

  // Top kategori pengeluaran
  if (kategoriMap && Object.keys(kategoriMap).length > 0) {
    const topKategori = Object.entries(kategoriMap).sort((a, b) => b[1] - a[1])[0];
    insights.push(`🏷️ Pengeluaran terbesar: ${topKategori[0]} (${formatUang(topKategori[1])})`);
  }

  if (jmlTransaksi >= 5) {
    insights.push(`🔥 ${jmlTransaksi} transaksi hari ini — hari yang sibuk!`);
  }

  return (
    <Card style={{ marginBottom: 20, border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Icon name="chart" size={18} color="#6366F1" />
        <p style={{ color: "#6366F1", fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", margin: 0 }}>
          Smart Daily Report
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {insights.map((insight, i) => (
          <p key={i} style={{ color: "#ccc", fontSize: 12, margin: 0, lineHeight: 1.5 }}>{insight}</p>
        ))}
      </div>
    </Card>
  );
}

function MiniGrafik({ data, today }) {
  const [expanded, setExpanded] = useState(false);

  // Ambil 7 hari terakhir
  const days = Object.keys(data)
    .sort((a, b) => a.localeCompare(b))
    .slice(-7);

  if (days.length === 0) return null;

  const masukData = days.map(tgl => {
    const t = data[tgl]?.transaksi ?? [];
    return t.filter(x => x.type === "masuk").reduce((s, x) => s + x.jumlah, 0);
  });
  const keluarData = days.map(tgl => {
    const t = data[tgl]?.transaksi ?? [];
    return t.filter(x => x.type === "keluar").reduce((s, x) => s + x.jumlah, 0);
  });

  const maxVal = Math.max(...masukData, ...keluarData, 1);
  const H = expanded ? 120 : 48;
  const W = 260;
  const barW = Math.floor((W - (days.length - 1) * 4) / days.length / 2);

  return (
    <div style={{ position: "absolute", top: 16, right: 16 }}>
      <div style={{
        background: "rgba(0,0,0,0.25)",
        borderRadius: 14,
        padding: expanded ? "10px 12px" : "6px 10px",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.1)",
        transition: "all 0.3s ease",
        width: expanded ? W + 24 : 80,
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: expanded ? 8 : 0 }}>
          {expanded && (
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: 600, margin: 0, letterSpacing: 0.5 }}>
              7 HARI TERAKHIR
            </p>
          )}
          <button onClick={() => setExpanded(!expanded)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", padding: 0, marginLeft: "auto" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              {expanded
                ? <><polyline points="18 15 12 9 6 15"/></>
                : <><polyline points="6 9 12 15 18 9"/></>
              }
            </svg>
          </button>
        </div>

        {/* Grafik bar */}
        <svg width={expanded ? W : 64} height={H} style={{ display: "block", transition: "all 0.3s" }}>
          {days.map((tgl, i) => {
            const totalW = expanded ? W : 64;
            const bW = Math.floor((totalW - (days.length - 1) * 3) / days.length / 2);
            const x = i * (bW * 2 + 3);
            const hMasuk = Math.max(2, (masukData[i] / maxVal) * H * 0.9);
            const hKeluar = Math.max(2, (keluarData[i] / maxVal) * H * 0.9);
            const isToday = tgl === today;

            return (
              <g key={tgl}>
                {/* Bar masuk */}
                <rect
                  x={x} y={H - hMasuk}
                  width={bW} height={hMasuk}
                  rx="2"
                  fill={isToday ? "#10B981" : "rgba(16,185,129,0.5)"}
                />
                {/* Bar keluar */}
                <rect
                  x={x + bW + 1} y={H - hKeluar}
                  width={bW} height={hKeluar}
                  rx="2"
                  fill={isToday ? "#EF4444" : "rgba(239,68,68,0.5)"}
                />
              </g>
            );
          })}
        </svg>

        {/* Legend saat expanded */}
        {expanded && (
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: "#10B981" }}/>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>Masuk</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: "#EF4444" }}/>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}>Keluar</span>
            </div>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginLeft: "auto" }}>
              {formatUang(masukData[masukData.length - 1])} hari ini
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomeScreen({ data, today, todayCalc, setModal, setTab, profile, user }) {
  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg,#7C3AED 0%,#4F46E5 60%,#2563EB 100%)",
        borderRadius: "0 0 32px 32px",
        padding: "48px 20px 32px",
        marginBottom: 20,
        position: "relative",
      }}>
        <MiniGrafik data={data} today={today} />

        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 4px" }}>
          Halo, {getDisplayName(profile, user)}
        </p>
        <h1 style={{ color: "#fff", fontSize: 28, fontFamily: "'Sora', sans-serif", fontWeight: 800, margin: "0 0 4px" }}>
          {formatUang(todayCalc.saldoCash ?? 0)}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, margin: "0 0 20px" }}>
          {formatHari(today)}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            { label: "Cash Masuk", val: todayCalc.totalCash ?? 0,   color: "#10B981" },
            { label: "QRIS Masuk", val: todayCalc.totalQris ?? 0,   color: "#06B6D4" },
            { label: "Keluar",     val: todayCalc.totalKeluar ?? 0, color: "#F59E0B" },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 14, padding: "10px 12px" }}>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: 600, margin: "0 0 4px", letterSpacing: 0.5 }}>{label}</p>
              <p style={{ color, fontSize: 13, fontWeight: 700, margin: 0 }}>{formatUang(val)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Smart Daily Report */}
      <div style={{ padding: "0 16px" }}>
        <SmartDailyReport todayCalc={todayCalc} today={today} />
        <p style={{ color: "#6366F1", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>
          Ringkasan Saldo
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Cash Fisik",   val: todayCalc.saldoCash ?? 0,      color: "#10B981" },
            { label: "Total Sistem", val: todayCalc.saldoTotal ?? 0,     color: "#6366F1" },
            { label: "Tanpa Gaji",   val: todayCalc.saldoTanpaGaji ?? 0, color: "#F59E0B" },
          ].map(({ label, val, color }) => (
            <Card key={label}>
              <p style={{ color: "#6b6b88", fontSize: 11, fontWeight: 600, margin: "0 0 6px", letterSpacing: 0.5 }}>{label}</p>
              <p style={{ color, fontSize: 15, fontWeight: 700, margin: 0 }}>{formatUang(val)}</p>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <p style={{ color: "#6366F1", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>
          Aksi Cepat
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          <button onClick={() => setModal("masuk")} style={{ background: "linear-gradient(135deg,#059669,#047857)", border: "none", borderRadius: 16, padding: "16px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, color: "#fff" }}>
            <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: 8 }}><Icon name="plus" size={18} /></div>
            <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14 }}>Pemasukan</span>
          </button>
          <button onClick={() => setModal("keluar")} style={{ background: "linear-gradient(135deg,#DC2626,#B91C1C)", border: "none", borderRadius: 16, padding: "16px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, color: "#fff" }}>
            <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 10, padding: 8 }}><Icon name="minus" size={18} /></div>
            <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 14 }}>Pengeluaran</span>
          </button>
        </div>

        {/* Transaksi Hari Ini */}
        <p style={{ color: "#6366F1", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>
          Transaksi Hari Ini
        </p>
        {(data[today]?.transaksi?.length ?? 0) === 0 ? (
          <Card>
            <p style={{ color: "#555577", textAlign: "center", margin: "16px 0", fontSize: 14 }}>Belum ada transaksi</p>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[...data[today].transaksi].reverse().slice(0, 5).map((t, i) => (
              <TransaksiRow key={i} t={t} />
            ))}
            {data[today].transaksi.length > 5 && (
              <button onClick={() => setTab("riwayat")} style={{ background: "none", border: "1px solid rgba(99,102,241,0.4)", borderRadius: 12, color: "#6366F1", padding: "10px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                Lihat semua ({data[today].transaksi.length} transaksi)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}