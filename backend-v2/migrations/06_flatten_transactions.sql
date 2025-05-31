-- modify tables and set new foreign key constraints
ALTER TABLE oneoff_transactions
    ADD COLUMN is_expense BOOLEAN,
    ADD COLUMN amount INTEGER,
    ADD COLUMN description TEXT,
    ADD COLUMN category_id INTEGER REFERENCES categories (id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD COLUMN shop_id INTEGER REFERENCES shops (id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE monthly_transactions
    ADD COLUMN is_expense BOOLEAN,
    ADD COLUMN amount INTEGER,
    ADD COLUMN description TEXT,
    ADD COLUMN category_id INTEGER REFERENCES categories (id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD COLUMN shop_id INTEGER REFERENCES shops (id) ON DELETE CASCADE ON UPDATE CASCADE;

-- migrate data
UPDATE oneoff_transactions AS ot
SET
    is_expense = t.is_expense,
    amount = t.amount,
    description = t.description,
    category_id = t.category_id,
    shop_id = t.shop_id
FROM transactions AS t
WHERE ot.transaction_id = t.id;

UPDATE monthly_transactions AS mt
SET
    is_expense = t.is_expense,
    amount = t.amount,
    description = t.description,
    category_id = t.category_id,
    shop_id = t.shop_id
FROM transactions AS t
WHERE mt.transaction_id = t.id;

-- set not null constraints
ALTER TABLE oneoff_transactions
    ALTER COLUMN is_expense SET NOT NULL,
    ALTER COLUMN amount SET NOT NULL,
    ALTER COLUMN category_id SET NOT NULL;

ALTER TABLE monthly_transactions
    ALTER COLUMN is_expense SET NOT NULL,
    ALTER COLUMN amount SET NOT NULL,
    ALTER COLUMN category_id SET NOT NULL;

-- drop transaction_id column
ALTER TABLE oneoff_transactions
    DROP COLUMN transaction_id;

ALTER TABLE monthly_transactions
    DROP COLUMN transaction_id;

DROP TABLE  transactions;
