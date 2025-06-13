-- Disable RLS on the member-imports bucket
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Create a more permissive policy for the member-imports bucket
DROP POLICY IF EXISTS "Allow authenticated users to upload member import files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read member import files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update member import files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete member import files" ON storage.objects;

-- Create a single policy that allows all operations for authenticated users
CREATE POLICY "Allow all operations on member-imports" ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'member-imports');

-- Make sure the bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'member-imports',
  'Member Import Files',
  true,
  10485760, -- 10MB limit
  ARRAY['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;
