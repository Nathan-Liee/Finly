-- ============================================================
-- Admin Role + Admin RLS Policies — Finly (KasToko)
-- Adds is_admin column, sets admin user, creates admin policies
-- ============================================================

-- ============================================================
-- 1. Add is_admin column to profiles
-- ============================================================
ALTER TABLE IF EXISTS profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- ============================================================
-- 2. Set admin user (xybcaa.454@gmail.com)
-- ============================================================
UPDATE profiles
  SET is_admin = true
  WHERE email = 'xybcaa.454@gmail.com';

-- ============================================================
-- 3. Admin RLS policies on feedback
--    Allows admin to read/update ALL feedback
-- ============================================================

-- Admin: can read all feedback
DROP POLICY IF EXISTS "Admins can read all feedback" ON feedback;
CREATE POLICY "Admins can read all feedback"
  ON feedback FOR SELECT
  USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

-- Admin: can update any feedback
DROP POLICY IF EXISTS "Admins can update all feedback" ON feedback;
CREATE POLICY "Admins can update all feedback"
  ON feedback FOR UPDATE
  USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  )
  WITH CHECK (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

-- ============================================================
-- 4. Admin RLS policies on transaksi (read-all for reporting)
-- ============================================================
DROP POLICY IF EXISTS "Admins can read all transaksi" ON transaksi;
CREATE POLICY "Admins can read all transaksi"
  ON transaksi FOR SELECT
  USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

-- ============================================================
-- 5. Admin RLS policies on uang_awal (read-all for reporting)
-- ============================================================
DROP POLICY IF EXISTS "Admins can read all uang_awal" ON uang_awal;
CREATE POLICY "Admins can read all uang_awal"
  ON uang_awal FOR SELECT
  USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

-- ============================================================
-- SUMMARY
-- ============================================================
-- profiles: added is_admin column
-- Admin email: xybcaa.454@gmail.com → is_admin = true
-- feedback: admin can SELECT and UPDATE all records
-- transaksi: admin can SELECT all records
-- uang_awal: admin can SELECT all records
-- ============================================================
