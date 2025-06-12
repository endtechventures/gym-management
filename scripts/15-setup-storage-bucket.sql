-- Create storage bucket for member imports
INSERT INTO storage.buckets (id, name, public)
VALUES ('member-imports', 'member-imports', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Users can upload import files for their subaccount" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'member-imports' AND
  auth.uid() IN (
    SELECT user_id FROM user_accounts 
    WHERE subaccount_id = (storage.foldername(name))[2]::uuid
  )
);

CREATE POLICY "Users can view import files for their subaccount" ON storage.objects
FOR SELECT USING (
  bucket_id = 'member-imports' AND
  auth.uid() IN (
    SELECT user_id FROM user_accounts 
    WHERE subaccount_id = (storage.foldername(name))[2]::uuid
  )
);

CREATE POLICY "Users can delete import files for their subaccount" ON storage.objects
FOR DELETE USING (
  bucket_id = 'member-imports' AND
  auth.uid() IN (
    SELECT user_id FROM user_accounts 
    WHERE subaccount_id = (storage.foldername(name))[2]::uuid
  )
);
