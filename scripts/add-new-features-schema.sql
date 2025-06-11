-- Add theme_color column to existing subaccounts table
ALTER TABLE subaccounts ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT '#0d9488';

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subaccount_id UUID REFERENCES subaccounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    brand TEXT,
    purchase_date DATE,
    warranty_expiry DATE,
    last_maintenance DATE,
    next_maintenance DATE,
    status TEXT DEFAULT 'working',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create trainer_assignments table
CREATE TABLE IF NOT EXISTS trainer_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    member_id UUID, -- Optional reference to members
    plan_id UUID,   -- Optional reference to plans
    subaccount_id UUID REFERENCES subaccounts(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT NOW(),
    notes TEXT
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subaccount_id UUID REFERENCES subaccounts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'info', -- info, warning, payment, maintenance
    is_read BOOLEAN DEFAULT FALSE,
    triggered_at TIMESTAMP DEFAULT NOW()
);

-- Create notification_rules table
CREATE TABLE IF NOT EXISTS notification_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subaccount_id UUID REFERENCES subaccounts(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- payment_due, maintenance_due
    days_before INTEGER DEFAULT 7,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subaccount_id UUID REFERENCES subaccounts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    expense_type TEXT, -- maintenance, rent, utility, equipment, etc.
    description TEXT,
    incurred_on DATE NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_subaccount ON inventory_items(subaccount_id);
CREATE INDEX IF NOT EXISTS idx_trainer_assignments_subaccount ON trainer_assignments(subaccount_id);
CREATE INDEX IF NOT EXISTS idx_trainer_assignments_trainer ON trainer_assignments(trainer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_subaccount ON notifications(subaccount_id);
CREATE INDEX IF NOT EXISTS idx_notification_rules_subaccount ON notification_rules(subaccount_id);
CREATE INDEX IF NOT EXISTS idx_expenses_subaccount ON expenses(subaccount_id);

-- Insert default notification rules for each existing subaccount
INSERT INTO notification_rules (subaccount_id, event_type, days_before, is_active)
SELECT 
    id as subaccount_id,
    'payment_due' as event_type,
    3 as days_before,
    true as is_active
FROM subaccounts
WHERE NOT EXISTS (
    SELECT 1 FROM notification_rules 
    WHERE subaccount_id = subaccounts.id 
    AND event_type = 'payment_due'
);

INSERT INTO notification_rules (subaccount_id, event_type, days_before, is_active)
SELECT 
    id as subaccount_id,
    'maintenance_due' as event_type,
    7 as days_before,
    true as is_active
FROM subaccounts
WHERE NOT EXISTS (
    SELECT 1 FROM notification_rules 
    WHERE subaccount_id = subaccounts.id 
    AND event_type = 'maintenance_due'
);
