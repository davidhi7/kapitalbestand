ALTER TABLE oneoff_transactions DROP CONSTRAINT oneoff_transactions_category_id_fkey;
ALTER TABLE oneoff_transactions ADD CONSTRAINT oneoff_transactions_category_id_fkey
    FOREIGN KEY (category_id) REFERENCES categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE oneoff_transactions DROP CONSTRAINT oneoff_transactions_shop_id_fkey;
ALTER TABLE oneoff_transactions ADD CONSTRAINT oneoff_transactions_shop_id_fkey
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE recurring_transactions DROP CONSTRAINT recurring_transactions_category_id_fkey;
ALTER TABLE recurring_transactions ADD CONSTRAINT recurring_transactions_category_id_fkey
    FOREIGN KEY (category_id) REFERENCES categories(id) ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE recurring_transactions DROP CONSTRAINT recurring_transactions_shop_id_fkey;
ALTER TABLE recurring_transactions ADD CONSTRAINT recurring_transactions_shop_id_fkey
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON UPDATE CASCADE ON DELETE RESTRICT;
