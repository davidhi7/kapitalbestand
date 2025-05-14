-- Categories/Shops aren't actually unqiue but only unique in combination with an UserId
ALTER TABLE "Categories" DROP CONSTRAINT IF EXISTS "Categories_name_key";
ALTER TABLE "Shops" DROP CONSTRAINT IF EXISTS "Shops_name_key";

CREATE UNIQUE INDEX "Categories_name_UserId_idx" ON "Categories" ("name", "UserId");
CREATE UNIQUE INDEX "Shops_name_UserId_idx" ON "Shops" ("name", "UserId");
