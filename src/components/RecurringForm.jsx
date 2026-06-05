import { useState } from "react";
import Modal  from "./Modal";
import Btn   from "./Button";
import Field from "./Field";
import { formatAngka } from "../utils/format";

export default function RecurringForm({ show, onClose, kategoriList, addRecurringRule, showToast }) {
  const [recFrequency, setRecFrequency] = useState("monthly");
  const [recDayOfWeek, setRecDayOfWeek] = useState(1);
  const [recDayOfMonth, setRecDayOfMonth] = useState(1);
  const [recType, setRecType] = useState("keluar");
  const [recJumlah, setRecJumlah] = useState("");
  const [recMetode, setRecMetode] = useState("cash");
  const [recKategori, setRecKategori] = useState("");
  const [recCatatan, setRecCatatan] = useState("");
  const [recSaved, setRecSaved] = useState(false);

  const handleRecSave = () => {
    const n = parseInt(recJumlah.replace(/\./g, ""));
    if (!n || n <= 0) return showToast("Jumlah harus lebih dari 0!", "error");
    if (recType === "keluar" && !recKategori) return showToast("Pilih kategori!", "error");
    const rule = {
      frequency: recFrequency,
      type: recType,
      jumlah: n,
      metode: recMetode,
      kategori: recType === "keluar" ? recKategori : "",
      catatan: recCatatan || "-",
    };
    if (recFrequency === "weekly") rule.dayOfWeek = recDayOfWeek;
    if (recFrequency === "monthly") rule.dayOfMonth = recDayOfMonth;
    addRecurringRule(rule);
    setRecSaved(true);
    setTimeout(() => { onClose(); setRecSaved(false); }, 1000);
    showToast("Aturan berulang ditambahkan!", "success");
  };

  return (
    <Modal show={show} onClose={onClose} title="Transaksi Berulang">
      <div>
        {/* Tipe */}
        <label style={{ color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 8 }}>Tipe</label>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {["masuk", "keluar"].map(m => (
            <button key={m} onClick={() => setRecType(m)} style={{
              flex: 1, padding: "10px", borderRadius: 10,
              border: `2px solid ${recType === m ? "var(--accent)" : "var(--border)"}`,
              background: recType === m ? "var(--accent-subtle)" : "var(--surface)",
              color: recType === m ? "var(--accent)" : "var(--text-secondary)",
              fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Inter', sans-serif",
            }}>
              {m === "masuk" ? "Pemasukan" : "Pengeluaran"}
            </button>
          ))}
        </div>

        {/* Jumlah */}
        <Field label="Jumlah" value={recJumlah} onChange={(v) => setRecJumlah(formatAngka(v ?? ""))} type="number" placeholder="0" prefix="Rp" />

        {/* Metode */}
        <label style={{ color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 8 }}>Metode</label>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {["cash", "qris"].map(m => (
            <button key={m} onClick={() => setRecMetode(m)} style={{
              flex: 1, padding: "10px", borderRadius: 10,
              border: `2px solid ${recMetode === m ? "var(--accent)" : "var(--border)"}`,
              background: recMetode === m ? "var(--accent-subtle)" : "var(--surface)",
              color: recMetode === m ? "var(--accent)" : "var(--text-secondary)",
              fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Inter', sans-serif",
            }}>
              {m.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Kategori (only for keluar) */}
        {recType === "keluar" && (
          <>
            <label style={{ color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 8 }}>Kategori</label>
            <select value={recKategori} onChange={(e) => setRecKategori(e.target.value)}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                border: "1px solid var(--border)", background: "var(--input-bg)",
                color: recKategori ? "var(--text)" : "var(--text-muted)",
                fontSize: 13, fontFamily: "'Inter', sans-serif", outline: "none", marginBottom: 16,
              }}>
              <option value="">Pilih kategori</option>
              {kategoriList.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </>
        )}

        {/* Frekuensi */}
        <label style={{ color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 8 }}>Frekuensi</label>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {[
            { key: "daily", label: "Harian" },
            { key: "weekly", label: "Mingguan" },
            { key: "monthly", label: "Bulanan" },
          ].map(f => (
            <button key={f.key} onClick={() => setRecFrequency(f.key)} style={{
              flex: 1, padding: "10px", borderRadius: 10,
              border: `2px solid ${recFrequency === f.key ? "var(--accent)" : "var(--border)"}`,
              background: recFrequency === f.key ? "var(--accent-subtle)" : "var(--surface)",
              color: recFrequency === f.key ? "var(--accent)" : "var(--text-secondary)",
              fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Inter', sans-serif",
            }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Day pickers */}
        {recFrequency === "weekly" && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 8 }}>Hari</label>
            <select value={recDayOfWeek} onChange={(e) => setRecDayOfWeek(Number(e.target.value))}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                border: "1px solid var(--border)", background: "var(--input-bg)",
                color: "var(--text)", fontSize: 13, fontFamily: "'Inter', sans-serif", outline: "none",
              }}>
              {["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((d, i) => (
                <option key={i} value={i}>{d}</option>
              ))}
            </select>
          </div>
        )}
        {recFrequency === "monthly" && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: "var(--text-secondary)", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 8 }}>Tanggal (1-31)</label>
            <input type="number" min={1} max={31} value={recDayOfMonth} onChange={(e) => setRecDayOfMonth(Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                border: "1px solid var(--border)", background: "var(--input-bg)",
                color: "var(--text)", fontSize: 13, fontFamily: "'Inter', sans-serif", outline: "none",
              }} />
          </div>
        )}

        {/* Catatan */}
        <Field label="Catatan (opsional)" value={recCatatan} onChange={setRecCatatan} placeholder="Auto-generated if empty" />

        {/* Save */}
        <div style={{ marginTop: 16 }}>
          <Btn onClick={handleRecSave} icon="check" fullWidth>
            {recSaved ? "✓ Disimpan!" : "Simpan Aturan Berulang"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
