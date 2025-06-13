-- Check if currency_id column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'accounts' AND column_name = 'currency_id') THEN
        ALTER TABLE accounts ADD COLUMN currency_id INTEGER REFERENCES currency(id);
        
        -- Set default currency_id to 1 (assuming 1 is USD)
        UPDATE accounts SET currency_id = 1 WHERE currency_id IS NULL;
        
        -- Make currency_id NOT NULL after setting defaults
        ALTER TABLE accounts ALTER COLUMN currency_id SET NOT NULL;
    END IF;
END$$;

-- Make sure all required columns have default values or are nullable
ALTER TABLE accounts ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE accounts ALTER COLUMN address DROP NOT NULL;
ALTER TABLE accounts ALTER COLUMN description DROP NOT NULL;

-- Ensure the currency table exists with at least one record
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'currency') THEN
        CREATE TABLE currency (
            id SERIAL PRIMARY KEY,
            code VARCHAR(3) NOT NULL UNIQUE,
            name VARCHAR(50) NOT NULL,
            symbol VARCHAR(5) NOT NULL
        );
        
        -- Insert default currencies
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

-- Update RLS policies to ensure new users can create accounts
DROP POLICY IF EXISTS accounts_insert_policy ON accounts;
CREATE POLICY accounts_insert_policy ON accounts 
    FOR INSERT 
    WITH CHECK (true);  -- Allow any authenticated user to insert

-- Ensure the auth.users can access the accounts table
GRANT SELECT, INSERT, UPDATE ON accounts TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE accounts_id_seq TO authenticated;
