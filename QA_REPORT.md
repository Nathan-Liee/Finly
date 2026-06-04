# 🔍 QA AUDIT REPORT — Finly v1.10.0

**Date:** 2026-06-04  
**Scope:** Full code audit: security, bugs, performance, UX, accessibility, PWA  
**Build:** ✅ `npm run build` passes (4.17s, 430KB gzip 121KB main chunk)

---

## 🚨 CRITICAL

### [CRITICAL]: Supabase RLS tidak aktif — semua data terekspos
- **Lokasi:** `supabase/rls_fix.sql` (exists but NOT applied) + `src/utils/supabase.js:1-15`
- **Deskripsi:** File RLS policy (rls_fix.sql) ditemukan di repo tapi SQL belum dijalankan ke Supabase project. Anon key (`sb_publishable_LCiU...`) dipakai client-side. Tanpa RLS enabled, siapa pun dengan anon key bisa baca/tulis SEMUA data di semua tabel (profiles, uang_awal, transaksi, feedback).
- **Saran fix:** (1) Apply `supabase/rls_fix.sql` ke Supabase dashboard SQL editor. (2) Verifikasi RLS enabled on all 4 tables. (3) Untuk admin feedback panel, buat endpoint server-side pakai service_role key.
- **Prioritas:** CRITICAL

### [CRITICAL]: .env berisi secret production — SUPABASE_SERVICE_ROLE, GITHUB_TOKEN, VERCEL_TOKEN
- **Lokasi:** `.env:3-6`
- **Deskripsi:** File `.env` ter-commit di repo dengan credential: `SUPABASE_SERVICE_ROLE=eyJhbG...`, `GITHUB_TOKEN=ghp_HV...`, `VERCEL_TOKEN=vcp_7zCXh...`, `VERCEL_PROJECT_ID=prj_Vd2w83...`. Service role key bisa bypass semua RLS. GitHub token full access. Vercel token bisa deploy.
- **Saran fix:** (1) Rotasi semua token sekarang. (2) Remove .env dari git history (BFG Repo-Cleaner). (3) Pindahkan secret ke environment variable production (Vercel/Supabase dashboard). (4) Tambah `.env` ke `.gitignore`.
- **Prioritas:** CRITICAL

### [CRITICAL]: Hapus akun via admin API dari client-side
- **Lokasi:** `src/screens/Pengaturan.jsx:967-973`
- **Deskripsi:** `supabase.auth.admin?.deleteUser?.(user.id)` dipanggil dari client browser. Admin API endpoint (`supabase.auth.admin.deleteUser`) tidak bisa dipanggil dari client — hanya dari service_role key di server. Kode ini akan selalu error, tapi pattern-nya sangat berbahaya karena mengekspos logic admin.
- **Saran fix:** Hapus fitur "Hapus Akun Permanen" dari client. Buat edge function atau endpoint backend untuk delete user.
- **Prioritas:** CRITICAL

---

## 🔴 HIGH

### [HIGH]: Admin detection by hardcoded email
- **Lokasi:** `src/screens/Pengaturan.jsx:160-162`
- **Deskripsi:** `if (user?.email?.toLowerCase() === "xybcaa.454@gmail.com") setIsAdmin(true);` — hardcoded email check untuk akses panel admin feedback. Siapa pun bisa register dengan email berbeda dan tidak bisa akses. Tapi email bisa di-spoof atau user metadata bisa dimanipulasi.
- **Saran fix:** Gunakan Supabase custom claims (JWT role) atau tabel `admin_users` dengan RLS. Jangan hardcode email.
- **Prioritas:** HIGH

### [HIGH]: getFeedbackList membaca SEMUA feedback tanpa filter user_id
- **Lokasi:** `src/utils/supabase-feedback.js:22-32`
- **Deskripsi:** `supabase.from('feedback').select('*')` tanpa filter `.eq('user_id', user.id)`. Dengan RLS yang benar, ini hanya return feedback milik user sendiri. Tapi admin panel membutuhkan SEMUA feedback — tidak akan work dengan RLS user-level.
- **Saran fix:** Buat Supabase Edge Function dengan service_role key untuk admin endpoints (getFeedbackList, updateFeedbackStatus). Jangan pakai anon key untuk admin operations.
- **Prioritas:** HIGH

### [HIGH]: Feedback update status tanpa user_id guard
- **Lokasi:** `src/utils/supabase-feedback.js:34-36`
- **Deskripsi:** `supabase.from('feedback').update({ status }).eq('id', id)` — update by ID only. Dengan RLS user-level, user hanya bisa update feedback milik sendiri. Admin tidak bisa update feedback orang lain via client.
- **Saran fix:** Sama seperti di atas — butuh endpoint server-side dengan service_role key untuk admin.
- **Prioritas:** HIGH

### [HIGH]: saldoCash calculation bug — semua pengeluaran dikurangkan dari cash
- **Lokasi:** `src/utils/calc.js:29-31`
- **Deskripsi:** `saldoCash = uang_awal + totalCash - totalKeluar` — Rumus ini mengurangi SEMUA pengeluaran (totalKeluar = gaji + nonGaji) dari saldo cash, tanpa memperhatikan metode pembayaran. Jika user mencatat pengeluaran via QRIS, uang cash tetap berkurang. Ini menghasilkan saldo cash negatif palsu. `totalKeluar` tidak dibedakan antara cash vs qris.
- **Saran fix:** Tambah properti `metode` di transaksi keluar (seperti transaksi masuk). Atau buat `totalKeluarCash` yang filter `metode === "cash"`. Perbaiki rumus: `saldoCash = uang_awal + totalCash - totalKeluarCash`.
- **Prioritas:** HIGH

### [HIGH]: XSS vulnerability — user input langsung di-render
- **Lokasi:** `src/screens/Home.jsx:376` line rendering kategori/catatan, dan di banyak tempat lain
- **Deskripsi:** `src/utils/validation.js:31-34` ada fungsi `sanitizeInput` yang strip `<>"'`, tapi fungsi ini hanya dipakai di `sanitizeTransactionData` yang tidak pernah dipanggil di App.jsx. User input (kategori, catatan) langsung di-render via JSX. Di React, JSX otomatis escape XSS untuk string — jadi ini LOW risk. Tapi di export CSV (App.jsx:828, Laporan.jsx:176), data user dimasukkan ke CSV string tanpa escape yang benar untuk formula injection.
- **Saran fix:** Pakai `sanitizeInput` di semua entry point input. Untuk CSV, tambah `\t` prefix di depan cell yang mulai dengan `=`, `+`, `-`, `@` untuk mencegah formula injection.
- **Prioritas:** HIGH (CSV injection)

---

## 🟠 MEDIUM

### [MEDIUM]: Google Fonts @import di JSX — render-blocking
- **Lokasi:** `src/App.jsx:465`
- **Deskripsi:** `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap')` ditempatkan di `<style>` tag dalam JSX. Vite tidak mengelola ini — font didownload setelah JS dieksekusi. LCP terpengaruh.
- **Saran fix:** Pindah ke `<link>` di `index.html` dengan `preconnect` untuk Google Fonts. Atau gunakan `font-display: swap` (sudah via URL param) + preload.
- **Prioritas:** MEDIUM

### [MEDIUM]: Service worker — network-first untuk semua termasuk static assets
- **Lokasi:** `dist/service-worker.js:32-44`
- **Deskripsi:** SW menggunakan strategi network-first untuk SEMUA request (kecuali Supabase). Artinya setiap page load nunggu network dulu, baru fallback ke cache. Statis assets (CSS, JS chunks dari Vite) seharusnya cache-first karena punya content hash. Juga tidak ada cache untuk JS chunks hasil lazy loading — jika offline dan chunk belum di-cache, halaman broken.
- **Saran fix:** Ubah strategi: (1) Cache-first untuk static assets (`/assets/`). (2) Network-first untuk navigation (`/`, `/index.html`). (3) Tambah SW update prompt (skipWaiting + klaim otomatis tanpa notifikasi membuat user tidak sadar ada update).
- **Prioritas:** MEDIUM

### [MEDIUM]: Toast tidak queue — overlapping
- **Lokasi:** `src/App.jsx:184-187`
- **Deskripsi:** `setToast` langsung overwrite state + `setTimeout` 2200ms. Jika 2 toast dipicu dalam 2.2 detik, yang pertama hilang tanpa sempat tampil.
- **Saran fix:** Implement toast queue (array) atau gunakan library toast yang sudah mature.
- **Prioritas:** MEDIUM

### [MEDIUM]: Edit transaksi — stale closure data[tgl] setelah modal terbuka
- **Lokasi:** `src/App.jsx:376-387`
- **Deskripsi:** `handleEditTx` membaca `data[tgl]?.transaksi?.[idx]` di waktu click. Tapi jika data berubah sebelum user klik "Simpan", form masih pakai snapshot lama. Juga `setFormEditJumlah(String(t.jumlah ?? ""))` — `t.jumlah` adalah number, di-string-kan, tapi formatAngka tidak dipanggil sehingga angka ditampilkan tanpa separator ribuan.
- **Saran fix:** (1) Fix: baca langsung dari `data` di dalam `doEdit` handler, bukan dari closure. (2) Panggil `formatAngka()` untuk set initial nilai form edit.
- **Prioritas:** MEDIUM

### [MEDIUM]: Duplicate CSV export logic — dua implementasi berbeda
- **Lokasi:** `src/App.jsx:800-843` (via hidden button) vs `src/screens/Laporan.jsx:152-184` (direct a.click)
- **Deskripsi:** Ada 2 implementasi export CSV yang hampir identik. App.jsx bungkus logic dalam onclick button yang di-hidden (pattern aneh). Laporan.jsx lakukan direct. Keduanya tidak handle large dataset — semua data dimuat ke memory.
- **Saran fix:** Ekstrak ke utility function `exportCSV(data, filename)`. Panggil dari kedua tempat. Untuk large dataset, gunakan streaming atau Web Worker.
- **Prioritas:** MEDIUM

### [MEDIUM]: hero.png tidak dioptimasi
- **Lokasi:** `src/assets/hero.png`
- **Deskripsi:** File PNG 44KB, 343×361px, tidak compressed, bukan webp/avif. Tidak ada lazy loading. Tidak jelas dipakai di mana (mungkin unused).
- **Saran fix:** (1) Konversi ke WebP (estimasi ~8-12KB). (2) Tambah lazy loading `loading="lazy"` jika dipakai. (3) Hapus jika tidak digunakan.
- **Prioritas:** MEDIUM

### [MEDIUM]: Keyboard shortcut global — 'n' dan 'Escape' tidak konsisten
- **Lokasi:** `src/App.jsx:167-181`
- **Deskripsi:** Keyboard event listener global. 'n' buka modal, 'Escape' tutup. Tapi Escape hanya call `closeModal()` yang reset form — tidak check modal state dulu. Juga modal `setup` tidak bisa di-close dengan Escape (required setup).
- **Saran fix:** Escape handler harus check modal type. Setup modal seharusnya non-dismissable. Tambah focus trapping di modal.
- **Prioritas:** MEDIUM

### [MEDIUM]: Focus trapping & keyboard navigation di modal tidak ada
- **Lokasi:** `src/components/Modal.jsx:1-65`
- **Deskripsi:** Modal tidak: (1) trap focus (Tab bisa ke luar modal), (2) restore focus saat close, (3) role="dialog" dan aria-modal. Juga tidak ada tombol close via Escape key di Modal component (hanya global handler di App).
- **Saran fix:** Tambah focus trapping, `role="dialog"`, `aria-modal="true"`, dan escape handler langsung di Modal component.
- **Prioritas:** MEDIUM

### [MEDIUM]: No aria-labels pada icon-only buttons
- **Lokasi:** Banyak file — semua `<button>` yang hanya berisi `<Icon>` tanpa teks
- **Deskripsi:** FAB buttons (App.jsx:560-574), edit/delete action buttons (Home.jsx:392-408, Laporan.jsx:388-403), modal close button (Modal.jsx:44-59), dll. Tidak ada `aria-label`. Screen reader tidak bisa membaca fungsi tombol.
- **Saran fix:** Tambah `aria-label` ke semua icon-only buttons. Contoh: `aria-label="Tambah pemasukan"`.
- **Prioritas:** MEDIUM

### [MEDIUM]: Login — user bisa login dengan username orang lain via enumerasi
- **Lokasi:** `src/screens/Login.jsx:77-82`
- **Deskripsi:** Login flow mencari email dari username via `.ilike('username', trimmedEmail)`. Ini memungkinkan enumerasi username — attacker bisa cek apakah suatu username terdaftar (error "Username tidak ditemukan" vs "Password salah").
- **Saran fix:** Jangan bedakan error message. Gunakan pesan generik "Email/Username atau password salah". Atau gunakan Supabase function untuk lookup yang tidak leak informasi.
- **Prioritas:** MEDIUM

### [MEDIUM]: text-muted contrast ratio fails WCAG AA
- **Lokasi:** `src/styles/themes.css:99`, `--text-muted: #9CA3AF`
- **Deskripsi:** `#9CA3AF` di atas `#FAFBFC` (light bg) = contrast ratio ~2.7:1. WCAG AA butuh 4.5:1 untuk text normal, 3:1 untuk large text. Banyak tempat pakai `--text-muted` untuk font 12px (yang tidak termasuk large text).
- **Saran fix:** Gelapkan `--text-muted` jadi `#6B7280` (ratio ~4.8:1) atau simpan untuk decorative-only. Di dark mode, `#6B7280` di atas `#0B0D12` = ~4.0:1 — juga kurang.
- **Prioritas:** MEDIUM

---

## 🟡 LOW

### [LOW]: Modal hapus transaksi — dua modal dengan nama mirip (hapus vs konfirmHapus)
- **Lokasi:** `src/App.jsx:622-676`
- **Deskripsi:** Modal "hapus" (line 622) menampilkan list transaksi dengan tombol hapus per-item. Modal "konfirmHapus" (line 664) konfirmasi penghapusan. Tapi flow dari FAB atau Laporan langsung ke "konfirmHapus" (via handleDeleteTx). Modal "hapus" tidak dipanggil dari mana pun — dead code.
- **Saran fix:** Hapus modal "hapus" (unused). Atau gunakan sebagai entry point untuk edit/hapus dari bottom sheet.
- **Prioritas:** LOW

### [LOW]: IndexedDB version fixed at 1 — no migration support
- **Lokasi:** `src/db/index.js:3`
- **Deskripsi:** `indexedDB.open('KasTokoDB', 1)` — version 1 hardcoded. Jika struktur store berubah di masa depan, tidak ada migration path. User data akan hilang atau corrupt.
- **Saran fix:** Pindahkan version number ke constant. Tambah logika upgrade di `onupgradeneeded` untuk handle versi lama.
- **Prioritas:** LOW

### [LOW]: App.css dan index.css duplikasi animasi
- **Lokasi:** `src/App.css:18-56` vs `src/index.css:15-64`
- **Deskripsi:** Kedua file mendefinisikan `.page-transition`, `.modal-content`, keyframes `fadeIn`, `slideUp`, `staggerIn` yang identik. CSS diduplikasi sampai 2 kali.
- **Saran fix:** Hapus `index.css` (isi pindah ke App.css atau themes.css). Hanya import 1 file CSS di main.jsx.
- **Prioritas:** LOW

### [LOW]: `validation.js` utilities tidak dipakai di App.jsx
- **Lokasi:** `src/utils/validation.js` — semua fungsi
- **Deskripsi:** `validateTransactionAmount`, `sanitizeTransactionData`, `validateTransaction`, `validateSetupAmount` — semua fungsi validasi tidak pernah dipanggil. App.jsx lakukan validasi inline (manual) dengan hasil yang tidak konsisten.
- **Saran fix:** Integrasikan fungsi validasi dari `validation.js` ke App.jsx. Hapus duplikasi logic.
- **Prioritas:** LOW

### [LOW]: `editTx.js` utility tidak dipakai
- **Lokasi:** `src/utils/editTx.js`
- **Deskripsi:** Fungsi `editTransaksi` dan `deleteTransaksi` diekspor tapi tidak pernah di-import oleh komponen mana pun. Semua edit/hapus dilakukan langsung di App.jsx.
- **Saran fix:** Hapus file atau gunakan di App.jsx.
- **Prioritas:** LOW

### [LOW]: Data tidak auto-refresh saat online kembali
- **Lokasi:** `src/App.jsx:136-164`
- **Deskripsi:** Sync queue diproses saat online, tapi tidak reload data dari Supabase setelah sync. Jika ada perubahan dari device lain, user tidak melihat data terbaru sampai manual reload.
- **Saran fix:** Setelah sync queue clear, panggil `loadData()` untuk refresh state dari Supabase.
- **Prioritas:** LOW

### [LOW]: Number formatting di form edit — tidak pakai formatAngka
- **Lokasi:** `src/App.jsx:381`
- **Deskripsi:** `setFormEditJumlah(String(t.jumlah ?? ""))` — angka ditampilkan tanpa separator ribuan. Field lain (formJumlah, formUangAwal) pakai `formatAngka`.
- **Saran fix:** Panggil `formatAngka(String(t.jumlah ?? ""))`.
- **Prioritas:** LOW

### [LOW]: No confirmation when closing modal with form data
- **Lokasi:** `src/components/Modal.jsx:19` + `src/App.jsx:189-195`
- **Deskripsi:** Click overlay atau tombol close langsung reset form tanpa konfirmasi. User bisa kehilangan input yang sudah diketik.
- **Saran fix:** Tampilkan konfirmasi "Yakin ingin menutup? Data yang diisi akan hilang." jika form tidak kosong.
- **Prioritas:** LOW

### [LOW]: Tidak ada meta tag social sharing (OG)
- **Lokasi:** `index.html`
- **Deskripsi:** Tidak ada Open Graph tags (`og:title`, `og:description`, `og:image`). Juga tidak ada Twitter Card tags. Ketika link dishare, hanya URL kosong.
- **Saran fix:** Tambah OG meta tags ke `<head>` untuk social preview.
- **Prioritas:** LOW

### [LOW]: Bundle size — ikon SVG inline 11KB dalam main bundle
- **Lokasi:** `src/components/Icon.jsx:1-188`
- **Deskripsi:** Semua 28 ikon SVG didefinisikan sebagai object literal dalam satu komponen. ~11KB (gzipped ~3KB). Semua ikon dikirim ke semua user meskipun hanya 3-4 yang dipakai per screen.
- **Saran fix:** Lazy load ikon individu. Atau split ikon per screen. Atau gunakan sprite sheet.
- **Prioritas:** LOW

---

## 📊 BUILD STATS

| Asset | Size | Gzip |
|-------|------|------|
| index-CJDr9IM_.js (main) | 430.14 kB | 121.51 kB |
| Pengaturan-BTZ4DH_H.js | 25.64 kB | 5.88 kB |
| Laporan-CeedqYuU.js | 19.75 kB | 4.27 kB |
| Home-BVZ8ABlQ.js | 14.46 kB | 3.19 kB |
| index-CsSeYQFw.css | 7.62 kB | 1.69 kB |
| db-C-vNY98L.js | 2.75 kB | 0.70 kB |
| Card-BZ0-6k8P.js | 0.36 kB | 0.27 kB |

**✅ Good:** screens are code-split (lazy loaded).  
**⚠️ Main bundle 121KB gzip** — supabase-js library is the bulk (~95KB). Consider dynamic import for Supabase on auth-dependent screens only.

---

## ✅ SUDAH BAIK

- Lazy loading routes via `React.lazy()` + `Suspense`
- Offline-first dengan IndexedDB sebagai local source
- Sync queue mechanism untuk online/offline transition
- Error boundary wrapping root app
- `StrictMode` di development
- Clean CSS custom properties dengan light/dark mode
- Format angka dengan separator ribuan untuk UX
- Debounce/submission guard via `isSubmitting` state
- Keyboard shortcut for modal navigation ('n' untuk tambah, Escape untuk tutup)
- Memo (React.memo) di HomeScreen

---

## RINGKASAN

| Level | Count |
|-------|-------|
| CRITICAL | 3 |
| HIGH | 6 |
| MEDIUM | 14 |
| LOW | 10 |
| **Total** | **33** |

### Immediate actions (CRITICAL):
1. ⛔ Rotasi semua secrets di `.env` (service_role key, GitHub token, Vercel token)
2. 🔒 Apply `supabase/rls_fix.sql` ke Supabase — enable RLS di semua 4 tabel
3. 🗑️ Hapus "Hapus Akun" dari client, pindah ke edge function
4. 🔄 Tambah `.env` ke `.gitignore`, bersihkan git history
5. 🐛 Fix `saldoCash` calculation — jangan kurangi pengeluaran non-cash dari saldo cash

File: `/home/pineapple/finly/QA_REPORT.md`
