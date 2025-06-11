-- Insert sample inventory items with maintenance data for testing
INSERT INTO inventory_items (
  subaccount_id,
  name,
  category,
  brand,
  purchase_date,
  warranty_expiry,
  last_maintenance,
  maintenance_interval_days,
  status,
  notes
) VALUES 
-- Equipment that needs maintenance soon
(
  (SELECT id FROM subaccounts LIMIT 1),
  'Treadmill Pro X1',
  'Cardio Equipment',
  'FitnessTech',
  '2023-01-15',
  '2025-01-15',
  CURRENT_DATE - INTERVAL '85 days',
  90,
  'working',
  'High-usage treadmill in main cardio area'
),
(
  (SELECT id FROM subaccounts LIMIT 1),
  'Weight Bench Set',
  'Strength Equipment',
  'IronMax',
  '2022-06-10',
  '2024-06-10',
  CURRENT_DATE - INTERVAL '88 days',
  90,
  'working',
  'Adjustable bench with barbell rack'
),
(
  (SELECT id FROM subaccounts LIMIT 1),
  'Elliptical Machine',
  'Cardio Equipment',
  'CardioPlus',
  '2023-03-20',
  '2025-03-20',
  CURRENT_DATE - INTERVAL '60 days',
  60,
  'working',
  'Popular elliptical near windows'
),
-- Equipment with overdue maintenance
(
  (SELECT id FROM subaccounts LIMIT 1),
  'Cable Machine System',
  'Strength Equipment',
  'PowerFlex',
  '2022-08-15',
  '2024-08-15',
  CURRENT_DATE - INTERVAL '95 days',
  90,
  'working',
  'Multi-station cable system - needs urgent maintenance'
),
-- Equipment in good condition
(
  (SELECT id FROM subaccounts LIMIT 1),
  'Rowing Machine',
  'Cardio Equipment',
  'RowTech',
  '2023-05-01',
  '2025-05-01',
  CURRENT_DATE - INTERVAL '30 days',
  90,
  'working',
  'Recently serviced rowing machine'
),
(
  (SELECT id FROM subaccounts LIMIT 1),
  'Leg Press Machine',
  'Strength Equipment',
  'LegPower',
  '2023-02-10',
  '2025-02-10',
  CURRENT_DATE - INTERVAL '45 days',
  120,
  'working',
  'Heavy-duty leg press machine'
);
