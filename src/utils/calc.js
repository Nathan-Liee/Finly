export function calcHarian(dayData) {
  if (!dayData) return {
    uang_awal: 0, totalCash: 0, totalQris: 0, totalMasuk: 0,
    gaji: 0, nonGaji: 0, totalKeluar: 0,
    keluarCash: 0, keluarQris: 0,
    saldoCash: 0, saldoTotal: 0, saldoTanpaGaji: 0,
    transaksi: [], kategoriMap: {},
  };

  const { uang_awal = 0, transaksi = [] } = dayData;

  const totalCash = transaksi
    .filter((t) => t.type === "masuk" && t.metode === "cash")
    .reduce((s, t) => s + (t.jumlah || 0), 0);

  const totalQris = transaksi
    .filter((t) => t.type === "masuk" && t.metode === "qris")
    .reduce((s, t) => s + (t.jumlah || 0), 0);

  const totalMasuk = totalCash + totalQris;

  const gaji = transaksi
    .filter((t) => t.type === "keluar" && t.kategori?.toLowerCase().includes("gaji"))
    .reduce((s, t) => s + (t.jumlah || 0), 0);

  const nonGaji = transaksi
    .filter((t) => t.type === "keluar" && !t.kategori?.toLowerCase().includes("gaji"))
    .reduce((s, t) => s + (t.jumlah || 0), 0);

  const totalKeluar = gaji + nonGaji;

  const keluarCash = transaksi
    .filter((t) => t.type === "keluar" && (!t.metode || t.metode === "cash"))
    .reduce((s, t) => s + (t.jumlah || 0), 0);

  const keluarQris = transaksi
    .filter((t) => t.type === "keluar" && t.metode === "qris")
    .reduce((s, t) => s + (t.jumlah || 0), 0);

  const saldoCash = uang_awal + totalCash - keluarCash;
  const saldoTotal = saldoCash + totalQris - keluarQris;
  const saldoTanpaGaji = uang_awal + totalCash - nonGaji;

  const kategoriMap = {};
  transaksi
    .filter((t) => t.type === "keluar")
    .forEach((t) => {
      const k = t.kategori || "Lainnya";
      kategoriMap[k] = (kategoriMap[k] || 0) + (t.jumlah || 0);
    });

  return {
    uang_awal, totalCash, totalQris, totalMasuk,
    gaji, nonGaji, totalKeluar,
    keluarCash, keluarQris,
    saldoCash, saldoTotal, saldoTanpaGaji,
    transaksi, kategoriMap,
  };
}
