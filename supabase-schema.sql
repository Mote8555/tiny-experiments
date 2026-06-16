-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql/new)
-- Safe to run multiple times (all CREATE IF NOT EXISTS / OR REPLACE / DROP ... IF EXISTS)

-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  notification_preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. EXPERIMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  hypothesis TEXT DEFAULT '',
  duration INTEGER NOT NULL CHECK (duration >= 1 AND duration <= 365),
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  category TEXT DEFAULT '',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'abandoned', 'archived')),
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'unlisted', 'public')),
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. EXPERIMENT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS experiment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  effort TEXT CHECK (effort IN ('low', 'medium', 'high')),
  mood INTEGER CHECK (mood >= 1 AND mood <= 5),
  internal TEXT DEFAULT '',
  external TEXT DEFAULT '',
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. REFLECTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  plus TEXT DEFAULT '',
  minus TEXT DEFAULT '',
  next_ TEXT DEFAULT '',
  decision TEXT CHECK (decision IN ('persist', 'pause', 'pivot')),
  impact TEXT DEFAULT '',
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. NOTIFICATIONS TABLE (Phase 4)
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT DEFAULT '',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 6. MIGRATIONS (safe to re-run on existing databases)
-- ============================================================

-- 6a. Add new columns to experiments (if missing)
DO $$ BEGIN
  ALTER TABLE experiments ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE experiments ADD COLUMN IF NOT EXISTS end_date DATE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE experiments ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE experiments ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE experiments ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE experiments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE experiments ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 6b. Add updated_at to experiment_logs and reflections
DO $$ BEGIN
  ALTER TABLE experiment_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE reflections ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 6c. Add notification_preferences to profiles
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}'::jsonb;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 6d. Migrate is_public → visibility (if is_public exists and visibility doesn't have real data yet)
UPDATE experiments
SET visibility = CASE
  WHEN is_public = true THEN 'public'
  ELSE 'private'
END
WHERE is_public IS NOT NULL AND visibility = 'private';

-- 6e. Drop is_public column (safe — data migrated above)
ALTER TABLE experiments DROP COLUMN IF EXISTS is_public CASCADE;

-- 6f. Migrate status values: if any rows have 'active' but no end_date, set it
UPDATE experiments
SET end_date = start_date + duration
WHERE end_date IS NULL AND start_date IS NOT NULL AND duration IS NOT NULL;

-- 6g. Migrate status: keep old statuses, add defaults for new ones
-- (constraint is already updated to include new statuses; existing rows are valid)

-- ============================================================
-- 7. CONSTRAINTS
-- ============================================================

-- 7a. Ensure visibility has proper check constraint
ALTER TABLE experiments DROP CONSTRAINT IF EXISTS experiments_visibility_check;
ALTER TABLE experiments ADD CONSTRAINT experiments_visibility_check
  CHECK (visibility IN ('private', 'unlisted', 'public'));

-- 7b. Ensure status has proper check with new states
ALTER TABLE experiments DROP CONSTRAINT IF EXISTS experiments_status_check;
ALTER TABLE experiments ADD CONSTRAINT experiments_status_check
  CHECK (status IN ('draft', 'active', 'paused', 'completed', 'abandoned', 'archived'));

-- 7c. Unique daily log constraint (one log per experiment per day)
ALTER TABLE experiment_logs DROP CONSTRAINT IF EXISTS unique_daily_log;
ALTER TABLE experiment_logs ADD CONSTRAINT unique_daily_log
  UNIQUE (experiment_id, date);

-- 7d. Unique reflection constraint (one reflection per experiment)
ALTER TABLE reflections DROP CONSTRAINT IF EXISTS unique_reflection;
ALTER TABLE reflections ADD CONSTRAINT unique_reflection
  UNIQUE (experiment_id);

-- 7e. Char length constraints
ALTER TABLE experiments DROP CONSTRAINT IF EXISTS experiments_title_length;
ALTER TABLE experiments ADD CONSTRAINT experiments_title_length
  CHECK (char_length(title) >= 1 AND char_length(title) <= 200);

ALTER TABLE experiments DROP CONSTRAINT IF EXISTS experiments_hypothesis_length;
ALTER TABLE experiments ADD CONSTRAINT experiments_hypothesis_length
  CHECK (char_length(hypothesis) <= 2000);

ALTER TABLE experiment_logs DROP CONSTRAINT IF EXISTS logs_note_length;
ALTER TABLE experiment_logs ADD CONSTRAINT logs_note_length
  CHECK (char_length(note) <= 5000);

-- ============================================================
-- 8. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (new.id, new.email, split_part(new.email, '@', 1));
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 9. ROW-LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, only self can update/insert
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete" ON profiles;
CREATE POLICY "profiles_delete" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- Experiments: own all; others can see public/unlisted
DROP POLICY IF EXISTS "experiments_insert" ON experiments;
CREATE POLICY "experiments_insert" ON experiments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "experiments_select_own" ON experiments;
CREATE POLICY "experiments_select_own" ON experiments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "experiments_select_public" ON experiments;
CREATE POLICY "experiments_select_public" ON experiments
  FOR SELECT USING (visibility IN ('public', 'unlisted'));

DROP POLICY IF EXISTS "experiments_update" ON experiments;
CREATE POLICY "experiments_update" ON experiments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "experiments_delete" ON experiments;
CREATE POLICY "experiments_delete" ON experiments
  FOR DELETE USING (auth.uid() = user_id);

-- Logs: own via experiment ownership
DROP POLICY IF EXISTS "logs_insert" ON experiment_logs;
CREATE POLICY "logs_insert" ON experiment_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM experiments WHERE id = experiment_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "logs_select" ON experiment_logs;
CREATE POLICY "logs_select" ON experiment_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM experiments
      WHERE id = experiment_id
      AND (user_id = auth.uid() OR visibility IN ('public', 'unlisted'))
    )
  );

DROP POLICY IF EXISTS "logs_update" ON experiment_logs;
CREATE POLICY "logs_update" ON experiment_logs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM experiments WHERE id = experiment_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "logs_delete" ON experiment_logs;
CREATE POLICY "logs_delete" ON experiment_logs
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM experiments WHERE id = experiment_id AND user_id = auth.uid())
  );

-- Reflections: own via experiment ownership
DROP POLICY IF EXISTS "reflections_insert" ON reflections;
CREATE POLICY "reflections_insert" ON reflections
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM experiments WHERE id = experiment_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "reflections_select" ON reflections;
CREATE POLICY "reflections_select" ON reflections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM experiments
      WHERE id = experiment_id
      AND (user_id = auth.uid() OR visibility IN ('public', 'unlisted'))
    )
  );

DROP POLICY IF EXISTS "reflections_update" ON reflections;
CREATE POLICY "reflections_update" ON reflections
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM experiments WHERE id = experiment_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "reflections_delete" ON reflections;
CREATE POLICY "reflections_delete" ON reflections
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM experiments WHERE id = experiment_id AND user_id = auth.uid())
  );

-- Notifications: own only
DROP POLICY IF EXISTS "notifications_select" ON notifications;
CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update" ON notifications;
CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete" ON notifications;
CREATE POLICY "notifications_delete" ON notifications
  FOR DELETE USING (auth.uid() = user_id);
