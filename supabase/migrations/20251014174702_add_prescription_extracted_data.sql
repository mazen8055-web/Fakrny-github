/*
  # Add AI-extracted data fields to prescriptions

  ## Purpose
  Enhance the prescriptions table to store AI-extracted information from prescription images.

  ## Changes
  1. Tables Modified
    - `prescriptions`
      - Add `extracted_data` (jsonb) - Store raw AI extraction results
      - Ensure `doctor_name` and `clinic_name` are properly indexed

  2. Security
    - No RLS changes needed (existing policies cover new fields)

  ## Notes
  - The extracted_data field will store the complete AI response for audit purposes
  - This allows us to improve AI accuracy over time by reviewing stored data
*/

-- Add extracted_data column to store full AI response
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prescriptions' AND column_name = 'extracted_data'
  ) THEN
    ALTER TABLE prescriptions ADD COLUMN extracted_data jsonb;
  END IF;
END $$;

-- Create index for doctor_name searches
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_name ON prescriptions(doctor_name);

-- Create index for processed status
CREATE INDEX IF NOT EXISTS idx_prescriptions_processed ON prescriptions(user_id, processed);

-- Add comment for documentation
COMMENT ON COLUMN prescriptions.extracted_data IS 'Raw AI extraction results for audit and improvement purposes';