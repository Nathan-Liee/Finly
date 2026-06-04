/**
 * Edit transaksi lintas tanggal — utilitas untuk edit transaksi
 * di tanggal manapun, bukan cuma hari ini.
 */
import { supabase } from "./supabase";

/**
 * Update transaksi di tanggal tertentu
 * @param {string} tanggal - Format YYYY-MM-DD
 * @param {number} idx - Index transaksi di array
 * @param {object} updates - { jumlah, metode, kategori, catatan }
 * @param {object} data - State data saat ini
 * @param {function} setData - React setState
 */
export async function editTransaksi(tanggal, idx, updates, data, setData) {
  const d = { ...data };
  const t = d[tanggal]?.transaksi?.[idx];
  if (!t) throw new Error("Transaksi tidak ditemukan");

  const updatedTx = d[tanggal].transaksi.map((item, i) =>
    i === idx ? { ...item, ...updates } : item
  );
  d[tanggal].transaksi = updatedTx;
  setData(d);
}

/**
 * Hapus transaksi di tanggal tertentu
 */
export async function deleteTransaksi(tanggal, idx, data, setData) {
  const d = { ...data };
  if (!d[tanggal]?.transaksi) return;
  d[tanggal].transaksi = d[tanggal].transaksi.filter((_, i) => i !== idx);
  setData(d);
}
