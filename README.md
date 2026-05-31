# <p align="center"><img src="./public/logo.png" width="120" alt="Finly Logo"/><br/>Finly</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" />
  <img src="https://img.shields.io/badge/Capacitor-119EFE?style=for-the-badge&logo=ionic&logoColor=white" />
  <img src="https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white" />
</p>

<p align="center">
  <strong>Finly</strong> — aplikasi kas sederhana untuk UMKM mikro, toko kecil, bisnis keluarga, dan penggunaan pribadi.
</p>

<p align="center">
  <strong>🌐 Live:</strong> <a href="https://finly-mauve.vercel.app">finly-mauve.vercel.app</a>
  ·
  <strong>🐙 GitHub:</strong> <a href="https://github.com/Nathan-Liee/Finly">github.com/Nathan-Liee/Finly</a>
</p>

---

## ✨ Fitur

- 🔐 **Multi-user Authentication** — Login via email dengan konfirmasi & session management.
- 👤 **Profil User** — Username & display name yang tampil di aplikasi.
- 📥 **Pencatatan Pemasukan** — Catat pemasukan dengan kategori, catatan, dan metode pembayaran.
- 📤 **Pencatatan Pengeluaran** — Kelola pengeluaran harian dengan tracking yang rapi.
- 💵 **Cash & QRIS** — Tracking metode pembayaran: tunai atau QRIS.
- 💰 **Saldo Awal** — Set saldo awal untuk memulai pencatatan dari nol.
- 📊 **Laporan** — Rekap harian, mingguan, dan bulanan dengan filter rentang tanggal.
- 📁 **Export CSV** — Unduh laporan transaksi dalam format CSV lengkap dengan ringkasan.
- 📈 **Dashboard Analytics** — Ringkasan semua waktu: total masuk, total keluar, saldo bersih, hari aktif.
- 💬 **Keluhan & Masukan** — Form feedback untuk kirim laporan bug atau saran fitur.
- 🛡️ **Admin Feedback** — Dashboard khusus admin untuk lihat & kelola feedback masuk.
- 🔒 **Supabase RLS** — Row Level Security menjamin setiap user hanya akses datanya sendiri.
- 📱 **Responsive** — Antarmuka yang nyaman di desktop dan mobile.
- 📲 **Android APK** — Aplikasi Android via Capacitor (build tersedia di GitHub Releases).

## 📸 Preview

<p align="center">
  <img src="./public/screenshots/home-mockup.png" width="300" alt="Finly Home Screen"/>
</p>

## 📲 Download Android

APK Android Finly tersedia melalui [GitHub Releases](https://github.com/Nathan-Liee/Finly/releases).

> **Catatan:** Jika belum ada release aktif, APK akan di-upload setelah proses build selesai.
> Untuk sekarang, gunakan versi web di [finly-mauve.vercel.app](https://finly-mauve.vercel.app).

## 🛠️ Tech Stack

### Frontend
| Teknologi | Fungsi |
|-----------|--------|
| [React](https://react.dev/) | UI Framework |
| [Vite](https://vitejs.dev/) | Build Tool & Dev Server |

### Backend & Database
| Teknologi | Fungsi |
|-----------|--------|
| [Supabase](https://supabase.com/) | Backend-as-a-Service |
| PostgreSQL | Database utama |
| Supabase Auth | Authentication (email/password) |
| Row Level Security | Isolasi data per user |

### Deployment
| Platform | Fungsi |
|----------|--------|
| [Vercel](https://vercel.com/) | Web hosting & CI/CD |

### Mobile
| Teknologi | Fungsi |
|-----------|--------|
| [Capacitor](https://capacitorjs.com/) | Bridge web → Android |
| Android | Native APK build |

### Version Control
| Platform | Fungsi |
|----------|--------|
| [Git](https://git-scm.com/) | Version control |
| [GitHub](https://github.com/) | Remote repository & CI/CD |

## 🗄️ Database Schema

Finly menggunakan PostgreSQL via Supabase dengan tabel berikut:

| Tabel | Fungsi |
|-------|--------|
| `profiles` | Data profil user (nama, display name, avatar) |
| `transaksi` | Semua transaksi pemasukan & pengeluaran |
| `uang_awal` | Saldo awal per tanggal |
| `feedback` | Laporan bug, keluhan, dan saran dari user |

> Semua tabel dilindungi oleh **Row Level Security (RLS)** — user hanya bisa melihat & mengubah data miliknya sendiri.

## 📦 Instalasi Lokal

```bash
# Clone repository
git clone https://github.com/Nathan-Liee/Finly.git

# Masuk ke direktori
cd Finly

# Install dependensi
npm install

# Jalankan dev server
npm run dev

# Build untuk production
npm run build
```

## 📱 Build Android APK

```bash
# Build web terlebih dahulu
npm run build

# Sync ke Capacitor
npx cap sync android

# Build APK (debug)
cd android && ./gradlew assembleDebug
```

APK hasil build akan ada di:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## 🗺️ Roadmap

- [ ] Edit transaksi lintas tanggal
- [ ] Reset transaksi per tanggal
- [ ] Search/filter transaksi lanjutan
- [ ] Dashboard analytics lanjutan
- [ ] Offline mode & auto sync improvement
- [ ] Notifikasi feedback untuk admin
- [ ] UI/UX redesign final
- [ ] APK release versioning (signed release build)
- [ ] PWA support (menunggu kompatibilitas dependency)

---

<p align="center">
  Dibuat dengan ❤️ untuk manajemen keuangan yang lebih baik.
</p>
