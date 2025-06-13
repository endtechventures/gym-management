-- First, ensure the bucket exists (this is safe to run even if it exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'member-imports',
  'Member Import Files',
  false, -- not public by default
  10485760, -- 10MB limit
  ARRAY['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;

-- Remove any existing policies for the bucket
BEGIN;
  -- Get all policies for the member-imports bucket
  DO $$
  DECLARE
    policy_record RECORD;
  BEGIN
    FOR policy_record IN 
      SELECT policy_name 
      FROM storage.policies 
      WHERE bucket_id = 'member-imports'
    LOOP
      -- Drop each policy
      EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_record.policy_name);
    END LOOP;
  END $$;
COMMIT;

-- Create policies for authenticated users to perform all operations on the member-imports bucket
-- Policy for INSERT operations
CREATE POLICY "Allow authenticated users to upload member import files" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'member-imports');

-- Policy for SELECT operations
CREATE POLICY "Allow authenticated users to read member import files" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'member-imports');

-- Policy for UPDATE operations
CREATE POLICY "Allow authenticated users to update member import files" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'member-imports')
WITH CHECK (bucket_id = 'member-imports');

-- Policy for DELETE operations
CREATE POLICY "Allow authenticated users to delete member import files" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'member-imports');

-- Enable RLS on the objects table (it should be enabled by default, but just to be sure)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Make the bucket public to allow public URLs to work
UPDATE storage.buckets 
SET public = true 
WHERE id = 'member-imports';
