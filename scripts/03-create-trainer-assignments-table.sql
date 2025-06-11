-- Create trainer_assignments table
CREATE TABLE IF NOT EXISTS trainer_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    member_id UUID, -- Optional reference to members (if members table exists)
    plan_id UUID,   -- Optional reference to plans (if plans table exists)
    subaccount_id UUID NOT NULL REFERENCES subaccounts(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trainer_assignments_subaccount_id ON trainer_assignments(subaccount_id);
CREATE INDEX IF NOT EXISTS idx_trainer_assignments_trainer_id ON trainer_assignments(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_assignments_member_id ON trainer_assignments(member_id) WHERE member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trainer_assignments_plan_id ON trainer_assignments(plan_id) WHERE plan_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trainer_assignments_active ON trainer_assignments(is_active);
