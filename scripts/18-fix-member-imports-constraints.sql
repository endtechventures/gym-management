-- First, check if the table exists and what constraints we have
DO $$
BEGIN
    -- Drop the NOT NULL constraint on file_url if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'member_imports' 
        AND column_name = 'file_url' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE member_imports ALTER COLUMN file_url DROP NOT NULL;
        RAISE NOTICE 'Dropped NOT NULL constraint on file_url column';
    ELSE
        RAISE NOTICE 'file_url column is already nullable or does not exist';
    END IF;
    
    -- Also make sure the table structure is correct
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'member_imports'
    ) THEN
        -- Create the table if it doesn't exist
        CREATE TABLE member_imports (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            subaccount_id UUID NOT NULL REFERENCES subaccounts(id) ON DELETE CASCADE,
            uploaded_by UUID NOT NULL,
            file_name TEXT NOT NULL,
            file_url TEXT, -- This is now nullable
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
            total_rows INTEGER DEFAULT 0,
            processed_rows INTEGER DEFAULT 0,
            success_count INTEGER DEFAULT 0,
            error_count INTEGER DEFAULT 0,
            column_mapping JSONB,
            logs TEXT[],
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            completed_at TIMESTAMP WITH TIME ZONE
        );
        
        RAISE NOTICE 'Created member_imports table';
    END IF;
END $$;

-- Add comment to clarify the column is optional
COMMENT ON COLUMN member_imports.file_url IS 'Optional URL to the uploaded file. Can be null for direct imports.';

-- Ensure RLS is disabled for this table (since we disabled it earlier)
ALTER TABLE member_imports DISABLE ROW LEVEL SECURITY;

RAISE NOTICE 'Member imports table schema updated successfully';
