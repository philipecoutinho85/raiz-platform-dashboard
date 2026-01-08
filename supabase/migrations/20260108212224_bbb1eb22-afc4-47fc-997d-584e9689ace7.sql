-- Add RLS policy for admins to view all refund requests
CREATE POLICY "Admins can view all refund requests"
ON public.refund_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type IN ('admin', 'super_admin', 'moderator')
  )
);

-- Add RLS policy for admins to update refund requests
CREATE POLICY "Admins can update refund requests"
ON public.refund_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type IN ('admin', 'super_admin', 'moderator')
  )
);