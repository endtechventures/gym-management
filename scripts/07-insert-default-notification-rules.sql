-- Insert default notification rules for existing subaccounts
INSERT INTO notification_rules (subaccount_id, event_type, days_before, is_active)
SELECT 
    s.id as subaccount_id,
    'payment_due' as event_type,
    3 as days_before,
    true as is_active
FROM subaccounts s
WHERE NOT EXISTS (
    SELECT 1 FROM notification_rules nr
    WHERE nr.subaccount_id = s.id 
    AND nr.event_type = 'payment_due'
);

INSERT INTO notification_rules (subaccount_id, event_type, days_before, is_active)
SELECT 
    s.id as subaccount_id,
    'maintenance_due' as event_type,
    7 as days_before,
    true as is_active
FROM subaccounts s
WHERE NOT EXISTS (
    SELECT 1 FROM notification_rules nr
    WHERE nr.subaccount_id = s.id 
    AND nr.event_type = 'maintenance_due'
);

INSERT INTO notification_rules (subaccount_id, event_type, days_before, is_active)
SELECT 
    s.id as subaccount_id,
    'membership_expiry' as event_type,
    7 as days_before,
    true as is_active
FROM subaccounts s
WHERE NOT EXISTS (
    SELECT 1 FROM notification_rules nr
    WHERE nr.subaccount_id = s.id 
    AND nr.event_type = 'membership_expiry'
);
