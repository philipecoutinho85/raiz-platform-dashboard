-- Drop existing restrictive INSERT policy
DROP POLICY IF EXISTS "Admins can insert refund history" ON refund_status_history;

-- Create new INSERT policy that allows admins and moderators
CREATE POLICY "Admins and moderators can insert refund history" 
ON refund_status_history 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'moderator')
  )
);

-- Also add UPDATE policy in case we need to update history
CREATE POLICY "Admins can update refund history" 
ON refund_status_history 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  )
);