ALTER TABLE "Users" RENAME TO users;
ALTER TABLE "Categories" RENAME TO categories;
ALTER TABLE "Shops" RENAME TO shops;
ALTER TABLE "Transactions" RENAME TO transactions;
ALTER TABLE "OneoffTransactions" RENAME TO oneoff_transactions;
ALTER TABLE "MonthlyTransactions" RENAME TO monthly_transactions;

ALTER TABLE users RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE users RENAME COLUMN "updatedAt" TO updated_at;
ALTER TABLE users RENAME CONSTRAINT "Users_pkey" TO users_pkey;
ALTER TABLE users RENAME CONSTRAINT "Users_username_key" TO users_username_key;

ALTER TABLE categories RENAME COLUMN "UserId" TO user_id;
ALTER TABLE categories RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE categories RENAME COLUMN "updatedAt" TO updated_at;
ALTER TABLE categories RENAME CONSTRAINT "Categories_pkey" TO categories_pkey;
ALTER TABLE categories RENAME CONSTRAINT "Categories_UserId_fkey" TO categories_user_id_fkey;

ALTER TABLE shops RENAME COLUMN "UserId" TO user_id;
ALTER TABLE shops RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE shops RENAME COLUMN "updatedAt" TO updated_at;
ALTER TABLE shops RENAME CONSTRAINT "Shops_pkey" TO shops_pkey;
ALTER TABLE shops RENAME CONSTRAINT "Shops_UserId_fkey" TO shops_user_id_fkey;

ALTER TABLE transactions RENAME COLUMN "isExpense" TO is_expense;
ALTER TABLE transactions RENAME COLUMN "CategoryId" TO category_id;
ALTER TABLE transactions RENAME COLUMN "ShopId" TO shop_id;
ALTER TABLE transactions RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE transactions RENAME COLUMN "updatedAt" TO updated_at;
ALTER TABLE transactions RENAME CONSTRAINT "Transactions_pkey" TO transactions_pkey;
ALTER TABLE transactions RENAME CONSTRAINT "Transactions_CategoryId_fkey" TO transactions_category_id_fkey;
ALTER TABLE transactions RENAME CONSTRAINT "Transactions_ShopId_fkey" TO transactions_shop_id_fkey;

ALTER TABLE oneoff_transactions RENAME COLUMN "TransactionId" TO transaction_id;
ALTER TABLE oneoff_transactions RENAME COLUMN "UserId" TO user_id;
ALTER TABLE oneoff_transactions RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE oneoff_transactions RENAME COLUMN "updatedAt" TO updated_at;
ALTER TABLE oneoff_transactions RENAME CONSTRAINT "OneoffTransactions_pkey" TO "oneoff_transactions_pkey";
ALTER TABLE oneoff_transactions RENAME CONSTRAINT "OneoffTransactions_TransactionId_fkey" TO "oneoff_transactions_transaction_id_fkey";
ALTER TABLE oneoff_transactions RENAME CONSTRAINT "OneoffTransactions_UserId_fkey" TO "oneoff_transactions_user_id_fkey";

ALTER TABLE monthly_transactions RENAME COLUMN "monthFrom" TO month_from;
ALTER TABLE monthly_transactions RENAME COLUMN "monthTo" TO month_to;
ALTER TABLE monthly_transactions RENAME COLUMN "TransactionId" TO transaction_id;
ALTER TABLE monthly_transactions RENAME COLUMN "UserId" TO user_id;
ALTER TABLE monthly_transactions RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE monthly_transactions RENAME COLUMN "updatedAt" TO updated_at;
ALTER TABLE monthly_transactions RENAME CONSTRAINT "MonthlyTransactions_pkey" TO "monthly_transactions_pkey";
ALTER TABLE monthly_transactions RENAME CONSTRAINT "MonthlyTransactions_TransactionId_fkey" TO "monthly_transactions_transaction_id_fkey";
ALTER TABLE monthly_transactions RENAME CONSTRAINT "MonthlyTransactions_UserId_fkey" TO "monthly_transactions_user_id_fkey";

ALTER SEQUENCE "Users_id_seq" RENAME TO users_id_seq;
ALTER SEQUENCE "Categories_id_seq" RENAME TO categories_id_seq;
ALTER SEQUENCE "Shops_id_seq" RENAME TO shops_id_seq;
ALTER SEQUENCE "Transactions_id_seq" RENAME TO transactions_id_seq;
ALTER SEQUENCE "OneoffTransactions_id_seq" RENAME TO oneoff_transactions_id_seq;
ALTER SEQUENCE "MonthlyTransactions_id_seq" RENAME TO monthly_transactions_id_seq;

ALTER INDEX "Shops_name_UserId_idx" RENAME TO shops_name_user_id_idx;
ALTER INDEX "Categories_name_UserId_idx" RENAME TO categories_name_user_id_idx;
