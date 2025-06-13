-- Update the member_imports table to make file_url nullable
ALTER TABLE member_imports ALTER COLUMN file_url DROP NOT NULL;

-- Update the RLS policies to be more permissive
DROP POLICY IF EXISTS "Users can upload import files for their subaccount" ON storage.objects;

CREATE POLICY "Users can upload import files for their subaccount" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'member-imports' AND
  auth.uid() IS NOT NULL
);

-- Make sure users can access their imports
DROP POLICY IF EXISTS "Users can view imports for their subaccount" ON member_imports;

CREATE POLICY "Users can view imports for their subaccount" ON member_imports
FOR SELECT USING (
  subaccount_id IN (
    SELECT subaccount_id FROM user_accounts 
    WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert imports for their subaccount" ON member_imports;

CREATE POLICY "Users can insert imports for their subaccount" ON member_imports
FOR INSERT WITH CHECK (
  subaccount_id IN (
    SELECT subaccount_id FROM user_accounts 
    WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can update imports for their subaccount" ON member_imports;

CREATE POLICY "Users can update imports for their subaccount" ON member_imports
FOR UPDATE USING (
  subaccount_id IN (
    SELECT subaccount_id FROM user_accounts 
    WHERE user_id = auth.uid()
  )
);
