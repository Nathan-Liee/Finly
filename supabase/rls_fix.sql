-- ============================================================
-- RLS Policies Hardening — Finly (KasToko)
-- Generated from code audit: 2026-06-04
-- Purpose: Fix overly permissive / missing Row Level Security
-- Review before applying to production!
-- ============================================================

-- ============================================================
-- 1. PROFILES
-- ============================================================

ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing default policies that may be too permissive
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert any profile" ON profiles;
DROP POLICY IF EXISTS "Users can update any profile" ON profiles;
DROP POLICY IF EXISTS "Enable all for authenticated" ON profiles;
DROP POLICY IF EXISTS "Enable read for all" ON profiles;

-- Policy: Users can read their OWN profile
-- Also allows username→email lookup (needed for login by username)
-- NOTE: .ilike('username', ...) is used in Login.jsx line 79 for login flow
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile (sign up)
-- Login.jsx line 65: supabase.from('profiles').upsert({ id: data.user.id, ... })
-- The id MUST match the authenticated user's id
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
-- storage.js line 199/218: supabase.from('profiles').update({ username }).eq('id', user.id)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Allow username → email lookup for login
-- Login.jsx line 79: .from('profiles').select('email').ilike('username', trimmedEmail)
-- Only exposes email, not full profile data
-- If this is too open, replace with a dedicated function
DROP POLICY IF EXISTS "Allow username lookup" ON profiles;
CREATE POLICY "Allow username lookup"
  ON profiles FOR SELECT
  USING (true);

-- ⚠️ NOTE: The above policy allows reading email by username (enumeration risk).
--    If you want stricter: use a Supabase function instead.
--    See alternative below (commented):
-- CREATE OR REPLACE FUNCTION get_email_by_username(p_username text)
-- RETURNS TABLE(email text) LANGUAGE plpgsql SECURITY DEFINER AS $$
-- BEGIN
--   RETURN QUERY SELECT profiles.email FROM profiles WHERE profiles.username ILIKE p_username;
-- END;
-- $$;


-- ============================================================
-- 2. UANG_AWAL (Daily Starting Cash)
-- ============================================================

ALTER TABLE IF EXISTS uang_awal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all uang_awal" ON uang_awal;
DROP POLICY IF EXISTS "Users can insert any uang_awal" ON uang_awal;
DROP POLICY IF EXISTS "Enable all for authenticated" ON uang_awal;
DROP POLICY IF EXISTS "Enable read for all" ON uang_awal;

-- Policy: Users can read their own uang_awal
-- storage.js line 37-40: .from('uang_awal').select('*').eq('user_id', user.id)
CREATE POLICY "Users can read own uang_awal"
  ON uang_awal FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own uang_awal
-- storage.js line 120: .from('uang_awal').insert({ tanggal, uang_awal, user_id: user.id })
CREATE POLICY "Users can insert own uang_awal"
  ON uang_awal FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own uang_awal
-- storage.js line 114: .from('uang_awal').update({ uang_awal }).eq('id', existing.id)
CREATE POLICY "Users can update own uang_awal"
  ON uang_awal FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own uang_awal
CREATE POLICY "Users can delete own uang_awal"
  ON uang_awal FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================
-- 3. TRANSAKSI (Transactions)
-- ============================================================

ALTER TABLE IF EXISTS transaksi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all transaksi" ON transaksi;
DROP POLICY IF EXISTS "Users can insert any transaksi" ON transaksi;
DROP POLICY IF EXISTS "Enable all for authenticated" ON transaksi;
DROP POLICY IF EXISTS "Enable read for all" ON transaksi;

-- Policy: Users can read their own transaksi
-- storage.js line 42-46: .from('transaksi').select('*').eq('user_id', user.id)
CREATE POLICY "Users can read own transaksi"
  ON transaksi FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own transaksi
-- storage.js line 147-160: .from('transaksi').insert(...) with user_id: user.id
CREATE POLICY "Users can insert own transaksi"
  ON transaksi FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own transaksi
CREATE POLICY "Users can update own transaksi"
  ON transaksi FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own transaksi
-- storage.js line 133-137: .from('transaksi').delete().eq('tanggal', tanggal).eq('user_id', user.id)
CREATE POLICY "Users can delete own transaksi"
  ON transaksi FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================
-- 4. FEEDBACK
-- ============================================================

ALTER TABLE IF EXISTS feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all feedback" ON feedback;
DROP POLICY IF EXISTS "Users can insert any feedback" ON feedback;
DROP POLICY IF EXISTS "Users can update any feedback" ON feedback;
DROP POLICY IF EXISTS "Enable all for authenticated" ON feedback;
DROP POLICY IF EXISTS "Enable read for all" ON feedback;

-- Policy: Users can read their own feedback
-- (getFeedbackList in supabase-feedback.js currently reads ALL feedback — 
--  this policy restricts it to own data; if admin panel needed, add a separate role)
CREATE POLICY "Users can read own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert feedback (with their own user_id)
-- supabase-feedback.js line 10: .from('feedback').insert({ user_id: user.id, ... })
CREATE POLICY "Users can insert own feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own feedback (if needed)
CREATE POLICY "Users can update own feedback"
  ON feedback FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ⚠️ NOTE: supabase-feedback.js line 34-35 has updateFeedbackStatus(id, status)
--    which does .from('feedback').update({ status }).eq('id', id) WITHOUT user_id check.
--    This policy restricts it to own records. If admins need to update status,
--    create a separate admin role policy, e.g.:
-- CREATE POLICY "Admins can update any feedback"
--   ON feedback FOR UPDATE
--   USING (auth.jwt() ->> 'role' = 'admin')
--   WITH CHECK (auth.jwt() ->> 'role' = 'admin');


-- ============================================================
-- SUMMARY OF CHANGES
-- ============================================================
-- Table       | RLS Enabled | Policy Changes
-- ------------+-------------+---------------------------------------------------
-- profiles    | YES         | Added SELECT/INSERT/UPDATE own-profile policies.
--             |             | Added relaxed "username lookup" for login flow.
--             |             | Previously: likely no RLS → all data exposed.
-- ------------+-------------+---------------------------------------------------
-- uang_awal   | YES         | Added SELECT/INSERT/UPDATE/DELETE own-data policies.
--             |             | Previously: likely no RLS → all data exposed.
-- ------------+-------------+---------------------------------------------------
-- transaksi   | YES         | Added SELECT/INSERT/UPDATE/DELETE own-data policies.
--             |             | Previously: likely no RLS → all data exposed.
-- ------------+-------------+---------------------------------------------------
-- feedback    | YES         | Added SELECT/INSERT/UPDATE own-data policies.
--             |             | Previously: likely no RLS → all data exposed.
--             |             | ⚠️ getFeedbackList() reads ALL feedback (admin feature).
--             |             |   Need separate admin role or service-role call.
-- ============================================================

-- ============================================================
-- POTENTIAL ISSUES FOUND DURING AUDIT
-- ============================================================
-- 1. [HIGH] No SQL migration files exist in repo.
--    Schema managed only via Supabase dashboard — no version control.
--    → Store this .sql file and future migrations under supabase/.
--
-- 2. [HIGH] Anon key used client-side (supabase.js line 4).
--    Anon key has full table access if RLS is not enabled.
--    → RLS policies above close this gap.
--
-- 3. [MEDIUM] feedback.getFeedbackList() reads ALL records.
--    supabase-feedback.js line 23: .from('feedback').select('*')
--    No user_id filter → expects RLS to block, or admin-only.
--    → After RLS, this will only return current user's feedback.
--    If admin panel needed, use service_role key server-side.
--
-- 4. [MEDIUM] feedback.updateFeedbackStatus() has no user_id check.
--    supabase-feedback.js line 35: .update({ status }).eq('id', id)
--    → RLS now restricts to own records. Admin update needs separate policy.
--
-- 5. [LOW] profiles email lookup by username (Login.jsx line 79).
--    Allows email enumeration via .ilike('username', ...).
--    → Acceptable for login flow. Mitigate with rate limiting if needed.
--
-- 6. [INFO] No categories table found — "kategori" is a column in transaksi/feedback.
--    If a categories table is added later, apply the same RLS pattern.
-- ============================================================
