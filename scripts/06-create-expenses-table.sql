-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subaccount_id UUID NOT NULL REFERENCES subaccounts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
    expense_type TEXT CHECK (expense_type IN ('maintenance', 'rent', 'utility', 'equipment', 'marketing', 'salary', 'insurance', 'other')),
    description TEXT,
    incurred_on DATE NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    receipt_url TEXT -- Optional field for storing receipt/invoice URLs
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_subaccount_id ON expenses(subaccount_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_type ON expenses(expense_type);
CREATE INDEX IF NOT EXISTS idx_expenses_incurred_on ON expenses(incurred_on DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at DESC);
