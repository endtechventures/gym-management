-- Check if currency table exists, if not create it with UUID primary key
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'currency') THEN
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        CREATE TABLE currency (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            code VARCHAR(3) NOT NULL UNIQUE,
            name VARCHAR(50) NOT NULL,
            symbol VARCHAR(5) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Insert default currencies with UUID
        INSERT INTO currency (code, name, symbol) VALUES 
            ('USD', 'US Dollar', '$'),
            ('EUR', 'Euro', '€'),
            ('GBP', 'British Pound', '£'),
            ('CAD', 'Canadian Dollar', 'C$');
    END IF;
    
    -- Ensure at least one currency exists
    IF NOT EXISTS (SELECT 1 FROM currency LIMIT 1) THEN
        INSERT INTO currency (code, name, symbol) VALUES ('USD', 'US Dollar', '$');
    END IF;
END$$;

-- Make sure accounts.currency_id is a UUID type and references currency.id
DO $$
DECLARE
    column_type TEXT;
BEGIN
    -- Check the data type of currency_id in accounts table
    SELECT data_type INTO column_type 
    FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'currency_id';
    
    -- If it's not UUID, alter it
    IF column_type != 'uuid' THEN
        -- First drop any existing foreign key constraints
        EXECUTE (
            SELECT 'ALTER TABLE accounts DROP CONSTRAINT ' || conname
            FROM pg_constraint
            WHERE conrelid = 'accounts'::regclass
            AND conname LIKE '%currency_id%'
            LIMIT 1
        );
        
        -- Then alter the column type
        ALTER TABLE accounts ALTER COLUMN currency_id TYPE UUID USING NULL;
        
        -- Add foreign key constraint
        ALTER TABLE accounts 
        ADD CONSTRAINT accounts_currency_id_fkey 
        FOREIGN KEY (currency_id) REFERENCES currency(id);
    END IF;
END$$;

-- Update RLS policies to ensure new users can create accounts
DROP POLICY IF EXISTS accounts_insert_policy ON accounts;
CREATE POLICY accounts_insert_policy ON accounts 
    FOR INSERT 
    WITH CHECK (true);  -- Allow any authenticated user to insert

-- Ensure the auth.users can access the accounts table
GRANT SELECT, INSERT, UPDATE ON accounts TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE accounts_id_seq TO authenticated;

-- Make sure all required columns have default values or are nullable
ALTER TABLE accounts ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE accounts ALTER COLUMN address DROP NOT NULL;
ALTER TABLE accounts ALTER COLUMN description DROP NOT NULL;
