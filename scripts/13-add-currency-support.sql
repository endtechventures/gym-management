-- Create currency table
CREATE TABLE IF NOT EXISTS currency (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(3) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL,
  symbol VARCHAR(5) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on currency code for faster lookups
CREATE INDEX IF NOT EXISTS idx_currency_code ON currency(code);

-- Insert default currencies
INSERT INTO currency (code, name, symbol)
VALUES 
  ('INR', 'Indian Rupee', '₹'),
  ('USD', 'US Dollar', '$')
ON CONFLICT (code) DO NOTHING;

-- Add currency_id column to accounts table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'accounts' AND column_name = 'currency_id'
  ) THEN
    -- Add currency_id column with foreign key constraint
    ALTER TABLE accounts ADD COLUMN currency_id UUID REFERENCES currency(id);
    
    -- Set default currency to INR for all existing accounts
    UPDATE accounts SET currency_id = (SELECT id FROM currency WHERE code = 'INR');
    
    -- Make currency_id NOT NULL after setting defaults
    ALTER TABLE accounts ALTER COLUMN currency_id SET NOT NULL;
    
    -- Add index for faster joins
    CREATE INDEX idx_accounts_currency_id ON accounts(currency_id);
  END IF;
END $$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to currency table
DROP TRIGGER IF EXISTS update_currency_timestamp ON currency;
CREATE TRIGGER update_currency_timestamp
BEFORE UPDATE ON currency
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
