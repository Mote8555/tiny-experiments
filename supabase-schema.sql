-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql/new)

-- 1. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Experiments table
CREATE TABLE IF NOT EXISTS experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  hypothesis TEXT DEFAULT '',
  duration INTEGER NOT NULL CHECK (duration > 0 AND duration <= 365),
  category TEXT DEFAULT '',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Experiment logs
CREATE TABLE IF NOT EXISTS experiment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  effort TEXT CHECK (effort IN ('low', 'medium', 'high')),
  mood INTEGER CHECK (mood >= 1 AND mood <= 5),
  internal TEXT DEFAULT '',
  external TEXT DEFAULT '',
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Reflections
CREATE TABLE IF NOT EXISTS reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  plus TEXT DEFAULT '',
  minus TEXT DEFAULT '',
  next_ TEXT DEFAULT '',
  decision TEXT CHECK (decision IN ('persist', 'pause', 'pivot')),
  impact TEXT DEFAULT '',
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (new.id, new.email, split_part(new.email, '@', 1));
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 6. Row-Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read any profile, update their own
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Experiments: own all; others can see public ones
CREATE POLICY "experiments_insert" ON experiments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "experiments_select_own" ON experiments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "experiments_select_public" ON experiments
  FOR SELECT USING (is_public = true);

CREATE POLICY "experiments_update" ON experiments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "experiments_delete" ON experiments
  FOR DELETE USING (auth.uid() = user_id);

-- Logs: own via experiment ownership
CREATE POLICY "logs_insert" ON experiment_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM experiments WHERE id = experiment_id AND user_id = auth.uid())
  );

CREATE POLICY "logs_select" ON experiment_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM experiments WHERE id = experiment_id AND (user_id = auth.uid() OR is_public = true))
  );

CREATE POLICY "logs_update" ON experiment_logs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM experiments WHERE id = experiment_id AND user_id = auth.uid())
  );

CREATE POLICY "logs_delete" ON experiment_logs
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM experiments WHERE id = experiment_id AND user_id = auth.uid())
  );

-- Reflections: own via experiment ownership
CREATE POLICY "reflections_insert" ON reflections
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM experiments WHERE id = experiment_id AND user_id = auth.uid())
  );

CREATE POLICY "reflections_select" ON reflections
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM experiments WHERE id = experiment_id AND (user_id = auth.uid() OR is_public = true))
  );

CREATE POLICY "reflections_update" ON reflections
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM experiments WHERE id = experiment_id AND user_id = auth.uid())
  );

CREATE POLICY "reflections_delete" ON reflections
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM experiments WHERE id = experiment_id AND user_id = auth.uid())
  );
