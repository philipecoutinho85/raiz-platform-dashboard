-- Operational exception queue.
-- Goal: keep core flows automated and route only unavoidable exceptions to an auditable queue.

CREATE TABLE IF NOT EXISTS public.operational_exception_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  source_id uuid,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'retry_scheduled', 'resolved', 'dismissed')),
  reason text NOT NULL,
  next_retry_at timestamptz,
  retry_count integer NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (source, source_id, reason)
);

ALTER TABLE public.operational_exception_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view operational exception queue" ON public.operational_exception_queue;
CREATE POLICY "Admins can view operational exception queue"
ON public.operational_exception_queue
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_operational_exception_queue_status
ON public.operational_exception_queue(status, severity, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_operational_exception_queue_retry
ON public.operational_exception_queue(status, next_retry_at)
WHERE status = 'retry_scheduled';

CREATE OR REPLACE FUNCTION public.record_operational_exception(
  p_source text,
  p_source_id uuid,
  p_user_id uuid DEFAULT NULL,
  p_project_id uuid DEFAULT NULL,
  p_severity text DEFAULT 'medium',
  p_reason text DEFAULT 'workflow_exception',
  p_next_retry_at timestamptz DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.operational_exception_queue (
    source,
    source_id,
    user_id,
    project_id,
    severity,
    status,
    reason,
    next_retry_at,
    metadata
  )
  VALUES (
    COALESCE(NULLIF(trim(p_source), ''), 'unknown'),
    p_source_id,
    p_user_id,
    p_project_id,
    CASE WHEN p_severity IN ('low', 'medium', 'high', 'critical') THEN p_severity ELSE 'medium' END,
    CASE WHEN p_next_retry_at IS NULL THEN 'open' ELSE 'retry_scheduled' END,
    COALESCE(NULLIF(trim(p_reason), ''), 'workflow_exception'),
    p_next_retry_at,
    COALESCE(p_metadata, '{}'::jsonb)
  )
  ON CONFLICT (source, source_id, reason)
  DO UPDATE SET
    status = CASE WHEN EXCLUDED.next_retry_at IS NULL THEN 'open' ELSE 'retry_scheduled' END,
    severity = EXCLUDED.severity,
    next_retry_at = EXCLUDED.next_retry_at,
    retry_count = public.operational_exception_queue.retry_count + 1,
    metadata = public.operational_exception_queue.metadata || EXCLUDED.metadata,
    updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_operational_exception(
  p_source text,
  p_source_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.operational_exception_queue
  SET status = 'resolved',
      resolved_at = now(),
      resolved_by = auth.uid(),
      updated_at = now()
  WHERE source = p_source
    AND source_id = p_source_id
    AND (p_reason IS NULL OR reason = p_reason)
    AND status <> 'resolved';
END;
$$;

REVOKE ALL ON FUNCTION public.record_operational_exception(text, uuid, uuid, uuid, text, text, timestamptz, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_operational_exception(text, uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.record_operational_exception(text, uuid, uuid, uuid, text, text, timestamptz, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.resolve_operational_exception(text, uuid, text) TO service_role;
GRANT SELECT ON public.operational_exception_queue TO authenticated;
