-- Create a function to get trainer assignments with all related data
CREATE OR REPLACE FUNCTION get_trainer_assignments(p_subaccount_id UUID)
RETURNS TABLE (
  id UUID,
  trainer_id UUID,
  member_id UUID,
  subaccount_id UUID,
  assigned_at TIMESTAMPTZ,
  notes TEXT,
  is_active BOOLEAN,
  trainer JSONB,
  member JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ta.id,
    ta.trainer_id,
    ta.member_id,
    ta.subaccount_id,
    ta.assigned_at,
    ta.notes,
    ta.is_active,
    jsonb_build_object(
      'id', ua.id,
      'users', jsonb_build_object(
        'id', u.id,
        'name', u.name,
        'email', u.email
      )
    ) AS trainer,
    jsonb_build_object(
      'id', m.id,
      'name', m.name,
      'email', m.email
    ) AS member
  FROM 
    trainer_assignments ta
  LEFT JOIN 
    user_accounts ua ON ta.trainer_id = ua.id
  LEFT JOIN 
    users u ON ua.user_id = u.id
  LEFT JOIN 
    members m ON ta.member_id = m.id
  WHERE 
    ta.subaccount_id = p_subaccount_id
  ORDER BY 
    ta.assigned_at DESC;
END;
$$ LANGUAGE plpgsql;
