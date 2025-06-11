-- Create notification_rules table
CREATE TABLE IF NOT EXISTS notification_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subaccount_id UUID NOT NULL REFERENCES subaccounts(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('payment_due', 'maintenance_due', 'membership_expiry', 'trainer_assignment')),
    days_before INTEGER DEFAULT 7 CHECK (days_before >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(subaccount_id, event_type)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_rules_subaccount_id ON notification_rules(subaccount_id);
CREATE INDEX IF NOT EXISTS idx_notification_rules_event_type ON notification_rules(event_type);
CREATE INDEX IF NOT EXISTS idx_notification_rules_active ON notification_rules(is_active);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notification_rules_updated_at
    BEFORE UPDATE ON notification_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_rules_updated_at();
