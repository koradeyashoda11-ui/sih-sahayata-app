/*
# Add adaptive difficulty tracking to game_scores + cognitive_state table

1. Modified Tables
- `game_scores`: Added `difficulty_level` (int, default 1) and `errors` (int, default 0) columns
  to track which difficulty level the game was played at and how many mismatched pairs occurred.

2. New Tables
- `cognitive_state`: Stores the current AI-assigned cognitive level and adjustment notes.
  - `id` (uuid, primary key)
  - `level` (int, 1=Easy, 2=Medium, 3=Challenging)
  - `adjustment_note` (text, explanation of why level was adjusted)
  - `updated_at` (timestamptz)

3. Security
- Enable RLS on `cognitive_state`.
- Allow anon + authenticated full CRUD (single-tenant, no auth).
*/

ALTER TABLE game_scores ADD COLUMN IF NOT EXISTS difficulty_level int NOT NULL DEFAULT 1;
ALTER TABLE game_scores ADD COLUMN IF NOT EXISTS errors int NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS cognitive_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level int NOT NULL DEFAULT 1 CHECK (level IN (1, 2, 3)),
  adjustment_note text NOT NULL DEFAULT 'Starting at Easy level',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cognitive_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_cognitive_state" ON cognitive_state;
CREATE POLICY "anon_select_cognitive_state" ON cognitive_state FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_cognitive_state" ON cognitive_state;
CREATE POLICY "anon_insert_cognitive_state" ON cognitive_state FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_cognitive_state" ON cognitive_state;
CREATE POLICY "anon_update_cognitive_state" ON cognitive_state FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_cognitive_state" ON cognitive_state;
CREATE POLICY "anon_delete_cognitive_state" ON cognitive_state FOR DELETE
  TO anon, authenticated USING (true);
