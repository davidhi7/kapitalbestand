CREATE TYPE recurrence_frequency AS ENUM ('monthly', 'yearly');

ALTER TABLE monthly_transactions RENAME TO recurring_transactions;

ALTER TABLE recurring_transactions RENAME COLUMN month_from TO interval_from;
ALTER TABLE recurring_transactions RENAME COLUMN month_to TO interval_to;

-- Add the new frequency column with default value for existing rows
ALTER TABLE recurring_transactions ADD COLUMN frequency recurrence_frequency NOT NULL DEFAULT 'monthly';
-- Remove the default value for rows inserted later
ALTER TABLE recurring_transactions ALTER COLUMN frequency DROP DEFAULT;

ALTER TABLE recurring_transactions RENAME CONSTRAINT monthly_transactions_pkey TO recurring_transactions_pkey;
ALTER TABLE recurring_transactions RENAME CONSTRAINT monthly_transactions_category_id_fkey TO recurring_transactions_category_id_fkey;
ALTER TABLE recurring_transactions RENAME CONSTRAINT monthly_transactions_shop_id_fkey TO recurring_transactions_shop_id_fkey;
ALTER TABLE recurring_transactions RENAME CONSTRAINT monthly_transactions_user_id_fkey TO recurring_transactions_user_id_fkey;

ALTER TABLE recurring_transactions ADD CONSTRAINT recurring_transactions_interval_from_check CHECK (EXTRACT(DAY FROM interval_from) = 1);
ALTER TABLE recurring_transactions ADD CONSTRAINT recurring_transactions_interval_to_check CHECK (EXTRACT(DAY FROM interval_to) = 1);
ALTER TABLE recurring_transactions ADD CONSTRAINT recurring_transactions_interval_check CHECK (interval_to >= interval_from);
ALTER TABLE recurring_transactions ADD CONSTRAINT recurring_transactions_interval_from_month_check CHECK (EXTRACT(MONTH FROM interval_from) = 1 OR frequency = 'monthly');
ALTER TABLE recurring_transactions ADD CONSTRAINT recurring_transactions_interval_to_month_check CHECK (EXTRACT(MONTH FROM interval_to) = 1 OR frequency = 'monthly');

ALTER TRIGGER set_monthly_transactions_updated_at ON recurring_transactions RENAME TO set_recurring_transactions_updated_at;
ALTER SEQUENCE monthly_transactions_id_seq RENAME TO recurring_transactions_id_seq;
