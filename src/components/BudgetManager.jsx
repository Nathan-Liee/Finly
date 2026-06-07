import { useState } from "react";
import { formatUang } from "../utils/format";

/* ─── Budget row per kategori ─── */
function BudgetKatRow({ kat, currentAmount, spentAmount, rollover, onSave, onToggleRollover }) {
  const [katInput, setKatInput] = useState(String(currentAmount || ""));

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
      <span style={{ minWidth: 80, fontSize: 11, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{kat}</span>
      <input type="text" inputMode="numeric" placeholder="0"
        value={katInput}
        onChange={(e) => setKatInput(e.target.value.replace(/[^0-9]/g, ""))}
        style={{
          flex: 1, padding: "6px 10px", borderRadius: 8,
          border: "1px solid var(--border)", background: "var(--input-bg)",
          color: "var(--text)", fontSize: 12, fontWeight: 600, outline: "none",
          fontFamily: "'Inter', sans-serif",
        }} />
      <button onClick={() => onSave(parseInt(katInput, 10) || 0)} style={{
        padding: "6px 12px", borderRadius: 8, border: "none",
        background: "var(--accent)", color: "#fff", fontSize: 11,
        fontWeight: 700, cursor: "pointer",
      }}>Simpan</button>
      {currentAmount > 0 && (
        <span style={{ fontSize: 10, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
          {formatUang(spentAmount)} / {formatUang(currentAmount)}
        </span>
      )}
      {/* Rollover toggle */}
      <button
        onClick={onToggleRollover}
        title={rollover ? "Rollover aktif: sisa budget akan pindah ke bulan depan" : "Rollover nonaktif"}
        style={{
          padding: "4px 8px", borderRadius: 6, border: "none",
          background: rollover ? "var(--success-subtle)" : "var(--input-bg)",
          color: rollover ? "var(--success)" : "var(--text-muted)",
          fontSize: 10, fontWeight: 700, cursor: "pointer",
          whiteSpace: "nowrap",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {rollover ? "⏪ Aktif" : "Rollover"}
      </button>
    </div>
  );
}

export default function BudgetManager({ budgetMap, onUpdateBudget, onToggleRollover, kategoriList, data }) {
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const budgetData = budgetMap[currentMonthKey] ?? {};

  const [budgetInput, setBudgetInput] = useState(String(typeof budgetData === 'object' ? (budgetData._total || '') : ''));
  const [budgetSaved, setBudgetSaved] = useState(false);

  const currentTotalBudget = typeof budgetData === 'object' ? (budgetData._total || 0) : 0;

  // Compute current spending per kategori
  const spentMap = {};
  Object.keys(data).forEach(tgl => {
    if (tgl.startsWith(currentMonthKey)) {
      (data[tgl]?.transaksi ?? []).forEach(t => {
        if (t.type === 'keluar') {
          const k = t.kategori || 'Lainnya';
          spentMap[k] = (spentMap[k] || 0) + (t.jumlah || 0);
        }
      });
    }
  });

  const handleSaveTotal = () => {
    const amount = parseInt(budgetInput, 10) || 0;
    onUpdateBudget(currentMonthKey, null, amount);
    setBudgetSaved(true);
  };

  const handleSaveKat = (kat, amount) => {
    onUpdateBudget(currentMonthKey, kat, amount);
    setBudgetSaved(true);
  };

  const handleToggleRollover = (kat) => {
    onToggleRollover(currentMonthKey, kat);
  };

  return (
    <>
      <p style={{
        margin: "0 0 6px", paddingLeft: 16,
        color: "var(--text-muted)", fontSize: 11, fontWeight: 700,
        letterSpacing: 0.8, textTransform: "uppercase",
      }}>Budget Bulanan</p>
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 16, overflow: "hidden", margin: "0 20px 16px",
      }}>
        <div style={{ padding: "12px 16px" }}>
          <p style={{ margin: "0 0 10px", fontSize: 13, color: "var(--text-muted)" }}>
            Set budget pengeluaran untuk bulan ini. Bisa total atau per kategori.
          </p>
          {/* Total budget */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap" }}>Total Rp</span>
            <input
              type="text" inputMode="numeric" placeholder="0"
              value={budgetInput}
              onChange={(e) => { setBudgetInput(e.target.value.replace(/[^0-9]/g, "")); setBudgetSaved(false); }}
              style={{
                flex: 1, padding: "10px 14px", borderRadius: 10,
                border: "1.5px solid var(--border)", background: "var(--input-bg)",
                color: "var(--text)", fontSize: 14, fontWeight: 600, outline: "none",
                fontFamily: "'Inter', sans-serif",
              }}
            />
            <button onClick={handleSaveTotal} style={{
              padding: "10px 18px", borderRadius: 10, border: "none",
              background: "var(--accent)", color: "#fff",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap",
            }}>
              Simpan
            </button>
          </div>
          {budgetSaved && (
            <p style={{ margin: "0 0 8px", fontSize: 12, color: "var(--success)", fontWeight: 600 }}>
              ✓ Budget disimpan
            </p>
          )}
          {currentTotalBudget > 0 && !budgetSaved && (
            <p style={{ margin: "0 0 8px", fontSize: 12, color: "var(--text-muted)" }}>
              Budget total: <strong style={{ color: "var(--text)" }}>{formatUang(currentTotalBudget)}</strong>
            </p>
          )}

          {/* Per-kategori budgets */}
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "var(--text)" }}>
              Budget Per Kategori
            </p>
            {kategoriList.filter(k => k !== 'Lainnya').map(kat => {
              const katBudget = typeof budgetData === 'object' ? (budgetData[kat]?.amount || 0) : 0;
              const katRollover = typeof budgetData === 'object' ? (budgetData[kat]?.rollover || false) : false;
              const katSpent = spentMap[kat] || 0;
              return (
                <BudgetKatRow
                  key={kat}
                  kat={kat}
                  currentAmount={katBudget}
                  spentAmount={katSpent}
                  rollover={katRollover}
                  onSave={(amount) => handleSaveKat(kat, amount)}
                  onToggleRollover={() => handleToggleRollover(kat)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
