# <p align="center"><img src="./public/logo.png" width="120" alt="Finly Logo"/><br/>Finly</p>

<p align="center">
  <strong>Finly</strong> — aplikasi kas PWA untuk UMKM mikro, toko kecil, bisnis keluarga, dan penggunaan pribadi.
</p>

<p align="center">
  <a href="https://finly-mauve.vercel.app">🌐 Live Demo</a> ·
  <a href="./KANBAN.md">📋 Kanban Board</a> ·
  <a href="#-changelog">📝 Changelog</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" />
</p>

---

## 📊 Stats

| | |
|---|---|
| **Version** | v1.16.0 |
| **Live** | [finly-mauve.vercel.app](https://finly-mauve.vercel.app) |
| **Build** | ![Build](https://img.shields.io/badge/build-passing-brightgreen) |
| **License** | ![License](https://img.shields.io/badge/license-MIT-blue) |

---

## ✨ Fitur

- 🔐 **Multi-user Authentication** — Login via email, data terpisah per pengguna.
- 📥📤 **Pemasukan & Pengeluaran** — Catat arus kas harian dengan kategori dan catatan.
- 💵 **Cash & QRIS** — Tracking metode pembayaran: tunai atau QRIS.
- 💰 **Saldo Awal** — Mulai pencatatan dari saldo awal yang Anda tentukan.
- 📊 **Dashboard** — Ringkasan saldo, grafik pemasukan vs pengeluaran, spending trend.
- 📅 **Laporan** — Rekap harian, mingguan, dan bulanan dengan filter rentang tanggal dan jenis transaksi.
- ✏️ **Edit Transaksi** — Ubah atau hapus transaksi dari tanggal kapan pun.
- 🎨 **Dark Mode** — Toggle tema gelap/terang.
- 🖥️ **Desktop Layout** — Sidebar navigasi, multi-column untuk layar lebar.
- ⌨️ **Keyboard Shortcuts** — `N` tambah transaksi, `ESC` tutup modal.
- 📁 **Export CSV** — Unduh laporan dalam format CSV.
- 📱 **PWA** — Install sebagai aplikasi di HP/desktop, offline support.
- 🔄 **Auto-sync** — Data tetap aman meski offline, sync saat online.
- 📈 **Dashboard Analytics** — Ringkasan semua waktu: total masuk, keluar, saldo bersih.
- 💬 **Keluhan & Masukan** — Kirim bug report atau saran fitur langsung dari aplikasi.
- 🔒 **Data Aman** — Row Level Security menjaga data setiap user tetap terpisah.
## 📸 Preview

Pengguna dapat mengirim laporan bug, keluhan, atau saran fitur melalui form **Keluhan & Masukan** di dalam aplikasi. Feedback tersimpan di Supabase dan ditinjau secara internal oleh developer.

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Frontend** | React, Vite |
| **Backend** | Supabase (PostgreSQL, Auth, RLS) |
| **Deployment** | Vercel |

## 🗄️ Database

Finly menggunakan Supabase PostgreSQL dengan Row Level Security untuk menjaga data setiap user tetap terpisah.

Core tables:
- `profiles` — Data profil user
- `transaksi` — Pemasukan & pengeluaran
- `uang_awal` — Saldo awal per tanggal
- `feedback` — Laporan bug & saran user

## 📦 Instalasi Lokal

```bash
git clone https://github.com/Nathan-Liee/Finly.git
cd Finly
npm install
npm run dev
```

## 📋 Changelog

> Changelog otomatis diperbarui setiap hari oleh AI agent.
### 2026-06-08 (v1.16.0)
- ⏳ Loading skeleton — animated pulse placeholders di Home saat load
- 📸 Lampiran foto/bukti transaksi — upload via camera/gallery, compress ke base64
- 🎯 Goal/tabung — target nominal per periode (bulanan/tahunan/kustom) dengan progress bar
- 💫 Dark mode polish — smooth CSS transitions, improved contrast
- 🖥️ Sidebar collapsible — toggle tombol di desktop, mode 64px collapsed
- 🎨 Scrollbar styling — thin, themed scrollbar di seluruh app
- 🏷️ Label/tag kustom — buat tag, filter transaksi by tag di Home & Laporan
- ⏪ Budget rollover — sisa budget bulan lalu pindah ke bulan ini (toggle per kategori)
- 🔔 Notifikasi reminder — browser notification untuk recurring transactions (atur jam)
### 2026-06-05 (v1.14.0)
- 🖥️ Desktop mode — responsive sidebar navigasi (≥768px)
- 📄 Export PDF (jsPDF) + Excel (xlsx) langsung dari Laporan
- 🎯 Multi-budget per kategori — set budget tiap kategori di Pengaturan
- 🔁 Recurring transactions — aturan harian/mingguan/bulanan auto-apply
- 💾 Data backup & restore — modal preview dengan merge/overwrite
- 📱 PWA — improved service worker (3-tier caching), install prompt, icon 192/512
- 🔧 Code audit — version sync, unused imports cleanup

### 2026-06-04
- 🖥️ Desktop responsive layout + sidebar navigasi
- 🎨 Dark mode toggle
- 📊 Grafik dashboard pemasukan vs pengeluaran
- ⌨️ Keyboard shortcuts (N=add, ESC=close)
- 🔍 Bundle splitting (lazy load per screen)
- 🔒 Hapus admin.deleteUser dari client — diganti hubungi admin
- 🔒 .env dilindungi .gitignore
- 💰 Fix saldoCash calculation — bedain cash vs qris expenses
- 📊 CSV injection protection
- 🎨 Google Fonts pindah ke index.html (render blocking fix)
- ♿ Aria labels + modal accessibility
- 🔔 Toast queue (gak tumpuk-tumpuk)

### 2026-06-04 (lanjutan 2)
- 🎯 Budget bulanan — set budget di Pengaturan, progress bar di Home (warna hijau/kuning/merah)
- 📊 Kategori usage count di Pengaturan
- 📈 Breakdown kategori di detail harian & bulanan (top 5)
- ✏️ Edit uang awal lintas tanggal dari Laporan detail
- 🗑️ Hapus semua transaksi per tanggal dari Laporan detail
- 📁 Export CSV sekarang respect filter aktif
- 🔢 Info bar filter count (X dari Y tanggal • Z transaksi)
- 🔄 Scroll to top saat ganti tab/filter di Laporan

---

<p align="center">
  Dibuat dengan ❤️ | Finly v1.16.0
</p>
