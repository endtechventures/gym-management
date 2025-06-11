-- Check what's in the users table
SELECT 'Users table:' as info;
SELECT id, auth_user_id, name, email, created_at FROM users ORDER BY created_at DESC;

-- Check what's in the user_accounts table
SELECT 'User Accounts table:' as info;
SELECT 
  ua.id,
  ua.user_id,
  ua.subaccount_id,
  ua.role_id,
  u.name as user_name,
  u.email as user_email,
  u.auth_user_id,
  r.name as role_name
FROM user_accounts ua
LEFT JOIN users u ON ua.user_id = u.id
LEFT JOIN roles r ON ua.role_id = r.id
ORDER BY ua.created_at DESC;

-- Check auth.users (if accessible)
SELECT 'Auth users count:' as info;
-- Note: This might not work depending on RLS policies
-- SELECT COUNT(*) as auth_users_count FROM auth.users;
