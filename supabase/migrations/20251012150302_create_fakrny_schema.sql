/*
  # Fakrny Medicine Reminder App - Database Schema

  ## Overview
  Complete database schema for a medicine reminder and prescription management app with AI capabilities.

  ## New Tables

  ### 1. profiles
  - `id` (uuid, primary key, references auth.users)
  - `full_name` (text)
  - `date_of_birth` (date)
  - `phone_number` (text)
  - `language_preference` (text, default 'en')
  - `theme_preference` (text, default 'light')
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. prescriptions
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `image_url` (text) - encrypted storage path
  - `doctor_name` (text)
  - `clinic_name` (text)
  - `prescription_date` (date)
  - `notes` (text)
  - `processed` (boolean) - AI processing status
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. medicines
  - `id` (uuid, primary key)
  - `name` (text)
  - `generic_name` (text)
  - `description` (text)
  - `purpose` (text)
  - `side_effects` (text[])
  - `warnings` (text[])
  - `recommended_dosage` (text)
  - `category` (text)
  - `created_at` (timestamptz)

  ### 4. user_medicines
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `prescription_id` (uuid, references prescriptions, nullable)
  - `medicine_id` (uuid, references medicines, nullable)
  - `medicine_name` (text) - fallback if not in database
  - `dosage` (text)
  - `frequency` (text) - e.g., "twice daily"
  - `duration_days` (integer)
  - `start_date` (date)
  - `end_date` (date)
  - `instructions` (text)
  - `active` (boolean, default true)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 5. reminders
  - `id` (uuid, primary key)
  - `user_medicine_id` (uuid, references user_medicines)
  - `user_id` (uuid, references profiles)
  - `reminder_time` (time)
  - `days_of_week` (integer[]) - 0=Sunday, 6=Saturday
  - `enabled` (boolean, default true)
  - `created_at` (timestamptz)

  ### 6. medicine_logs
  - `id` (uuid, primary key)
  - `user_medicine_id` (uuid, references user_medicines)
  - `user_id` (uuid, references profiles)
  - `scheduled_time` (timestamptz)
  - `taken_at` (timestamptz, nullable)
  - `status` (text) - 'taken', 'skipped', 'missed'
  - `notes` (text)
  - `created_at` (timestamptz)

  ### 7. chat_history
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `message` (text)
  - `response` (text)
  - `context` (jsonb) - medicine context if any
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Authenticated users only
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  date_of_birth date,
  phone_number text,
  language_preference text DEFAULT 'en',
  theme_preference text DEFAULT 'light',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  doctor_name text,
  clinic_name text,
  prescription_date date,
  notes text,
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prescriptions"
  ON prescriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prescriptions"
  ON prescriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prescriptions"
  ON prescriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own prescriptions"
  ON prescriptions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create medicines database table
CREATE TABLE IF NOT EXISTS medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  generic_name text,
  description text,
  purpose text,
  side_effects text[],
  warnings text[],
  recommended_dosage text,
  category text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view medicines"
  ON medicines FOR SELECT
  TO authenticated
  USING (true);

-- Create user_medicines table
CREATE TABLE IF NOT EXISTS user_medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  prescription_id uuid REFERENCES prescriptions(id) ON DELETE SET NULL,
  medicine_id uuid REFERENCES medicines(id) ON DELETE SET NULL,
  medicine_name text NOT NULL,
  dosage text NOT NULL,
  frequency text NOT NULL,
  duration_days integer,
  start_date date NOT NULL,
  end_date date,
  instructions text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_medicines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own medicines"
  ON user_medicines FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medicines"
  ON user_medicines FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medicines"
  ON user_medicines FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own medicines"
  ON user_medicines FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_medicine_id uuid REFERENCES user_medicines(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reminder_time time NOT NULL,
  days_of_week integer[],
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminders"
  ON reminders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders"
  ON reminders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
  ON reminders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
  ON reminders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create medicine_logs table
CREATE TABLE IF NOT EXISTS medicine_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_medicine_id uuid REFERENCES user_medicines(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  scheduled_time timestamptz NOT NULL,
  taken_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medicine_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs"
  ON medicine_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs"
  ON medicine_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own logs"
  ON medicine_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create chat_history table
CREATE TABLE IF NOT EXISTS chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  response text NOT NULL,
  context jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat history"
  ON chat_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat history"
  ON chat_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prescriptions_user_id ON prescriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_medicines_user_id ON user_medicines(user_id);
CREATE INDEX IF NOT EXISTS idx_user_medicines_active ON user_medicines(user_id, active);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_medicine_logs_user_id ON medicine_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_medicine_logs_scheduled ON medicine_logs(user_id, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);

-- Insert some sample medicine data
INSERT INTO medicines (name, generic_name, description, purpose, side_effects, warnings, recommended_dosage, category) VALUES
  ('Amoxicillin', 'Amoxicillin', 'A penicillin antibiotic', 'Treats bacterial infections', ARRAY['Nausea', 'Diarrhea', 'Rash'], ARRAY['Do not take if allergic to penicillin', 'Complete full course'], '500mg every 8 hours', 'Antibiotic'),
  ('Ibuprofen', 'Ibuprofen', 'A nonsteroidal anti-inflammatory drug (NSAID)', 'Reduces pain, fever, and inflammation', ARRAY['Stomach upset', 'Heartburn', 'Dizziness'], ARRAY['Take with food', 'Do not exceed recommended dose'], '200-400mg every 4-6 hours', 'Pain Relief'),
  ('Metformin', 'Metformin HCL', 'An oral diabetes medication', 'Controls blood sugar levels in type 2 diabetes', ARRAY['Nausea', 'Diarrhea', 'Stomach upset'], ARRAY['Take with meals', 'Monitor blood sugar regularly'], '500-1000mg twice daily', 'Diabetes'),
  ('Omeprazole', 'Omeprazole', 'A proton pump inhibitor', 'Reduces stomach acid production', ARRAY['Headache', 'Nausea', 'Diarrhea'], ARRAY['Take before meals', 'Long-term use may affect bone health'], '20-40mg once daily', 'Digestive')
ON CONFLICT DO NOTHING;