/*
  # Add Disclaimer Acceptance to Profiles

  1. Changes
    - Add `disclaimer_accepted` boolean field to profiles table
    - Add `disclaimer_accepted_at` timestamp field to profiles table
    - Set default to false for disclaimer_accepted

  2. Purpose
    - Track user acceptance of medical disclaimer
    - Required for Google Play compliance
    - Legal requirement for health apps
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'disclaimer_accepted'
  ) THEN
    ALTER TABLE profiles ADD COLUMN disclaimer_accepted boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'disclaimer_accepted_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN disclaimer_accepted_at timestamptz;
  END IF;
END $$;
