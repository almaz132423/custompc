-- Repair migration for databases where the original history migrations were
-- recorded as applied but the physical tables are missing.
CREATE TABLE IF NOT EXISTS "LeadStatusHistory" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "fromStatus" "LeadStatus",
  "toStatus" "LeadStatus" NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeadStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LeadStatusHistory_leadId_createdAt_idx"
  ON "LeadStatusHistory"("leadId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'LeadStatusHistory_leadId_fkey'
  ) THEN
    ALTER TABLE "LeadStatusHistory"
      ADD CONSTRAINT "LeadStatusHistory_leadId_fkey"
      FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "OrderStatusHistory" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "fromStatus" "OrderStatusStage",
  "toStatus" "OrderStatusStage" NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "OrderStatusHistory_orderId_createdAt_idx"
  ON "OrderStatusHistory"("orderId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'OrderStatusHistory_orderId_fkey'
  ) THEN
    ALTER TABLE "OrderStatusHistory"
      ADD CONSTRAINT "OrderStatusHistory_orderId_fkey"
      FOREIGN KEY ("orderId") REFERENCES "Order"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
