-- Add theme_color column to existing subaccounts table
ALTER TABLE subaccounts 
ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT '#0d9488';

-- Update existing subaccounts with default theme color if null
UPDATE subaccounts 
SET theme_color = '#0d9488' 
WHERE theme_color IS NULL;
