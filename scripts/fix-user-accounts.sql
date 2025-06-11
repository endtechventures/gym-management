-- Check if there are any user accounts for the subaccount
SELECT 
  ua.id as user_account_id, 
  u.id as user_id, 
  u.name as user_name, 
  u.email as user_email,
  u.auth_user_id,
  r.name as role_name,
  s.id as subaccount_id,
  s.name as subaccount_name
FROM 
  user_accounts ua
JOIN 
  users u ON ua.user_id = u.id
JOIN 
  roles r ON ua.role_id = r.id
JOIN 
  subaccounts s ON ua.subaccount_id = s.id
LIMIT 10;

-- Check if there are any auth users that don't have corresponding users records
SELECT 
  au.id as auth_user_id, 
  au.email as auth_email,
  u.id as user_id,
  u.name as user_name,
  u.email as user_email
FROM 
  auth.users au
LEFT JOIN 
  users u ON au.id = u.auth_user_id
LIMIT 10;
