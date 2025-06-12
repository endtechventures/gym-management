-- Create the member-imports bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'member-imports',
  'Member Import Files',
  true,
  10485760, -- 10MB limit
  ARRAY['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create storage policies for the member-imports bucket
-- Policy for uploading files
CREATE POLICY "Allow authenticated users to upload member import files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'member-imports');

-- Policy for reading files
CREATE POLICY "Allow authenticated users to read member import files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'member-imports');

-- Policy for updating files
CREATE POLICY "Allow authenticated users to update member import files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'member-imports');

-- Policy for deleting files
CREATE POLICY "Allow authenticated users to delete member import files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'member-imports');
