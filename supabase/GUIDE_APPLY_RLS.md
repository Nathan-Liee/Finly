# Cara Apply RLS Fix ke Supabase

## Via Supabase Dashboard (gampang, 1 menit)

1. Buka https://supabase.com/dashboard/project/sjmbigqpihzxeilafifnz
2. Login pake akun Supabase
3. Kiri sidebar → **SQL Editor**
4. Klik **New Query**
5. Buka file `supabase/rls_fix.sql` — copy semua isinya
6. Paste di SQL Editor
7. Klik **RUN** (⬇️ tombol biru)
8. Selesai ✅

## Verifikasi berhasil

Jalanin query ini:
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```
Semua tabel harus `rowsecurity = true`.

## Kenapa gua gak bisa execute langsung?
Server Hermes gak bisa resolve DNS `sjmbigqpihzxeilafifnz.supabase.co` — kayanya project ini masih baru atau region tertentu. Tapi SQL file udah siap tinggal copy-paste.
