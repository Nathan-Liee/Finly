import { useRef, useState } from "react";
import Icon from "./Icon";

const MAX_ATTACHMENTS = 3;
const MAX_WIDTH = 800;
const JPEG_QUALITY = 0.6;

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        if (w > MAX_WIDTH) {
          h = Math.round((h / w) * MAX_WIDTH);
          w = MAX_WIDTH;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas 2D context not available")); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function AttachmentUpload({ value = [], onChange }) {
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const remaining = MAX_ATTACHMENTS - value.length;
    if (remaining <= 0) return;
    setLoading(true);
    try {
      const items = [];
      for (let i = 0; i < Math.min(files.length, remaining); i++) {
        try {
          const dataUrl = await compressImage(files[i]);
          items.push({ id: Date.now() + '-' + Math.random() + '-' + Math.random(), dataUrl });
        } catch (err) {
          console.warn("Gagal kompres gambar:", err);
        }
      }
      onChange([...value, ...items]);
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeAttachment = (id) => {
    const next = value.filter(a => a.id !== id);
    onChange(next);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        color: "var(--text-secondary)", fontSize: 12, fontWeight: 600,
        letterSpacing: 0.5, display: "block", marginBottom: 8,
      }}>
        Lampiran / Bukti Transaksi
      </label>

      {/* Preview existing attachments */}
      {value.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          {value.map(att => (
            <div key={att.id} style={{
              position: "relative", width: 72, height: 72, borderRadius: 10,
              overflow: "hidden", border: "1px solid var(--border)", flexShrink: 0,
            }}>
              <img
                src={att.dataUrl}
                alt="Lampiran"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                style={{
                  position: "absolute", top: 2, right: 2, width: 20, height: 20,
                  borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.6)",
                  cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", padding: 0,
                }}
                aria-label="Hapus lampiran"
              >
                <Icon name="close" size={12} color="#fff" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {value.length < MAX_ATTACHMENTS && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "10px 14px", borderRadius: 10,
            border: "1px dashed var(--border)", background: "var(--input-bg)",
            cursor: loading ? "not-allowed" : "pointer", width: "100%",
            fontSize: 13, fontWeight: 600, color: "var(--text-secondary)",
            fontFamily: "'Inter', sans-serif", opacity: loading ? 0.6 : 1,
            justifyContent: "center",
          }}
        >
          <span style={{ display: "inline-flex" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </span>
          {loading ? "Memproses..." : `Ambil Foto / Pilih Gambar (${value.length}/${MAX_ATTACHMENTS})`}
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFile}
        style={{ display: "none" }}
      />

      {value.length >= MAX_ATTACHMENTS && (
        <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--text-muted)" }}>
          Maksimal {MAX_ATTACHMENTS} lampiran
        </p>
      )}
    </div>
  );
}
