-- Update app_metadata for existing users to include user_type from raw_user_meta_data
UPDATE auth.users
SET app_metadata = app_metadata || jsonb_build_object('user_type', raw_user_meta_data->>'user_type')
WHERE
  raw_user_meta_data->>'user_type' IS NOT NULL
  AND (app_metadata->>'user_type' IS NULL OR app_metadata->>'user_type' = '');

-- Optional: Verify the update (run this as a separate query)
-- SELECT id, email, raw_user_meta_data, app_metadata FROM auth.users;