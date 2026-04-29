ALTER TABLE "Users" ALTER COLUMN "createdAt" SET DEFAULT now();
ALTER TABLE "Users" ALTER COLUMN "updatedAt" SET DEFAULT now();

ALTER TABLE "Categories" ALTER COLUMN "createdAt" SET DEFAULT now();
ALTER TABLE "Categories" ALTER COLUMN "updatedAt" SET DEFAULT now();

ALTER TABLE "Shops" ALTER COLUMN "createdAt" SET DEFAULT now();
ALTER TABLE "Shops" ALTER COLUMN "updatedAt" SET DEFAULT now();

ALTER TABLE "Transactions" ALTER COLUMN "createdAt" SET DEFAULT now();
ALTER TABLE "Transactions" ALTER COLUMN "updatedAt" SET DEFAULT now();

ALTER TABLE "OneoffTransactions" ALTER COLUMN "createdAt" SET DEFAULT now();
ALTER TABLE "OneoffTransactions" ALTER COLUMN "updatedAt" SET DEFAULT now();

ALTER TABLE "MonthlyTransactions" ALTER COLUMN "createdAt" SET DEFAULT now();
ALTER TABLE "MonthlyTransactions" ALTER COLUMN "updatedAt" SET DEFAULT now();
