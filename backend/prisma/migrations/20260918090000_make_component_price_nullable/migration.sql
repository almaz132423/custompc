-- Component.price stores the application's catalog price and may be unknown
-- for imported dataset records until a local/store price is assigned.
ALTER TABLE "Component"
ALTER COLUMN "price" DROP NOT NULL;
