import { useState } from "react";

export default function KategoriManager({ kategoriList, onUpdateKategori, data }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newKat, setNewKat] = useState("");
  const [editIdx, setEditIdx] = useState(null);
  const [editVal, setEditVal] = useState("");

  const handleAdd = () => {
    const trimmed = newKat.trim();
    if (!trimmed || kategoriList.includes(trimmed)) return;
    onUpdateKategori([...kategoriList, trimmed]);
    setNewKat("");
    setShowAdd(false);
  };

  const handleDelete = (idx) => {
    const updated = kategoriList.filter((_, i) => i !== idx);
    onUpdateKategori(updated);
  };

  const handleEdit = (idx) => {
    const trimmed = editVal.trim();
    if (!trimmed || kategoriList.includes(trimmed)) return;
    const updated = kategoriList.map((k, i) => i === idx ? trimmed : k);
    onUpdateKategori(updated);
    setEditIdx(null);
    setEditVal("");
  };

  return (
    <>
      <p style={{
        margin: "0 0 6px", paddingLeft: 16,
        color: "var(--text-muted)", fontSize: 11, fontWeight: 700,
        letterSpacing: 0.8, textTransform: "uppercase",
      }}>Kategori</p>
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 16, overflow: "hidden", margin: "0 20px 16px",
      }}>
        {kategoriList.map((k, i) => (
          <div key={i}>
            {i > 0 && <div style={{ height: 1, background: "var(--border)", margin: "0 16px" }} />}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px" }}>
              {editIdx === i ? (
                <div style={{ flex: 1, display: "flex", gap: 6 }}>
                  <input value={editVal} onChange={e => setEditVal(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleEdit(i); }}
                    style={{
                      flex: 1, padding: "8px 12px", borderRadius: 8,
                      border: "1px solid var(--border)", background: "var(--input-bg)",
                      color: "var(--text)", fontSize: 13, fontFamily: "'Inter', sans-serif",
                      outline: "none",
                    }} />
                  <button onClick={() => handleEdit(i)} style={{
                    padding: "8px 12px", borderRadius: 8, border: "none",
                    background: "var(--accent)", color: "#fff", fontSize: 12,
                    fontWeight: 700, cursor: "pointer",
                  }}>Simpan</button>
                  <button onClick={() => setEditIdx(null)} style={{
                    padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)",
                    background: "var(--surface)", color: "var(--text-secondary)", fontSize: 12,
                    fontWeight: 600, cursor: "pointer",
                  }}>Batal</button>
                </div>
              ) : (
                <>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{k}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: "var(--text-muted)",
                    background: "var(--input-bg)", padding: "2px 8px", borderRadius: 6,
                  }}>
                    {Object.keys(data).reduce((s, tgl) => s + (data[tgl]?.transaksi?.filter(t => t.type === "keluar" && t.kategori === k).length ?? 0), 0)}x
                  </span>
                  <button onClick={() => { setEditIdx(i); setEditVal(k); }} style={{
                    width: 28, height: 28, borderRadius: 8, border: "none",
                    background: "var(--accent-subtle)", cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: 12,
                  }}>✏️</button>
                  {k !== "Lainnya" && (
                    <button onClick={() => handleDelete(i)} style={{
                      width: 28, height: 28, borderRadius: 8, border: "none",
                      background: "var(--danger-subtle)", cursor: "pointer", display: "flex",
                      alignItems: "center", justifyContent: "center", fontSize: 12,
                    }}>🗑️</button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        {showAdd ? (
          <div style={{ padding: "10px 16px", display: "flex", gap: 6 }}>
            <input value={newKat} onChange={e => setNewKat(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
              placeholder="Nama kategori baru"
              style={{
                flex: 1, padding: "8px 12px", borderRadius: 8,
                border: "1px solid var(--border)", background: "var(--input-bg)",
                color: "var(--text)", fontSize: 13, fontFamily: "'Inter', sans-serif",
                outline: "none",
              }} />
            <button onClick={handleAdd} style={{
              padding: "8px 12px", borderRadius: 8, border: "none",
              background: "var(--success)", color: "#fff", fontSize: 12,
              fontWeight: 700, cursor: "pointer",
            }}>Tambah</button>
            <button onClick={() => setShowAdd(false)} style={{
              padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)",
              background: "var(--surface)", color: "var(--text-secondary)", fontSize: 12,
              fontWeight: 600, cursor: "pointer",
            }}>Batal</button>
          </div>
        ) : (
          <div style={{ padding: "10px 16px" }}>
            <button onClick={() => setShowAdd(true)} style={{
              width: "100%", padding: "10px", borderRadius: 10, border: "1px dashed var(--border)",
              background: "var(--surface)", color: "var(--accent)", fontSize: 13,
              fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif",
            }}>
              + Tambah Kategori
            </button>
          </div>
        )}
      </div>
    </>
  );
}
