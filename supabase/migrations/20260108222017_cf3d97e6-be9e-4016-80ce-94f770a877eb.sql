-- Create refund status history table
CREATE TABLE public.refund_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  refund_request_id UUID NOT NULL REFERENCES public.refund_requests(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID NOT NULL,
  notes TEXT,
  proof_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.refund_status_history ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own refund history
CREATE POLICY "Users can view their own refund history"
ON public.refund_status_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.refund_requests rr
    WHERE rr.id = refund_request_id AND rr.user_id = auth.uid()
  )
);

-- Policy for admins to view all history
CREATE POLICY "Admins can view all refund history"
ON public.refund_status_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Policy for admins to insert history
CREATE POLICY "Admins can insert refund history"
ON public.refund_status_history
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Create index for faster queries
CREATE INDEX idx_refund_status_history_request ON public.refund_status_history(refund_request_id);
CREATE INDEX idx_refund_status_history_created ON public.refund_status_history(created_at DESC);