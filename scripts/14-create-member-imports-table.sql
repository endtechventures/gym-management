-- Create member_imports table for tracking import jobs
CREATE TABLE IF NOT EXISTS member_imports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subaccount_id UUID NOT NULL REFERENCES subaccounts(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    total_rows INTEGER DEFAULT 0,
    processed_rows INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    column_mapping JSONB,
    logs TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_member_imports_subaccount FOREIGN KEY (subaccount_id) REFERENCES subaccounts(id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_member_imports_subaccount_id ON member_imports(subaccount_id);
CREATE INDEX IF NOT EXISTS idx_member_imports_status ON member_imports(status);
CREATE INDEX IF NOT EXISTS idx_member_imports_uploaded_by ON member_imports(uploaded_by);

-- Enable RLS
ALTER TABLE member_imports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view imports for their subaccount" ON member_imports
    FOR SELECT USING (
        subaccount_id IN (
            SELECT subaccount_id FROM user_accounts 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert imports for their subaccount" ON member_imports
    FOR INSERT WITH CHECK (
        subaccount_id IN (
            SELECT subaccount_id FROM user_accounts 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update imports for their subaccount" ON member_imports
    FOR UPDATE USING (
        subaccount_id IN (
            SELECT subaccount_id FROM user_accounts 
            WHERE user_id = auth.uid()
        )
    );
