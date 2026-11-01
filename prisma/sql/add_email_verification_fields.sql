-- Migration: add_email_verification_fields
-- Section 06 of Email Verifier Integration Guide
-- Run on PostgreSQL via:
--   railway run psql $DATABASE_URL < prisma/sql/add_email_verification_fields.sql

ALTER TABLE "Lead"
  ADD COLUMN IF NOT EXISTS "emailStatus"       VARCHAR(20) DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS "emailVerifiedAt"   TIMESTAMP(3) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS "emailBounceRisk"   VARCHAR(10) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS "isRoleAccount"     BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "emailVerifySource" VARCHAR(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS "emailScore"        DOUBLE PRECISION DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS "emailSubStatus"    VARCHAR(50) DEFAULT NULL;

CREATE INDEX IF NOT EXISTS "Lead_emailStatus_idx" ON "Lead"("emailStatus");
CREATE INDEX IF NOT EXISTS "Lead_emailVerifiedAt_idx" ON "Lead"("emailVerifiedAt");

