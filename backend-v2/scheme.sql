CREATE FUNCTION set_current_timestamp_updated_at() RETURNS trigger AS $$
DECLARE
    _new record;
BEGIN
    _new := NEW;
    _new."updated_at" = now();
RETURN _new;
END;
$$ LANGUAGE plpgsql;

BEGIN;

CREATE TYPE recurrence_frequency AS ENUM ('monthly', 'yearly');

CREATE TABLE users (
    id serial PRIMARY KEY,
    username character varying(255) NOT NULL UNIQUE,
    hash character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE categories (
    id serial PRIMARY KEY,
    name character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id integer NOT NULL REFERENCES users(id) ON UPDATE CASCADE,
    UNIQUE(name, user_id)
);

CREATE TABLE shops (
    id serial PRIMARY KEY,
    name character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id integer NOT NULL REFERENCES users(id) ON UPDATE CASCADE,
    UNIQUE(name, user_id, created_at)
);

CREATE TABLE oneoff_transactions (
    id serial PRIMARY KEY,
    date date NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id integer NOT NULL REFERENCES users(id) ON UPDATE CASCADE,
    is_expense boolean NOT NULL,
    amount integer NOT NULL,
    description text,
    category_id integer NOT NULL REFERENCES categories(id) ON UPDATE CASCADE ON DELETE CASCADE,
    shop_id integer REFERENCES shops(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE recurring_transactions (
    id serial PRIMARY KEY,
    interval_from date NOT NULL CHECK (EXTRACT(DAY FROM interval_from) = 1),
    interval_to date CHECK (EXTRACT(DAY FROM interval_to) = 1),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id integer NOT NULL REFERENCES users(id) ON UPDATE CASCADE,
    is_expense boolean NOT NULL,
    amount integer NOT NULL,
    description text,
    category_id integer NOT NULL REFERENCES categories(id) ON UPDATE CASCADE ON DELETE CASCADE,
    shop_id integer REFERENCES shops(id) ON UPDATE CASCADE ON DELETE CASCADE,
    frequency recurrence_frequency NOT NULL,
    CONSTRAINT recurring_transactions_interval_check
        CHECK (interval_to >= interval_from OR interval_to IS NULL),
    CONSTRAINT recurring_transactions_interval_from_month_check
        CHECK (EXTRACT(MONTH FROM interval_from) = 1 OR frequency = 'monthly'),
    CONSTRAINT recurring_transactions_interval_to_month_check
        CHECK (EXTRACT(MONTH FROM interval_to) = 1 OR frequency = 'monthly')
);

CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();
CREATE TRIGGER set_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();
CREATE TRIGGER set_shops_updated_at BEFORE UPDATE ON shops FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();
CREATE TRIGGER set_oneoff_transactions_updated_at BEFORE UPDATE ON oneoff_transactions FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();
CREATE TRIGGER set_recurring_transactions_updated_at BEFORE UPDATE ON monthly_transactions FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();

COMMIT;
