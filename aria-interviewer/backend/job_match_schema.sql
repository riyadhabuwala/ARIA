CREATE TABLE IF NOT EXISTS user_resume_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  resume_text TEXT NOT NULL,
  resume_filename TEXT,
  extracted_profile JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_resume_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile"
  ON user_resume_profiles FOR ALL
  USING (auth.uid()::text = user_id);

CREATE TABLE IF NOT EXISTS job_match_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  scan_id TEXT NOT NULL,
  jobs JSONB NOT NULL,
  queries_used JSONB,
  total_fetched INTEGER DEFAULT 0,
  last_scanned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE job_match_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own results"
  ON job_match_results FOR ALL
  USING (auth.uid()::text = user_id);

CREATE INDEX IF NOT EXISTS idx_job_results_user
  ON job_match_results(user_id);

CREATE INDEX IF NOT EXISTS idx_resume_profile_user
  ON user_resume_profiles(user_id);
