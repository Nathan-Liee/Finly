import { useState } from "react";

const TAG_COLORS = [
  "#FF6B6B", "#FFA94D", "#FFD43B", "#69DB7C",
  "#38D9A9", "#4DABF7", "#748FFC", "#DA77F2",
  "#F06595", "#845EF7", "#20C997", "#FF922B",
];

export default function TagManager({ tagList, onUpdateTag, data }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(TAG_COLORS[0]);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (tagList.some(t => t.name === trimmed)) return;
    const newTag = {
      id: "tag_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      name: trimmed,
      color: newColor,
    };
    onUpdateTag([...tagList, newTag]);
    setNewName("");
    setNewColor(TAG_COLORS[0]);
    setShowAdd(false);
  };

  const handleDelete = (id) => {
    const updated = tagList.filter(t => t.id !== id);
    onUpdateTag(updated);
  };

  const handleEdit = (id) => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    if (tagList.some(t => t.name === trimmed && t.id !== id)) return;
    const updated = tagList.map(t => t.id === id ? { ...t, name: trimmed, color: editColor } : t);
    onUpdateTag(updated);
    setEditId(null);
  };

  const txCount = (tagId) => {
    if (!data) return 0;
    let count = 0;
    Object.keys(data).forEach(tgl => {
      (data[tgl]?.transaksi ?? []).forEach(t => {
        if (t.tag === tagId) count++;
      });
    });
    return count;
  };

  return (
    <>
      <p style={{
        margin: "0 0 6px", paddingLeft: 16,
        color: "var(--text-muted)", fontSize: 11, fontWeight: 700,
        letterSpacing: 0.8, textTransform: "uppercase",
      }}>Label / Tag</p>
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 16, overflow: "hidden", margin: "0 20px 16px",
      }}>
        {tagList.length === 0 && !showAdd && (
          <div style={{ padding: "16px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>
              Belum ada tag. Buat tag untuk mengelompokkan transaksi.
            </p>
          </div>
        )}
        {tagList.map((t, i) => (
          <div key={t.id}>
            {i > 0 && <div style={{ height: 1, background: "var(--border)", margin: "0 16px" }} />}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px" }}>
              {editId === t.id ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <input value={editName} onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleEdit(t.id); }}
                    placeholder="Nama tag"
                    style={{
                      width: "100%", padding: "8px 12px", borderRadius: 8,
                      border: "1px solid var(--border)", background: "var(--input-bg)",
                      color: "var(--text)", fontSize: 13, fontFamily: "'Inter', sans-serif",
                      outline: "none", boxSizing: "border-box",
                    }} />
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    {TAG_COLORS.map(c => (
                      <button key={c} onClick={() => setEditColor(c)} style={{
                        width: 28, height: 28, borderRadius: "50%", border: editColor === c ? "2px solid var(--text)" : "2px solid transparent",
                        background: c, cursor: "pointer", padding: 0, flexShrink: 0,
                      }} />
                    ))}
                    <button onClick={() => handleEdit(t.id)} style={{
                      padding: "6px 10px", borderRadius: 6, border: "none",
                      background: "var(--accent)", color: "#fff", fontSize: 11,
                      fontWeight: 700, cursor: "pointer",
                    }}>Simpan</button>
                    <button onClick={() => setEditId(null)} style={{
                      padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)",
                      background: "var(--surface)", color: "var(--text-secondary)", fontSize: 11,
                      fontWeight: 600, cursor: "pointer",
                    }}>Batal</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{
                    width: 12, height: 12, borderRadius: "50%", flexShrink: 0,
                    background: t.color,
                  }} />
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{t.name}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: "var(--text-muted)",
                    background: "var(--input-bg)", padding: "2px 8px", borderRadius: 6,
                  }}>
                    {txCount(t.id)}x
                  </span>
                  <button onClick={() => { setEditId(t.id); setEditName(t.name); setEditColor(t.color); }} style={{
                    width: 28, height: 28, borderRadius: 8, border: "none",
                    background: "var(--accent-subtle)", cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: 12,
                  }}>✏️</button>
                  <button onClick={() => handleDelete(t.id)} style={{
                    width: 28, height: 28, borderRadius: 8, border: "none",
                    background: "var(--danger-subtle)", cursor: "pointer", display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: 12,
                  }}>🗑️</button>
                </>
              )}
            </div>
          </div>
        ))}
        {showAdd ? (
          <div style={{ padding: "10px 16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <input value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
                placeholder="Nama tag baru"
                style={{
                  width: "100%", padding: "8px 12px", borderRadius: 8,
                  border: "1px solid var(--border)", background: "var(--input-bg)",
                  color: "var(--text)", fontSize: 13, fontFamily: "'Inter', sans-serif",
                  outline: "none", boxSizing: "border-box",
                }} />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                {TAG_COLORS.map(c => (
                  <button key={c} onClick={() => setNewColor(c)} style={{
                    width: 28, height: 28, borderRadius: "50%",
                    border: newColor === c ? "3px solid var(--text)" : "2px solid transparent",
                    background: c, cursor: "pointer", padding: 0, flexShrink: 0,
                  }} />
                ))}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={handleAdd} style={{
                  flex: 1, padding: "8px", borderRadius: 8, border: "none",
                  background: "var(--success)", color: "#fff", fontSize: 12,
                  fontWeight: 700, cursor: "pointer",
                }}>Tambah</button>
                <button onClick={() => setShowAdd(false)} style={{
                  padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border)",
                  background: "var(--surface)", color: "var(--text-secondary)", fontSize: 12,
                  fontWeight: 600, cursor: "pointer",
                }}>Batal</button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: "10px 16px" }}>
            <button onClick={() => setShowAdd(true)} style={{
              width: "100%", padding: "10px", borderRadius: 10, border: "1px dashed var(--border)",
              background: "var(--surface)", color: "var(--accent)", fontSize: 13,
              fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif",
            }}>
              + Tambah Tag
            </button>
          </div>
        )}
      </div>
    </>
  );
}
