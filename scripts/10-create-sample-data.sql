-- Insert sample inventory items (only if subaccounts exist)
INSERT INTO inventory_items (subaccount_id, name, category, brand, purchase_date, warranty_expiry, next_maintenance, status, notes)
SELECT 
    s.id,
    'Treadmill #1',
    'Cardio Equipment',
    'Life Fitness',
    '2023-01-15'::date,
    '2025-01-15'::date,
    CURRENT_DATE + INTERVAL '30 days',
    'working',
    'Main cardio area - high usage'
FROM subaccounts s
LIMIT 1;

INSERT INTO inventory_items (subaccount_id, name, category, brand, purchase_date, warranty_expiry, next_maintenance, status, notes)
SELECT 
    s.id,
    'Bench Press Station',
    'Strength Equipment',
    'Hammer Strength',
    '2022-06-10'::date,
    '2024-06-10'::date,
    CURRENT_DATE + INTERVAL '60 days',
    'working',
    'Free weights area'
FROM subaccounts s
LIMIT 1;

-- Insert sample expenses (only if subaccounts exist)
INSERT INTO expenses (subaccount_id, title, amount, expense_type, description, incurred_on, created_by)
SELECT 
    s.id,
    'Monthly Rent',
    2500.00,
    'rent',
    'Monthly facility rent payment',
    CURRENT_DATE - INTERVAL '5 days',
    (SELECT u.id FROM users u JOIN user_accounts ua ON ua.user_id = u.id WHERE ua.subaccount_id = s.id LIMIT 1)
FROM subaccounts s
LIMIT 1;

INSERT INTO expenses (subaccount_id, title, amount, expense_type, description, incurred_on, created_by)
SELECT 
    s.id,
    'Equipment Maintenance',
    350.00,
    'maintenance',
    'Quarterly maintenance for cardio equipment',
    CURRENT_DATE - INTERVAL '2 days',
    (SELECT u.id FROM users u JOIN user_accounts ua ON ua.user_id = u.id WHERE ua.subaccount_id = s.id LIMIT 1)
FROM subaccounts s
LIMIT 1;
