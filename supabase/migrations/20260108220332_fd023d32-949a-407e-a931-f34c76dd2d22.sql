-- Create storage bucket for refund proofs if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('refund-proofs', 'refund-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for refund-proofs bucket
CREATE POLICY "Admins can upload refund proofs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'refund-proofs' AND
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Users can view their own refund proofs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'refund-proofs' AND (
    EXISTS (
      SELECT 1 FROM public.refund_requests rr
      WHERE rr.proof_of_payment_url = name
      AND rr.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  )
);

CREATE POLICY "Admins can delete refund proofs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'refund-proofs' AND
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);