/*
  # Add Medicine Doses Tracking

  1. New Tables
    - `medicine_doses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `medicine_id` (uuid, references user_medicines)
      - `scheduled_time` (timestamptz) - when the dose should be taken
      - `taken_at` (timestamptz, nullable) - when the dose was actually taken
      - `status` (text) - 'pending', 'taken', 'missed', 'skipped'
      - `notes` (text, nullable) - optional notes about the dose
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `medicine_doses` table
    - Add policy for users to read their own doses
    - Add policy for users to insert their own doses
    - Add policy for users to update their own doses
    - Add policy for users to delete their own doses
  
  3. Indexes
    - Add index on user_id for faster queries
    - Add index on medicine_id for faster queries
    - Add index on scheduled_time for sorting
    - Add composite index on user_id and scheduled_time
*/

CREATE TABLE IF NOT EXISTS medicine_doses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medicine_id uuid NOT NULL REFERENCES user_medicines(id) ON DELETE CASCADE,
  scheduled_time timestamptz NOT NULL,
  taken_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'taken', 'missed', 'skipped')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE medicine_doses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own medicine doses"
  ON medicine_doses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medicine doses"
  ON medicine_doses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medicine doses"
  ON medicine_doses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own medicine doses"
  ON medicine_doses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_medicine_doses_user_id ON medicine_doses(user_id);
CREATE INDEX IF NOT EXISTS idx_medicine_doses_medicine_id ON medicine_doses(medicine_id);
CREATE INDEX IF NOT EXISTS idx_medicine_doses_scheduled_time ON medicine_doses(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_medicine_doses_user_scheduled ON medicine_doses(user_id, scheduled_time);