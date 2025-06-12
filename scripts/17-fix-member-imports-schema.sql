-- Make file_url optional in member_imports table
ALTER TABLE member_imports 
ALTER COLUMN file_url DROP NOT NULL;

-- Add a comment to clarify the column is optional
COMMENT ON COLUMN member_imports.file_url IS 'Optional URL to the uploaded file. Can be null for direct imports.';
