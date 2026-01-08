-- Make bank fields nullable to support credit card refunds (which don't need bank details)
ALTER TABLE refund_requests ALTER COLUMN bank_account_holder DROP NOT NULL;
ALTER TABLE refund_requests ALTER COLUMN bank_account_number DROP NOT NULL;
ALTER TABLE refund_requests ALTER COLUMN bank_account_agency DROP NOT NULL;
ALTER TABLE refund_requests ALTER COLUMN bank_account_type DROP NOT NULL;
ALTER TABLE refund_requests ALTER COLUMN bank_name DROP NOT NULL;
ALTER TABLE refund_requests ALTER COLUMN bank_cpf_cnpj DROP NOT NULL;

-- Add payment_method column to track how refund should be processed
ALTER TABLE refund_requests ADD COLUMN IF NOT EXISTS payment_method TEXT;