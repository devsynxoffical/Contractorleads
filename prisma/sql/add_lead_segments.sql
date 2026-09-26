-- Migration: add_lead_segments_and_digest_email_segments
-- Run this on your Railway PostgreSQL instance via:
--   railway run psql $DATABASE_URL < prisma/sql/add_lead_segments.sql

-- 1. Saved filter presets (named combos of industry/time/tier/strength/sort/q)
CREATE TABLE IF NOT EXISTS "LeadSegment" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "industry"  TEXT,
  "when"      TEXT,
  "tier"      TEXT,
  "strength"  TEXT,
  "q"         TEXT,
  "sort"      TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "LeadSegment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LeadSegment_userId_idx" ON "LeadSegment"("userId");

ALTER TABLE "LeadSegment"
  ADD CONSTRAINT "LeadSegment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Multiple named digest subscriptions (one user can have many)
CREATE TABLE IF NOT EXISTS "DigestEmailSegment" (
  "id"            TEXT NOT NULL,
  "userId"        TEXT NOT NULL,
  "name"          TEXT NOT NULL,
  "enabled"       BOOLEAN NOT NULL DEFAULT TRUE,
  "industry"      TEXT NOT NULL,
  "country"       TEXT NOT NULL DEFAULT 'US',
  "locationScope" TEXT NOT NULL DEFAULT 'local',
  "state"         TEXT,
  "city"          TEXT,
  "dailyLeadCount" INTEGER NOT NULL DEFAULT 20,
  "timezone"      TEXT NOT NULL DEFAULT 'America/Chicago',
  "lastRunAt"     TIMESTAMP(3),
  "lastError"     TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DigestEmailSegment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DigestEmailSegment_userId_idx"     ON "DigestEmailSegment"("userId");
CREATE INDEX IF NOT EXISTS "DigestEmailSegment_enabled_lastRunAt_idx" ON "DigestEmailSegment"("enabled", "lastRunAt");

ALTER TABLE "DigestEmailSegment"
  ADD CONSTRAINT "DigestEmailSegment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
