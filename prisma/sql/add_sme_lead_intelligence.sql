-- Migration: add_sme_lead_intelligence
-- Run on Railway PostgreSQL via:
--   railway run psql $DATABASE_URL < prisma/sql/add_sme_lead_intelligence.sql

ALTER TABLE "Lead"
  -- Business Age
  ADD COLUMN IF NOT EXISTS "businessEstablishedDate"   TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "businessRegistrationDate"  TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "businessAgeYears"          INTEGER,
  ADD COLUMN IF NOT EXISTS "businessAgeSource"         TEXT,
  ADD COLUMN IF NOT EXISTS "businessAgeConfidence"     INTEGER,
  ADD COLUMN IF NOT EXISTS "businessAgeLastVerified"   TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "businessMaturity"          TEXT DEFAULT 'growing',

  -- Domain / RDAP / WHOIS
  ADD COLUMN IF NOT EXISTS "domainName"                TEXT,
  ADD COLUMN IF NOT EXISTS "domainCreatedDate"         TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "domainUpdatedDate"         TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "domainExpiryDate"          TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "domainAgeYears"            INTEGER,
  ADD COLUMN IF NOT EXISTS "domainRegistrar"           TEXT,
  ADD COLUMN IF NOT EXISTS "domainRegistrationCountry" TEXT,
  ADD COLUMN IF NOT EXISTS "domainSource"              TEXT,
  ADD COLUMN IF NOT EXISTS "domainConfidence"          INTEGER,
  ADD COLUMN IF NOT EXISTS "domainPrivacyStatus"       TEXT DEFAULT 'unknown',

  -- Business Registration
  ADD COLUMN IF NOT EXISTS "legalBusinessName"         TEXT,
  ADD COLUMN IF NOT EXISTS "tradingDbaName"            TEXT,
  ADD COLUMN IF NOT EXISTS "registrationNumber"        TEXT,
  ADD COLUMN IF NOT EXISTS "registrationJurisdiction"  TEXT,
  ADD COLUMN IF NOT EXISTS "registeredState"           TEXT,
  ADD COLUMN IF NOT EXISTS "registeredCountry"         TEXT,
  ADD COLUMN IF NOT EXISTS "entityType"                TEXT,
  ADD COLUMN IF NOT EXISTS "registrationStatus"        TEXT,
  ADD COLUMN IF NOT EXISTS "registrationSourceUrl"     TEXT,
  ADD COLUMN IF NOT EXISTS "registrationLastVerified"  TIMESTAMP(3),

  -- Company Size / Team Size
  ADD COLUMN IF NOT EXISTS "employeeCount"             INTEGER,
  ADD COLUMN IF NOT EXISTS "employeeCountSource"       TEXT,
  ADD COLUMN IF NOT EXISTS "employeeCountConfidence"   INTEGER,
  ADD COLUMN IF NOT EXISTS "employeeCountLastVerified" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "companySizeCategory"       TEXT DEFAULT '2-5',
  ADD COLUMN IF NOT EXISTS "locationCount"             INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "isFranchiseOrEnterprise"   BOOLEAN DEFAULT FALSE,

  -- Decision-Maker Identification
  ADD COLUMN IF NOT EXISTS "decisionMakerFound"        BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "decisionMakerName"         TEXT,
  ADD COLUMN IF NOT EXISTS "decisionMakerFirstName"    TEXT,
  ADD COLUMN IF NOT EXISTS "decisionMakerLastName"     TEXT,
  ADD COLUMN IF NOT EXISTS "decisionMakerTitle"        TEXT,
  ADD COLUMN IF NOT EXISTS "decisionMakerRole"         TEXT,
  ADD COLUMN IF NOT EXISTS "decisionMakerLinkedIn"     TEXT,
  ADD COLUMN IF NOT EXISTS "decisionMakerProfessionalProfile" TEXT,
  ADD COLUMN IF NOT EXISTS "decisionMakerEmail"        TEXT,
  ADD COLUMN IF NOT EXISTS "decisionMakerEmailType"    TEXT DEFAULT 'generic',
  ADD COLUMN IF NOT EXISTS "decisionMakerEmailVerification" TEXT DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS "decisionMakerDirectPhone"  TEXT,
  ADD COLUMN IF NOT EXISTS "decisionMakerPhoneType"    TEXT DEFAULT 'main_company',
  ADD COLUMN IF NOT EXISTS "decisionMakerSource"       TEXT,
  ADD COLUMN IF NOT EXISTS "decisionMakerVerified"     BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "decisionMakerVerificationDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "decisionMakerConfidence"   INTEGER DEFAULT 0,

  -- Multi-Source Validation & Scoring
  ADD COLUMN IF NOT EXISTS "sourcesCount"              INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "sourcesUsedJson"           TEXT,
  ADD COLUMN IF NOT EXISTS "businessVerified"          BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "smeQualityScore"           INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "isLowPriorityOrExcluded"   BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "exclusionReasonsJson"      TEXT,
  ADD COLUMN IF NOT EXISTS "lastVerifiedAt"            TIMESTAMP(3);

-- Create performance indexes for SME filters
CREATE INDEX IF NOT EXISTS "Lead_businessMaturity_idx" ON "Lead"("businessMaturity");
CREATE INDEX IF NOT EXISTS "Lead_companySizeCategory_idx" ON "Lead"("companySizeCategory");
CREATE INDEX IF NOT EXISTS "Lead_decisionMakerFound_idx" ON "Lead"("decisionMakerFound");
CREATE INDEX IF NOT EXISTS "Lead_isLowPriorityOrExcluded_idx" ON "Lead"("isLowPriorityOrExcluded");
