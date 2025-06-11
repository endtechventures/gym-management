-- Create maintenance table for equipment maintenance scheduling
CREATE TABLE IF NOT EXISTS maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subaccount_id UUID NOT NULL REFERENCES subaccounts(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  equipment_name VARCHAR(255),
  equipment_id UUID,
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
  priority VARCHAR(50) NOT NULL DEFAULT 'medium',
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_subaccount ON maintenance(subaccount_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_scheduled_date ON maintenance(scheduled_date);

-- Add sample maintenance data
INSERT INTO maintenance (subaccount_id, title, description, equipment_name, scheduled_date, status, priority)
SELECT 
  s.id,
  'Treadmill Maintenance',
  'Regular maintenance for treadmills',
  'Treadmill #' || floor(random() * 10 + 1)::text,
  (CURRENT_DATE + (floor(random() * 14)::int || ' days')::interval)::date,
  CASE WHEN random() < 0.8 THEN 'scheduled' ELSE 'completed' END,
  CASE 
    WHEN random() < 0.2 THEN 'high'
    WHEN random() < 0.6 THEN 'medium'
    ELSE 'low'
  END
FROM subaccounts s
CROSS JOIN generate_series(1, 3) AS i;

INSERT INTO maintenance (subaccount_id, title, description, equipment_name, scheduled_date, status, priority)
SELECT 
  s.id,
  'Weight Machine Inspection',
  'Safety inspection for weight machines',
  'Weight Machine #' || floor(random() * 8 + 1)::text,
  (CURRENT_DATE + (floor(random() * 10)::int || ' days')::interval)::date,
  CASE WHEN random() < 0.8 THEN 'scheduled' ELSE 'completed' END,
  CASE 
    WHEN random() < 0.3 THEN 'high'
    WHEN random() < 0.7 THEN 'medium'
    ELSE 'low'
  END
FROM subaccounts s
CROSS JOIN generate_series(1, 2) AS i;

INSERT INTO maintenance (subaccount_id, title, description, equipment_name, scheduled_date, status, priority)
SELECT 
  s.id,
  'HVAC System Maintenance',
  'Regular maintenance for air conditioning system',
  'HVAC Unit',
  (CURRENT_DATE + (floor(random() * 7)::int || ' days')::interval)::date,
  'scheduled',
  'high'
FROM subaccounts s
LIMIT 3;

-- Add some maintenance scheduled for today
INSERT INTO maintenance (subaccount_id, title, description, equipment_name, scheduled_date, status, priority)
SELECT 
  s.id,
  'Urgent Equipment Repair',
  'Repair broken equipment',
  'Elliptical #3',
  CURRENT_DATE,
  'scheduled',
  'high'
FROM subaccounts s
LIMIT 2;
