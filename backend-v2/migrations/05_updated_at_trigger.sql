CREATE FUNCTION set_current_timestamp_updated_at()
    RETURNS TRIGGER AS $$
DECLARE
    _new record;
BEGIN
    _new := NEW;
    _new."updated_at" = now();
RETURN _new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE PROCEDURE set_current_timestamp_updated_at();

CREATE TRIGGER set_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE PROCEDURE set_current_timestamp_updated_at();

CREATE TRIGGER set_shops_updated_at
    BEFORE UPDATE ON shops
    FOR EACH ROW
    EXECUTE PROCEDURE set_current_timestamp_updated_at();

CREATE TRIGGER set_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE PROCEDURE set_current_timestamp_updated_at();

CREATE TRIGGER set_oneoff_transactions_updated_at
    BEFORE UPDATE ON oneoff_transactions
    FOR EACH ROW
    EXECUTE PROCEDURE set_current_timestamp_updated_at();

CREATE TRIGGER set_monthly_transactions_updated_at
    BEFORE UPDATE ON monthly_transactions
    FOR EACH ROW
    EXECUTE PROCEDURE set_current_timestamp_updated_at();
