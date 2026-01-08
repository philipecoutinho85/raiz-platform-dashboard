-- Drop existing policies on refund_requests
DROP POLICY IF EXISTS "Admins can view all refund requests" ON public.refund_requests;
DROP POLICY IF EXISTS "Admins can update all refund requests" ON public.refund_requests;

-- Create correct policies using user_roles table
CREATE POLICY "Admins can view all refund requests" 
ON public.refund_requests 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can update all refund requests" 
ON public.refund_requests 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);