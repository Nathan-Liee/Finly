export function formatUang(n) {
  return "Rp " + Number(n ?? 0).toLocaleString("id-ID");
}

export function formatAngka(str) {
  // Hapus semua titik terlebih dahulu
  const cleaned = String(str ?? "").replace(/\./g, "");
  // Pastikan hanya angka
  const onlyNumbers = cleaned.replace(/[^0-9]/g, "");
  // Format dengan separator ribuan
  return onlyNumbers.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function formatHari(tanggal) {
  const date = new Date(tanggal + 'T00:00:00');
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}