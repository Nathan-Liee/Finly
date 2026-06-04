import { memo, useMemo } from "react";
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
const HomeScreen = memo(function HomeScreen({ data, today, todayCalc, setModal, setTab, profile, user, onEditTx, onDeleteTx, budgetMap }) {
  const saldo = todayCalc.saldoCash ?? 0;
  const todayTransaksi = data[today]?.transaksi ?? [];
  const agg = useMemo(() => calcAggregate(data), [data]);

  /* ─── Budget bulan ini ─── */
  const currentMonth = today.substring(0, 7);
  const budgetAmount = budgetMap?.[currentMonth] ?? 0;
  const spentThisMonth = useMemo(() => {
    if (!data) return 0;
    let total = 0;
    Object.keys(data).forEach(tgl => {
      if (tgl.startsWith(currentMonth)) {
        (data[tgl]?.transaksi ?? []).forEach(t => {
          if (t.type === 'keluar') total += t.jumlah ?? 0;
        });
      }
    });
    return total;
  }, [data, currentMonth]);
  const budgetPct = budgetAmount > 0 ? Math.min((spentThisMonth / budgetAmount) * 100, 100) : 0;
  const budgetOver = budgetAmount > 0 && spentThisMonth > budgetAmount;

  /* ─── Monthly Chart Data ─── */
  const monthlyData = useMemo(() => {
    if (!data || typeof data !== 'object') return [];
    const map = {};
    Object.keys(data).forEach(tgl => {
      const m = tgl.substring(0, 7);
      if (!map[m]) map[m] = { masuk: 0, keluar: 0 };
      (data[tgl]?.transaksi ?? []).forEach(t => {
        if (t.type === 'masuk') map[m].masuk += t.jumlah ?? 0;
        else map[m].keluar += t.jumlah ?? 0;
      });
    });
    return Object.keys(map).sort().slice(-8).map(m => ({ month: m, ...map[m] }));
  }, [data]);

  /* ─── Kategori Breakdown Data ─── */
  const kategoriBreakdown = useMemo(() => {
    if (!data || typeof data !== 'object') return [];
    const map = {};
    Object.keys(data).forEach(tgl => {
      (data[tgl]?.transaksi ?? []).forEach(t => {
        if (t.type === 'keluar') {
          const k = t.kategori || 'Lainnya';
          map[k] = (map[k] || 0) + (t.jumlah ?? 0);
        }
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => ({ kategori: k, jumlah: v }));
  }, [data]);

  /* ─── Net Trend Data ─── */
  const netTrend = useMemo(() => {
    if (!data || typeof data !== 'object') return { direction: 'flat', diff: 0, thisNet: 0, lastNet: 0 };
    const now = new Date();
    const ym = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const tm = ym(now);
    const lm = ym(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    let tn = 0, ln = 0;
    Object.keys(data).forEach(tgl => {
      const mm = tgl.substring(0, 7);
      let net = 0;
      (data[tgl]?.transaksi ?? []).forEach(t => {
        net += (t.type === 'masuk' ? 1 : -1) * (t.jumlah ?? 0);
      });
      if (mm === tm) tn += net;
      if (mm === lm) ln += net;
    });
    const d = tn - ln;
    return { direction: d > 0 ? 'up' : d < 0 ? 'down' : 'flat', diff: d, thisNet: tn, lastNet: ln };
  }, [data]);

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

      {/* ─── Budget Card ─── */}
      {budgetAmount > 0 && (
        <div style={{ padding: "0 20px 16px" }}>
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 16, padding: "14px 16px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>
                🎯 Budget {new Date(currentMonth + "-01T00:00:00").toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: budgetOver ? "var(--danger)" : "var(--text-muted)",
              }}>
                {formatUang(spentThisMonth)} / {formatUang(budgetAmount)}
              </span>
            </div>
            <div style={{
              height: 8, borderRadius: 4, background: "var(--border)", overflow: "hidden",
            }}>
              <div style={{
                height: "100%", width: `${budgetPct}%`, borderRadius: 4,
                background: budgetOver ? "var(--danger)" : budgetPct > 80 ? "var(--warning)" : "var(--success)",
                transition: "width 0.3s",
              }} />
            </div>
            <p style={{
              margin: "6px 0 0", fontSize: 11, color: "var(--text-muted)", fontWeight: 500,
            }}>
              {budgetOver
                ? `⚠️ Over budget ${formatUang(spentThisMonth - budgetAmount)}`
                : `${Math.round(budgetPct)}% terpakai • sisa ${formatUang(Math.max(budgetAmount - spentThisMonth, 0))}`
              }
            </p>
          </div>
        </div>
      )}

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

      {/* ─── Monthly Income/Expense Chart ─── */}
      {monthlyData.length > 0 && (
        <div style={{ padding: "0 20px 20px" }}>
          <Card style={{ padding: "16px" }}>
            <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "var(--text)", fontFamily: "'Inter', sans-serif" }}>
              Pemasukan vs Pengeluaran per Bulan
            </p>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 72 }}>
              {(() => {
                const maxVal = Math.max(...monthlyData.flatMap(m => [m.masuk, m.keluar]), 1);
                return monthlyData.map(m => {
                  const masukH = Math.max((m.masuk / maxVal) * 56, m.masuk > 0 ? 4 : 0);
                  const keluarH = Math.max((m.keluar / maxVal) * 56, m.keluar > 0 ? 4 : 0);
                  return (
                    <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                        <div style={{ width: "70%", height: masukH + "px", background: "var(--success)", borderRadius: "3px 3px 0 0" }} />
                        <div style={{ width: "70%", height: keluarH + "px", background: "var(--danger)", borderRadius: "3px 3px 0 0" }} />
                      </div>
                      <span style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "'Inter', sans-serif", marginTop: 2 }}>
                        {m.month.slice(5, 7)}/{m.month.slice(2, 4)}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: "var(--success)" }} />
                <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'Inter', sans-serif" }}>Masuk</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: "var(--danger)" }} />
                <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "'Inter', sans-serif" }}>Keluar</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ─── Net Trend Indicator ─── */}
      {monthlyData.length >= 2 && (
        <div style={{ padding: "0 20px 20px" }}>
          <Card style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: netTrend.direction === 'up' ? 'var(--success)' : netTrend.direction === 'down' ? 'var(--danger)' : 'var(--text-muted)' }}>
                {netTrend.direction === 'up' ? '\u2191' : netTrend.direction === 'down' ? '\u2193' : '\u2192'}
              </span>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)", fontWeight: 500, fontFamily: "'Inter', sans-serif" }}>
                  Tren Saldo Bersih Bulanan
                </p>
                <p style={{ margin: "1px 0 0", fontSize: 13, fontWeight: 700, color: netTrend.direction === 'up' ? 'var(--success)' : netTrend.direction === 'down' ? 'var(--danger)' : 'var(--text-muted)', fontFamily: "'Inter', sans-serif" }}>
                  {netTrend.direction === 'up' ? 'Lebih baik dari bulan lalu' : netTrend.direction === 'down' ? 'Lebih buruk dari bulan lalu' : 'Sama dengan bulan lalu'}
                </p>
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", fontFamily: "'Inter', sans-serif" }}>
              {netTrend.diff > 0 ? '+' : ''}{formatUang(netTrend.diff)}
            </span>
          </Card>
        </div>
      )}

      {/* ─── Kategori Breakdown ─── */}
      {kategoriBreakdown.length > 0 && (
        <div style={{ padding: "0 20px 20px" }}>
          <Card style={{ padding: "16px" }}>
            <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "var(--text)", fontFamily: "'Inter', sans-serif" }}>
              Kategori Breakdown (Top 5)
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(() => {
                const maxKat = Math.max(...kategoriBreakdown.map(k => k.jumlah), 1);
                return kategoriBreakdown.map(k => (
                  <div key={k.kategori}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", fontFamily: "'Inter', sans-serif" }}>{k.kategori}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", fontFamily: "'Inter', sans-serif" }}>{formatUang(k.jumlah)}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
                      <div style={{ width: ((k.jumlah / maxKat) * 100) + "%", height: "100%", background: "var(--accent)", borderRadius: 3 }} />
                    </div>
                  </div>
                ));
              })()}
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
            {[...todayTransaksi].reverse().map((t, revIdx) => {
              const realIdx = todayTransaksi.length - 1 - revIdx;
              const stableKey = `${realIdx}-${t.type}-${t.jumlah}-${t.metode || ''}-${t.kategori || ''}`;
              return (
              <div key={stableKey} style={{
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
                {(onEditTx || onDeleteTx) && (
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    {onEditTx && (
                      <button onClick={() => onEditTx(realIdx)} aria-label="Edit transaksi" style={{
                        width: 30, height: 30, borderRadius: 8, border: "none",
                        background: "var(--accent-subtle)", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Icon name="edit" size={13} color="var(--accent)" />
                      </button>
                    )}
                    {onDeleteTx && (
                      <button onClick={() => onDeleteTx(realIdx)} aria-label="Hapus transaksi" style={{
                        width: 30, height: 30, borderRadius: 8, border: "none",
                        background: "var(--danger-subtle)", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Icon name="trash" size={13} color="var(--danger)" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

export default HomeScreen;
