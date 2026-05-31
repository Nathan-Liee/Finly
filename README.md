# Kasapp 💰

Manajemen kas harian yang **sederhana, cepat, dan modern** — untuk bisnis keluarga, toko kecil, UMKM mikro, dan penggunaan pribadi. Catat pemasukan, pengeluaran, saldo, dan laporan harian tanpa spreadsheet.

---

## Preview

### ☀️ Light Mode

<p align="center">
  <img src="./assets/screenshots/home-light.png" width="250" alt="Home Light">
  &nbsp;&nbsp;
  <img src="./assets/screenshots/report-light.png" width="250" alt="Report Light">
  &nbsp;&nbsp;
  <img src="./assets/screenshots/settings-light.png" width="250" alt="Settings Light">
</p>

### 🌙 Dark Mode

<p align="center">
  <img src="./assets/screenshots/home-dark.png" width="250" alt="Home Dark">
  &nbsp;&nbsp;
  <img src="./assets/screenshots/report-dark.png" width="250" alt="Report Dark">
  &nbsp;&nbsp;
  <img src="./assets/screenshots/settings-dark.png" width="250" alt="Settings Dark">
</p>

> 📸 Ganti screenshot di `assets/screenshots/` dengan foto asli dari dev browser / HP kamu.

**Live Demo:** https://kas-app-mauve.vercel.app/

---

## ✨ Fitur

- 🔐 **Multi-user auth** — email + password, konfirmasi via link
- 💵 **Catat pemasukan** — metode Cash & QRIS
- 📉 **Catat pengeluaran** — dengan kategori otomatis
- 🏦 **Uang awal** — kelola saldo awal per hari
- 📊 **Laporan** — harian, mingguan, bulanan + export CSV
- 📈 **Chart 7 hari** — visual trend pemasukan/pengeluaran
- 🌙 **Dark Mode** — toggle di Pengaturan, tersimpan otomatis
- 🎨 **UI modern** — font Inter, spacing konsisten, micro-interactions
- 📱 **Responsive** — works di desktop, tablet, mobile
- 🔒 **RLS** — setiap user hanya bisa akses data sendiri
- 📲 **Capacitor** — support build Android APK

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Frontend** | React 19, Vite 8 |
| **Styling** | CSS Custom Properties, Design System |
| **Font** | Inter (Google Fonts) |
| **Backend** | Supabase (Auth + PostgreSQL) |
| **Security** | Row Level Security (RLS) |
| **Deployment** | Vercel |
| **Mobile** | Capacitor (Android APK) |

---

## 🏗️ Architecture

```
User
  ↓
React Frontend (Vite + Inter Font)
  ↓
Supabase Client (@supabase/supabase-js)
  ↓
Supabase API
  ↓
PostgreSQL Database (RLS Protected)
```

---

## 📦 Installation

```bash
git clone https://github.com/Nathan-Liee/kas-app.git
cd kas-app
npm install
npm run dev
```

Aplikasi berjalan di `http://localhost:5173`.

---

## 🔑 Environment Variables

Buat file `.env` di root project:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> ⚠️ **Jangan** taruh secret key / service role key di frontend.

---

## 🚀 Deployment

Deploy ke Vercel dan set environment variable di project settings:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Setiap push ke `main` otomatis trigger deploy.

---

## 🗃️ Database

| Tabel | Deskripsi |
|-------|-----------|
| `profiles` | Data profil user (username, email) |
| `transaksi` | Record pemasukan & pengeluaran |
| `uang_awal` | Saldo awal (cash) per hari |

Semua tabel pakai `user_id` → `auth.users.id` dan dilindungi RLS.

---

## 📋 Roadmap

### ✅ Selesai
- [x] Multi-user auth + email confirmation
- [x] Transaksi pemasukan (Cash & QRIS)
- [x] Transaksi pengeluaran + kategori
- [x] Uang awal per hari
- [x] Laporan harian/mingguan/bulanan
- [x] Export CSV
- [x] Chart 7 hari
- [x] UI overhaul (Inter font, CSS variables, design system)
- [x] Dark mode toggle
- [x] Navigasi 3 tab (Home, Laporan, Pengaturan)
- [x] Responsive layout
- [x] RLS security
- [x] Vercel deployment
- [x] Capacitor Android support

### 🔜 Selanjutnya
- [ ] Edit & hapus transaksi
- [ ] Filter & search transaksi
- [ ] Offline mode (IndexedDB) + auto sync
- [ ] Export PDF
- [ ] Notifikasi / reminder harian

---

## 🎯 Use Case

Kasapp cocok untuk:

| Pengguna | Contoh |
|----------|--------|
| 🏪 Usaha keluarga | Catatan kas harian warung / toko |
| 🛒 Toko kecil | Kelontong, kios, minimarket |
| 📦 UMKM mikro | Pencatatan sederhana tanpa akuntansi berat |
| 👤 Pribadi | Track uang masuk/keluar harian |
| 📋 Alternatif spreadsheet | Lebih praktis dari Excel/Google Sheets |

---

## 👤 Author

**Nathan Liee**  
GitHub: https://github.com/Nathan-Liee
