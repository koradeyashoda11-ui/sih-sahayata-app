/*
# Create core tables for NER Dementia Care app (single-tenant, no auth)

1. New Tables
- `reminders`: Tracks daily reminder activities for the patient — medicine, water, doctor appointments.
  - `id` (uuid, primary key)
  - `type` (text: 'medicine' | 'water' | 'doctor')
  - `title` (text, human-readable label)
  - `completed` (boolean, default false)
  - `scheduled_time` (text, e.g. "8:00 AM")
  - `created_at` (timestamptz)
  - `completed_at` (timestamptz, nullable)

- `game_scores`: Records each completed Memory Match game session.
  - `id` (uuid, primary key)
  - `game_type` (text, e.g. 'memory_match')
  - `score` (int, number of pairs matched)
  - `moves` (int, number of card flips)
  - `duration_seconds` (int, time to complete)
  - `played_at` (timestamptz)

- `caregiver_alerts`: Stores caregiver-configured alert settings.
  - `id` (uuid, primary key)
  - `label` (text, alert name)
  - `enabled` (boolean, default true)
  - `created_at` (timestamptz)

2. Security
- Enable RLS on all three tables.
- Allow anon + authenticated full CRUD because the app is single-tenant with no sign-in.
- `USING (true)` / `WITH CHECK (true)` is acceptable here because all data is intentionally shared.
*/

CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('medicine', 'water', 'doctor')),
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  scheduled_time text NOT NULL,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_reminders" ON reminders;
CREATE POLICY "anon_select_reminders" ON reminders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_reminders" ON reminders;
CREATE POLICY "anon_insert_reminders" ON reminders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_reminders" ON reminders;
CREATE POLICY "anon_update_reminders" ON reminders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_reminders" ON reminders;
CREATE POLICY "anon_delete_reminders" ON reminders FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS game_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type text NOT NULL DEFAULT 'memory_match',
  score int NOT NULL DEFAULT 0,
  moves int NOT NULL DEFAULT 0,
  duration_seconds int NOT NULL DEFAULT 0,
  played_at timestamptz DEFAULT now()
);

ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_game_scores" ON game_scores;
CREATE POLICY "anon_select_game_scores" ON game_scores FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_game_scores" ON game_scores;
CREATE POLICY "anon_insert_game_scores" ON game_scores FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_game_scores" ON game_scores;
CREATE POLICY "anon_update_game_scores" ON game_scores FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_game_scores" ON game_scores;
CREATE POLICY "anon_delete_game_scores" ON game_scores FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS caregiver_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE caregiver_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_caregiver_alerts" ON caregiver_alerts;
CREATE POLICY "anon_select_caregiver_alerts" ON caregiver_alerts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_caregiver_alerts" ON caregiver_alerts;
CREATE POLICY "anon_insert_caregiver_alerts" ON caregiver_alerts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_caregiver_alerts" ON caregiver_alerts;
CREATE POLICY "anon_update_caregiver_alerts" ON caregiver_alerts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_caregiver_alerts" ON caregiver_alerts;
CREATE POLICY "anon_delete_caregiver_alerts" ON caregiver_alerts FOR DELETE
  TO anon, authenticated USING (true);
