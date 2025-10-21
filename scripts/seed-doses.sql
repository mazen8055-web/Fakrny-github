-- Script to seed test medicine doses
-- Run this in the Supabase SQL editor to create sample doses for testing

-- First, get your user_id and medicine_id from existing data
-- Replace these with your actual IDs

-- Example: Insert doses for the next few hours
-- You'll need to replace 'YOUR_USER_ID' and 'YOUR_MEDICINE_ID' with actual values

/*
INSERT INTO medicine_doses (user_id, medicine_id, scheduled_time, status)
VALUES
  ('YOUR_USER_ID', 'YOUR_MEDICINE_ID', NOW() + INTERVAL '30 minutes', 'pending'),
  ('YOUR_USER_ID', 'YOUR_MEDICINE_ID', NOW() + INTERVAL '2 hours', 'pending'),
  ('YOUR_USER_ID', 'YOUR_MEDICINE_ID', NOW() + INTERVAL '4 hours', 'pending'),
  ('YOUR_USER_ID', 'YOUR_MEDICINE_ID', NOW() + INTERVAL '6 hours', 'pending'),
  ('YOUR_USER_ID', 'YOUR_MEDICINE_ID', NOW() + INTERVAL '8 hours', 'pending');
*/

-- To get your user_id and medicine_id, run these queries:

-- Get user_id:
-- SELECT id, email FROM auth.users;

-- Get medicine_id:
-- SELECT id, medicine_name FROM user_medicines WHERE user_id = 'YOUR_USER_ID';
