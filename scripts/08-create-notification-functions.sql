-- Function to generate payment due notifications
CREATE OR REPLACE FUNCTION generate_payment_due_notifications()
RETURNS void AS $$
DECLARE
    rule_record RECORD;
    member_record RECORD;
    notification_title TEXT;
    notification_message TEXT;
BEGIN
    -- Loop through active payment due notification rules
    FOR rule_record IN 
        SELECT nr.*, s.name as subaccount_name
        FROM notification_rules nr
        JOIN subaccounts s ON s.id = nr.subaccount_id
        WHERE nr.event_type = 'payment_due' 
        AND nr.is_active = TRUE
    LOOP
        -- Find members with payments due within the specified days
        FOR member_record IN
            SELECT m.*, u.name as member_name
            FROM members m
            JOIN users u ON u.id = m.user_id
            WHERE m.subaccount_id = rule_record.subaccount_id
            AND m.next_payment IS NOT NULL
            AND m.next_payment::date = (CURRENT_DATE + rule_record.days_before)
        LOOP
            notification_title := 'Payment Due Reminder';
            notification_message := format('Payment for %s is due on %s', 
                member_record.member_name, 
                member_record.next_payment::date
            );
            
            -- Insert notification for relevant users (managers, owners)
            INSERT INTO notifications (user_id, subaccount_id, title, message, type)
            SELECT ua.user_id, rule_record.subaccount_id, notification_title, notification_message, 'payment'
            FROM user_accounts ua
            JOIN roles r ON r.id = ua.role_id
            WHERE ua.subaccount_id = rule_record.subaccount_id
            AND r.name IN ('owner', 'manager')
            AND NOT EXISTS (
                SELECT 1 FROM notifications n
                WHERE n.user_id = ua.user_id
                AND n.subaccount_id = rule_record.subaccount_id
                AND n.title = notification_title
                AND n.message = notification_message
                AND n.triggered_at::date = CURRENT_DATE
            );
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to generate maintenance due notifications
CREATE OR REPLACE FUNCTION generate_maintenance_due_notifications()
RETURNS void AS $$
DECLARE
    rule_record RECORD;
    inventory_record RECORD;
    notification_title TEXT;
    notification_message TEXT;
BEGIN
    -- Loop through active maintenance due notification rules
    FOR rule_record IN 
        SELECT nr.*, s.name as subaccount_name
        FROM notification_rules nr
        JOIN subaccounts s ON s.id = nr.subaccount_id
        WHERE nr.event_type = 'maintenance_due' 
        AND nr.is_active = TRUE
    LOOP
        -- Find inventory items with maintenance due within the specified days
        FOR inventory_record IN
            SELECT *
            FROM inventory_items
            WHERE subaccount_id = rule_record.subaccount_id
            AND next_maintenance IS NOT NULL
            AND next_maintenance = (CURRENT_DATE + rule_record.days_before)
            AND status = 'working'
        LOOP
            notification_title := 'Equipment Maintenance Due';
            notification_message := format('Maintenance for %s is due on %s', 
                inventory_record.name, 
                inventory_record.next_maintenance
            );
            
            -- Insert notification for relevant users (managers, owners)
            INSERT INTO notifications (user_id, subaccount_id, title, message, type)
            SELECT ua.user_id, rule_record.subaccount_id, notification_title, notification_message, 'maintenance'
            FROM user_accounts ua
            JOIN roles r ON r.id = ua.role_id
            WHERE ua.subaccount_id = rule_record.subaccount_id
            AND r.name IN ('owner', 'manager')
            AND NOT EXISTS (
                SELECT 1 FROM notifications n
                WHERE n.user_id = ua.user_id
                AND n.subaccount_id = rule_record.subaccount_id
                AND n.title = notification_title
                AND n.message = notification_message
                AND n.triggered_at::date = CURRENT_DATE
            );
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to run all notification generators (to be called by cron job)
CREATE OR REPLACE FUNCTION generate_daily_notifications()
RETURNS void AS $$
BEGIN
    PERFORM generate_payment_due_notifications();
    PERFORM generate_maintenance_due_notifications();
END;
$$ LANGUAGE plpgsql;
