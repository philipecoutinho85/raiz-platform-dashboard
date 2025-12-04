-- Drop existing INSERT policy if exists
DROP POLICY IF EXISTS "Admins can insert messages" ON public.withdrawal_messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.withdrawal_messages;
DROP POLICY IF EXISTS "Allow insert for admins" ON public.withdrawal_messages;
DROP POLICY IF EXISTS "Allow insert for users" ON public.withdrawal_messages;

-- Create policy for admins to insert messages
CREATE POLICY "Admins can insert withdrawal messages"
ON public.withdrawal_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
  AND sender_type = 'admin'
  AND sender_id = auth.uid()
);

-- Create policy for users to insert messages (only for their own withdrawals)
CREATE POLICY "Users can insert withdrawal messages"
ON public.withdrawal_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.withdrawals
    WHERE withdrawals.id = withdrawal_messages.withdrawal_id
    AND withdrawals.user_id = auth.uid()
  )
  AND sender_type = 'user'
  AND sender_id = auth.uid()
);

-- Ensure admins can read all messages
DROP POLICY IF EXISTS "Admins can view all messages" ON public.withdrawal_messages;
CREATE POLICY "Admins can view all withdrawal messages"
ON public.withdrawal_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Ensure users can read messages from their withdrawals
DROP POLICY IF EXISTS "Users can view their messages" ON public.withdrawal_messages;
CREATE POLICY "Users can view their withdrawal messages"
ON public.withdrawal_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.withdrawals
    WHERE withdrawals.id = withdrawal_messages.withdrawal_id
    AND withdrawals.user_id = auth.uid()
  )
);

-- Allow admins to update messages (mark as read)
DROP POLICY IF EXISTS "Admins can update messages" ON public.withdrawal_messages;
CREATE POLICY "Admins can update withdrawal messages"
ON public.withdrawal_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow users to update their messages (mark as read)
DROP POLICY IF EXISTS "Users can update their messages" ON public.withdrawal_messages;
CREATE POLICY "Users can update their withdrawal messages"
ON public.withdrawal_messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.withdrawals
    WHERE withdrawals.id = withdrawal_messages.withdrawal_id
    AND withdrawals.user_id = auth.uid()
  )
);