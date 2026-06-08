import { useState } from "react";
import { formatUang } from "../utils/format";
import Icon from "./Icon";

/* ─── Goal Card ─── */
function GoalCard({ goal, onEdit, onDelete, saldo }) {
  const currentAmount = saldo || 0;
  const target = goal.target || 0;
  const pct = target > 0 ? Math.min((currentAmount / target) * 100, 100) : 0;
  const remaining = Math.max(target - currentAmount, 0);
  const achieved = currentAmount >= target;

  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 14, padding: "14px 16px", marginBottom: 10,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", fontFamily: "'Inter', sans-serif" }}>
          {goal.name}
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => onEdit(goal)} style={{
            width: 28, height: 28, borderRadius: 8, border: "none",
            background: "var(--accent-subtle)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 8, boxSizing: "content-box",
          }}>
            <Icon name="edit" size={12} color="var(--accent)" />
          </button>
          <button onClick={() => onDelete(goal)} style={{
            width: 28, height: 28, borderRadius: 8, border: "none",
            background: "var(--danger-subtle)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 8, boxSizing: "content-box",
          }}>
            <Icon name="trash" size={12} color="var(--danger)" />
          </button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'Inter', sans-serif" }}>
          Target: {formatUang(target)}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 700,
          color: achieved ? "var(--success)" : "var(--accent)",
          fontFamily: "'Inter', sans-serif",
        }}>
          {pct.toFixed(1)}%
        </span>
      </div>

      <div style={{
        height: 8, borderRadius: 4, background: "var(--border)", overflow: "hidden", marginBottom: 6,
      }}>
        <div style={{
          height: "100%", width: `${pct}%`, borderRadius: 4,
          background: achieved ? "var(--success)" : pct > 80 ? "var(--warning)" : "var(--accent)",
          transition: "width 0.3s",
        }} />
      </div>

      <div style={{
        display: "flex", justifyContent: "space-between",
        fontSize: 11, color: "var(--text-muted)", fontFamily: "'Inter', sans-serif",
      }}>
        <span>Terkumpul: {formatUang(Math.min(currentAmount, target))}</span>
        <span>Sisa: {formatUang(remaining)}</span>
      </div>

      {goal.periode && (
        <div style={{ marginTop: 6, fontSize: 10, color: "var(--text-muted)" }}>
          Periode: {
            goal.periode === "monthly" ? "Bulanan" :
            goal.periode === "yearly" ? "Tahunan" :
            goal.targetDate ? `Target ${goal.targetDate}` : "Kustom"
          }
        </div>
      )}
    </div>
  );
}

export default function GoalManager({ goals, onUpdateGoals, saldo }) {
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [periode, setPeriode] = useState("monthly");
  const [targetDate, setTargetDate] = useState("");

  const openAddForm = () => {
    setEditGoal(null);
    setName("");
    setTarget("");
    setPeriode("monthly");
    setTargetDate("");
    setShowForm(true);
  };

  const openEditForm = (goal) => {
    setEditGoal(goal);
    setName(goal.name);
    setTarget(String(goal.target || ""));
    setPeriode(goal.periode || "monthly");
    setTargetDate(goal.targetDate || "");
    setShowForm(true);
  };

  const handleSave = () => {
    if (!name.trim() || !target) return;
    const numericTarget = parseInt(target, 10) || 0;
    if (numericTarget <= 0) return;
    const newGoal = {
      id: editGoal?.id || "goal_" + Date.now(),
      name: name.trim(),
      target: numericTarget,
      periode,
      targetDate: periode === "custom" ? targetDate : "",
      createdAt: editGoal?.createdAt || new Date().toISOString().split("T")[0],
    };
    if (editGoal) {
      onUpdateGoals(goals.map(g => g.id === editGoal.id ? newGoal : g));
    } else {
      onUpdateGoals([...goals, newGoal]);
    }
    setShowForm(false);
  };

  const handleDelete = (goal) => {
    if (window.confirm(`Hapus goal "${goal.name}"?`)) {
      onUpdateGoals(goals.filter(g => g.id !== goal.id));
    }
  };

  const currentAmount = saldo || 0;
  const achievedCount = goals.filter(g => currentAmount >= (g.target || 0)).length;

  return (
    <div>
      {/* Summary */}
      {goals.length > 0 && (
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16,
        }}>
          <div style={{
            background: "var(--input-bg)", borderRadius: 12, padding: "12px", textAlign: "center",
          }}>
            <p style={{
              margin: "0 0 4px", fontSize: 10, color: "var(--text-muted)",
              fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5,
            }}>
              Total Goal
            </p>
            <p style={{
              margin: 0, fontSize: 16, fontWeight: 800,
              color: "var(--text)", fontFamily: "'Inter', sans-serif",
            }}>
              {goals.length}
            </p>
          </div>
          <div style={{
            background: "var(--input-bg)", borderRadius: 12, padding: "12px", textAlign: "center",
          }}>
            <p style={{
              margin: "0 0 4px", fontSize: 10, color: "var(--text-muted)",
              fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5,
            }}>
              Tercapai
            </p>
            <p style={{
              margin: 0, fontSize: 16, fontWeight: 800,
              color: "var(--success)", fontFamily: "'Inter', sans-serif",
            }}>
              {achievedCount}/{goals.length}
            </p>
          </div>
        </div>
      )}

      {/* List */}
      {goals.length === 0 ? (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, background: "var(--accent-subtle)",
            display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px",
          }}>
            <Icon name="dollarSign" size={22} color="var(--accent)" />
          </div>
          <p style={{
            margin: "0 0 4px", fontSize: 14, fontWeight: 700,
            color: "var(--text)", fontFamily: "'Inter', sans-serif",
          }}>
            Belum ada Goal
          </p>
          <p style={{
            margin: "0 0 16px", fontSize: 12,
            color: "var(--text-muted)", fontFamily: "'Inter', sans-serif",
          }}>
            Buat target tabung pertamamu!
          </p>
        </div>
      ) : (
        <div>
          {goals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={openEditForm}
              onDelete={handleDelete}
              saldo={saldo}
            />
          ))}
        </div>
      )}

      {/* Add button */}
      <button onClick={openAddForm} style={{
        width: "100%", padding: "12px", borderRadius: 12, border: "1px dashed var(--border)",
        background: "var(--surface)", color: "var(--accent)", fontSize: 13, fontWeight: 600,
        cursor: "pointer", fontFamily: "'Inter', sans-serif", marginTop: 8,
      }}>
        + Tambah Goal Baru
      </button>

      {/* Add/Edit Form Modal — nested, uses high z-index */}
      {showForm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 3000,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }} onClick={() => setShowForm(false)}>
          <div style={{
            width: "100%", maxWidth: 440, background: "var(--surface)",
            borderRadius: "20px 20px 0 0", padding: "24px 20px 32px",
            maxHeight: "90vh", overflowY: "auto",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{
                margin: 0, fontSize: 18, fontWeight: 800,
                color: "var(--text)", fontFamily: "'Inter', sans-serif",
              }}>
                {editGoal ? "Edit Goal" : "Tambah Goal Baru"}
              </h3>
              <button onClick={() => setShowForm(false)} style={{
                width: 32, height: 32, borderRadius: 10, border: "none",
                background: "var(--input-bg)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name="close" size={16} color="var(--text-secondary)" />
              </button>
            </div>

            {/* Nama Goal */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: "block", marginBottom: 6,
                fontSize: 12, fontWeight: 700, color: "var(--text-muted)",
              }}>
                Nama Goal
              </label>
              <input value={name} onChange={e => setName(e.target.value)}
                placeholder="Contoh: Beli Motor, Liburan, dll"
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 12,
                  border: "1px solid var(--border)", background: "var(--input-bg)",
                  color: "var(--text)", fontSize: 14, fontFamily: "'Inter', sans-serif", outline: "none",
                }} />
            </div>

            {/* Target Amount */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: "block", marginBottom: 6,
                fontSize: 12, fontWeight: 700, color: "var(--text-muted)",
              }}>
                Target (Rp)
              </label>
              <input type="text" inputMode="numeric"
                value={target} onChange={e => setTarget(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="0"
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 12,
                  border: "1px solid var(--border)", background: "var(--input-bg)",
                  color: "var(--text)", fontSize: 14, fontFamily: "'Inter', sans-serif", outline: "none",
                }} />
            </div>

            {/* Periode */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: "block", marginBottom: 6,
                fontSize: 12, fontWeight: 700, color: "var(--text-muted)",
              }}>
                Periode
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { value: "monthly", label: "Bulanan" },
                  { value: "yearly", label: "Tahunan" },
                  { value: "custom", label: "Kustom" },
                ].map(p => (
                  <button key={p.value} onClick={() => setPeriode(p.value)} style={{
                    flex: 1, padding: "10px", borderRadius: 10,
                    border: `2px solid ${periode === p.value ? "var(--accent)" : "var(--border)"}`,
                    background: periode === p.value ? "var(--accent-subtle)" : "var(--surface)",
                    color: periode === p.value ? "var(--accent)" : "var(--text-secondary)",
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Date for custom */}
            {periode === "custom" && (
              <div style={{ marginBottom: 16 }}>
                <label style={{
                  display: "block", marginBottom: 6,
                  fontSize: 12, fontWeight: 700, color: "var(--text-muted)",
                }}>
                  Target Tanggal
                </label>
                <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 12,
                    border: "1px solid var(--border)", background: "var(--input-bg)",
                    color: "var(--text)", fontSize: 14, fontFamily: "'Inter', sans-serif", outline: "none",
                  }} />
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowForm(false)} style={{
                flex: 1, padding: "14px", borderRadius: 14, border: "1px solid var(--border)",
                background: "var(--surface)", color: "var(--text)", fontWeight: 700,
                fontSize: 14, cursor: "pointer", fontFamily: "'Inter', sans-serif",
              }}>
                Batal
              </button>
              <button onClick={handleSave} style={{
                flex: 1, padding: "14px", borderRadius: 14, border: "none",
                background: "var(--accent)", color: "#fff", fontWeight: 700,
                fontSize: 14, cursor: "pointer", fontFamily: "'Inter', sans-serif",
                opacity: (!name.trim() || !target || parseInt(target, 10) <= 0) ? 0.5 : 1,
              }}>
                {editGoal ? "Simpan" : "Tambah"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
