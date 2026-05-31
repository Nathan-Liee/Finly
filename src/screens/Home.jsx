import Card from "../components/Card";
import Icon from "../components/Icon";
import { formatUang } from "../utils/format";
import { getDisplayName } from "../utils/storage";

/* ─── Aggregate Analytics ─── */
function calcAggregate(data) {
  if (!data || typeof data !== "object") {
    return { totalMasuk: 0, totalKeluar: 0, saldoBersih: 0, hariAktif: 0 };
  }
  let totalMasuk = 0, totalKeluar = 0, hariAktif = 0;
  Object.keys(data).forEach(tgl => {
    const dayData = data[tgl];
    const transaksi = dayData?.transaksi ?? [];
    if (transaksi.length === 0 && !dayData?.uang_awal) return;
    hariAktif++;
    transaksi.forEach(t => {
      if (t.type === "masuk") totalMasuk += t.jumlah ?? 0;
      else totalKeluar += t.jumlah ?? 0;
    });
  });
  return { totalMasuk, totalKeluar, saldoBersih: totalMasuk - totalKeluar, hariAktif };
}

/* ═══════════════════════════════════════════
 *  HOME SCREEN
 * ═══════════════════════════════════════════ */
export default function HomeScreen({ data, today, todayCalc, setModal, setTab, profile, user }) {
  const saldo = todayCalc.saldoCash ?? 0;
  const todayTransaksi = data[today]?.transaksi ?? [];
  const agg = calcAggregate(data);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Pagi";
    if (h < 15) return "Siang";
    if (h < 18) return "Sore";
    return "Malam";
  })();

  const displayName = getDisplayName(profile, user);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", paddingBottom: 100 }}>
      {/* ─── Header ─── */}
      <div style={{ padding: "44px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ color: "var(--text-muted)", fontSize: 13, fontWeight: 500, margin: "0 0 2px", fontFamily: "'Inter', sans-serif" }}>
            Selamat {greeting}!
          </p>
          <h2 style={{ color: "var(--text)", fontSize: 20, fontWeight: 800, margin: 0, fontFamily: "'Inter', sans-serif" }}>
            {displayName}
          </h2>
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: "var(--gradient)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 12px rgba(107, 126, 255, 0.25)",
        }}>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 17, fontFamily: "'Inter', sans-serif" }}>
            {displayName[0].toUpperCase()}
          </span>
        </div>
      </div>

      {/* ─── Balance Card ─── */}
      <div style={{ padding: "0 20px 20px" }}>
        <div style={{
          background: "var(--gradient)",
          borderRadius: 24,
          padding: "24px 22px",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: -40, right: -20,
            width: 130, height: 130, borderRadius: "50%",
            background: "rgba(255,255,255,0.08)", pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", bottom: -30, left: -20,
            width: 90, height: 90, borderRadius: "50%",
            background: "rgba(255,255,255,0.05)", pointerEvents: "none",
          }} />

          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 500, margin: "0 0 6px", fontFamily: "'Inter', sans-serif", position: "relative" }}>
            Saldo Saat Ini
          </p>
          <h1 style={{
            color: "#fff", fontSize: 34, fontWeight: 800, margin: "0 0 20px",
            fontFamily: "'Inter', sans-serif", letterSpacing: -0.5, position: "relative",
          }}>
            {formatUang(saldo)}
          </h1>

          <div style={{ display: "flex", gap: 10, position: "relative" }}>
            <button onClick={() => setModal("masuk")} style={{
              flex: 1, background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14,
              padding: "12px", cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 6, color: "#fff", fontSize: 13, fontWeight: 700,
              fontFamily: "'Inter', sans-serif",
            }}>
              <Icon name="plus" size={16} color="#fff" /> Pemasukan
            </button>
            <button onClick={() => setModal("keluar")} style={{
              flex: 1, background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14,
              padding: "12px", cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 6, color: "#fff", fontSize: 13, fontWeight: 700,
              fontFamily: "'Inter', sans-serif",
            }}>
              <Icon name="minus" size={16} color="#fff" /> Pengeluaran
            </button>
          </div>
        </div>
      </div>

      {/* ─── Quick Stats ─── */}
      <div style={{ padding: "0 20px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12, background: "var(--success-subtle)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Icon name="trendingUp" size={18} color="var(--success)" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)", fontWeight: 500, fontFamily: "'Inter', sans-serif" }}>Masuk Hari Ini</p>
              <p style={{ margin: "2px 0 0", fontSize: 15, fontWeight: 800, color: "var(--success)", fontFamily: "'Inter', sans-serif" }}>
                {formatUang(todayCalc.totalMasuk ?? 0)}
              </p>
            </div>
          </div>
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12, background: "var(--danger-subtle)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Icon name="trendingDown" size={18} color="var(--danger)" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)", fontWeight: 500, fontFamily: "'Inter', sans-serif" }}>Keluar Hari Ini</p>
              <p style={{ margin: "2px 0 0", fontSize: 15, fontWeight: 800, color: "var(--danger)", fontFamily: "'Inter', sans-serif" }}>
                {formatUang(todayCalc.totalKeluar ?? 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Aggregate Summary ─── */}
      {agg.hariAktif > 0 && (
        <div style={{ padding: "0 20px 20px" }}>
          <Card style={{ padding: "14px 16px", display: "flex", justifyContent: "space-around" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Semua Waktu</p>
              <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 800, color: "var(--text)", fontFamily: "'Inter', sans-serif" }}>
                {formatUang(agg.saldoBersih)}
              </p>
            </div>
            <div style={{ width: 1, background: "var(--border)" }} />
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Hari Aktif</p>
              <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 800, color: "var(--accent)", fontFamily: "'Inter', sans-serif" }}>{agg.hariAktif}</p>
            </div>
          </Card>
        </div>
      )}

      {/* ─── Recent Transactions ─── */}
      <div style={{ padding: "0 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <p style={{ color: "var(--text)", fontSize: 16, fontWeight: 800, margin: 0, fontFamily: "'Inter', sans-serif" }}>
            Transaksi Hari Ini
          </p>
          <button onClick={() => setTab("laporan")} style={{
            background: "none", border: "none", color: "var(--accent)",
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif",
          }}>
            Lihat Semua →
          </button>
        </div>

        {todayTransaksi.length === 0 ? (
          <Card style={{ textAlign: "center", padding: "36px 20px" }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16, background: "var(--accent-subtle)",
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px",
            }}>
              <Icon name="wallet" size={24} color="var(--accent)" />
            </div>
            <p style={{ color: "var(--text)", fontSize: 14, fontWeight: 700, margin: "0 0 4px", fontFamily: "'Inter', sans-serif" }}>
              Belum ada transaksi
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: 12, margin: 0, fontFamily: "'Inter', sans-serif" }}>
              Tekan tombol + untuk menambah pemasukan
            </p>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[...todayTransaksi].reverse().map((t, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 14px", background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: 14,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 12,
                  background: t.type === "masuk" ? "var(--success-subtle)" : "var(--danger-subtle)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Icon
                    name={t.type === "masuk" ? "arrowDown" : "arrowUp"}
                    size={16}
                    color={t.type === "masuk" ? "var(--success)" : "var(--danger)"}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text)", fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {t.type === "masuk" ? "Pemasukan" : (t.kategori || "Pengeluaran")}
                  </p>
                  <p style={{ margin: "1px 0 0", fontSize: 11, color: "var(--text-muted)", fontFamily: "'Inter', sans-serif" }}>
                    {t.catatan && t.catatan !== "-" ? t.catatan : (t.metode ? t.metode.toUpperCase() : "")}
                  </p>
                </div>
                <p style={{
                  margin: 0, fontSize: 14, fontWeight: 800,
                  color: t.type === "masuk" ? "var(--success)" : "var(--danger)",
                  fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap",
                }}>
                  {t.type === "masuk" ? "+" : "-"}{formatUang(t.jumlah)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
