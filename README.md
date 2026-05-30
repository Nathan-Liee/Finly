# Kasapp

Aplikasi kas online sederhana untuk membantu bisnis keluarga, toko kecil, UMKM mikro, dan penggunaan pribadi dalam mencatat pemasukan, pengeluaran, saldo, dan laporan harian — tanpa spreadsheet.

---

## Preview

<p align="center">
<img src="./assets/Dashboard.png" width="250">
<img src="./assets/Transaction.png" width="250">
<img src="./assets/Report.png" width="250">
</p>

**Live Demo:** https://kas-app-mauve.vercel.app/

---

## Features

- Multi-user authentication (email + password)
- Email confirmation flow via link (bukan OTP kode angka)
- Record income transactions (Cash & QRIS)
- Record expense transactions with categorization
- Initial balance (uang awal) management per day
- Daily, weekly, and monthly financial reports
- Smart daily insights & mini bar chart on dashboard
- User-based secure database access using Row Level Security (RLS)
- Responsive web interface
- Android build support using Capacitor

---

## Tech Stack

**Frontend**
- React
- Vite

**Backend & Database**
- Supabase
- PostgreSQL
- Supabase Auth
- Row Level Security (RLS)

**Deployment**
- Vercel

**Mobile**
- Capacitor
- Android APK support

**Version Control**
- Git
- GitHub

---

## Architecture

```
User
  ↓
React Frontend (Vite)
  ↓
Supabase Client (@supabase/supabase-js)
  ↓
Supabase API
  ↓
PostgreSQL Database
```

Row Level Security (RLS) aktif pada setiap tabel, memastikan setiap user hanya bisa membaca, menulis, dan mengelola data miliknya sendiri. Tidak ada user yang bisa mengakses data user lain.

---

## Database Design

Tabel utama yang digunakan:

| Tabel | Deskripsi |
|-------|-----------|
| `profiles` | Menyimpan data profil user (username, email). Terhubung ke Supabase Auth via user ID. |
| `transaksi` | Menyimpan semua record pemasukan dan pengeluaran per user. |
| `uang_awal` | Menyimpan saldo awal (cash) per hari per user. |

Semua tabel menggunakan kolom `user_id` yang merujuk ke `auth.users.id` dan dilindungi oleh RLS policies.

---

## Installation

```bash
git clone https://github.com/Nathan-Liee/kas-toko.git
cd kas-toko
npm install
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173`.

---

## Environment Variables

Buat file `.env` atau `.env.local` di root project:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
```

> **Warning:** Do **NOT** expose Supabase secret key or service role key in the frontend. Hanya gunakan publishable/anon key di sisi client.

---

## Deployment

Aplikasi dideploy ke Vercel. Pastikan environment variable berikut dipasang di Vercel project settings:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Setiap push ke branch `main` akan otomatis trigger deployment di Vercel.

---

## Roadmap

### ✅ Completed
- Multi-user authentication
- Email confirmation flow
- Username / profile display fix
- Transaction recording (income & expense)
- Cash and QRIS transaction support
- Expense categorization
- Initial balance management
- Daily, weekly, and monthly reports
- Smart daily insights
- Secure database access with RLS
- Web deployment (Vercel)
- Android build support (Capacitor)

### 🔜 Next
- Edit and reset transaction
- Transaction filtering & search
- Dashboard analytics & charts
- Data export (CSV / PDF)
- Offline mode with IndexedDB
- Auto sync when back online

---

## Use Case

Kasapp cocok untuk:
- 🏪 Family businesses — pencatatan kas harian untuk usaha keluarga
- 🛒 Small shops — toko kelontong, warung, kios
- 📦 Micro SMEs — UMKM yang butuh pencatatan sederhana
- 👤 Personal cash tracking — catatan keuangan pribadi
- 📋 Simple daily financial recording — alternatif spreadsheet yang lebih praktis

---

## Author

**Nathan Liee**
GitHub: https://github.com/Nathan-Liee
