-- Keep existing service values, but allow arbitrary service types managed from the admin UI.
ALTER TABLE "Service"
  ALTER COLUMN "type" TYPE TEXT USING "type"::text;

DROP TYPE "ServiceType";

-- Store the final price agreed with the client separately from the initial budget.
ALTER TABLE "Lead"
  ADD COLUMN "agreedPrice" DECIMAL;

-- A client may be identified by phone or email.
ALTER TABLE "Customer"
  ALTER COLUMN "phone" DROP NOT NULL;

ALTER TABLE "Customer"
  ADD COLUMN "email" TEXT;
