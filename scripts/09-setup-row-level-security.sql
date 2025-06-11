-- Enable Row Level Security on new tables
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventory_items
CREATE POLICY "Users can view inventory items for their subaccount" ON inventory_items
    FOR SELECT USING (
        subaccount_id IN (
            SELECT ua.subaccount_id 
            FROM user_accounts ua 
            WHERE ua.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert inventory items for their subaccount" ON inventory_items
    FOR INSERT WITH CHECK (
        subaccount_id IN (
            SELECT ua.subaccount_id 
            FROM user_accounts ua 
            WHERE ua.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update inventory items for their subaccount" ON inventory_items
    FOR UPDATE USING (
        subaccount_id IN (
            SELECT ua.subaccount_id 
            FROM user_accounts ua 
            WHERE ua.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete inventory items for their subaccount" ON inventory_items
    FOR DELETE USING (
        subaccount_id IN (
            SELECT ua.subaccount_id 
            FROM user_accounts ua 
            WHERE ua.user_id = auth.uid()
        )
    );

-- RLS Policies for trainer_assignments
CREATE POLICY "Users can view trainer assignments for their subaccount" ON trainer_assignments
    FOR SELECT USING (
        subaccount_id IN (
            SELECT ua.subaccount_id 
            FROM user_accounts ua 
            WHERE ua.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert trainer assignments for their subaccount" ON trainer_assignments
    FOR INSERT WITH CHECK (
        subaccount_id IN (
            SELECT ua.subaccount_id 
            FROM user_accounts ua 
            WHERE ua.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update trainer assignments for their subaccount" ON trainer_assignments
    FOR UPDATE USING (
        subaccount_id IN (
            SELECT ua.subaccount_id 
            FROM user_accounts ua 
            WHERE ua.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete trainer assignments for their subaccount" ON trainer_assignments
    FOR DELETE USING (
        subaccount_id IN (
            SELECT ua.subaccount_id 
            FROM user_accounts ua 
            WHERE ua.user_id = auth.uid()
        )
    );

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for notification_rules
CREATE POLICY "Users can view notification rules for their subaccount" ON notification_rules
    FOR SELECT USING (
        subaccount_id IN (
            SELECT ua.subaccount_id 
            FROM user_accounts ua 
            WHERE ua.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage notification rules for their subaccount" ON notification_rules
    FOR ALL USING (
        subaccount_id IN (
            SELECT ua.subaccount_id 
            FROM user_accounts ua 
            WHERE ua.user_id = auth.uid()
        )
    );

-- RLS Policies for expenses
CREATE POLICY "Users can view expenses for their subaccount" ON expenses
    FOR SELECT USING (
        subaccount_id IN (
            SELECT ua.subaccount_id 
            FROM user_accounts ua 
            WHERE ua.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert expenses for their subaccount" ON expenses
    FOR INSERT WITH CHECK (
        subaccount_id IN (
            SELECT ua.subaccount_id 
            FROM user_accounts ua 
            WHERE ua.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update expenses for their subaccount" ON expenses
    FOR UPDATE USING (
        subaccount_id IN (
            SELECT ua.subaccount_id 
            FROM user_accounts ua 
            WHERE ua.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete expenses for their subaccount" ON expenses
    FOR DELETE USING (
        subaccount_id IN (
            SELECT ua.subaccount_id 
            FROM user_accounts ua 
            WHERE ua.user_id = auth.uid()
        )
    );
