-- Rubkley Framework Module
DO $$ BEGIN
  CREATE TYPE "GoalPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TYPE "GoalProgressStatus" AS ENUM ('ON_TRACK', 'AT_RISK', 'ACHIEVED');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TYPE "RecommendationEventStatus" AS ENUM ('SHOWN', 'ACCEPTED', 'DISMISSED', 'COMPLETED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "stageId" TEXT;
CREATE INDEX IF NOT EXISTS "Contact_tenantId_stageId_idx" ON "Contact"("tenantId", "stageId");

CREATE TABLE IF NOT EXISTS "RubkleyFramework" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RubkleyFramework_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "RubkleyFramework_tenantId_isActive_idx" ON "RubkleyFramework"("tenantId", "isActive");

CREATE TABLE IF NOT EXISTS "PipelineStage" (
  "id" TEXT NOT NULL,
  "frameworkId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "isTerminal" BOOLEAN NOT NULL DEFAULT false,
  "colorToken" TEXT,
  CONSTRAINT "PipelineStage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PipelineStage_frameworkId_key_key" ON "PipelineStage"("frameworkId", "key");
CREATE INDEX IF NOT EXISTS "PipelineStage_tenantId_order_idx" ON "PipelineStage"("tenantId", "order");

CREATE TABLE IF NOT EXISTS "StageGate" (
  "id" TEXT NOT NULL,
  "stageId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "ruleJson" JSONB NOT NULL,
  "message" TEXT NOT NULL,
  CONSTRAINT "StageGate_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "StageGate_tenantId_stageId_order_idx" ON "StageGate"("tenantId", "stageId", "order");

CREATE TABLE IF NOT EXISTS "Playbook" (
  "id" TEXT NOT NULL,
  "frameworkId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "Playbook_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Playbook_tenantId_role_isActive_idx" ON "Playbook"("tenantId", "role", "isActive");

CREATE TABLE IF NOT EXISTS "PlayDefinition" (
  "id" TEXT NOT NULL,
  "playbookId" TEXT NOT NULL,
  "stageId" TEXT,
  "tenantId" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "intent" TEXT NOT NULL,
  "checklistJson" JSONB NOT NULL,
  "templatesJson" JSONB,
  CONSTRAINT "PlayDefinition_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PlayDefinition_tenantId_playbookId_order_idx" ON "PlayDefinition"("tenantId", "playbookId", "order");
CREATE INDEX IF NOT EXISTS "PlayDefinition_tenantId_stageId_idx" ON "PlayDefinition"("tenantId", "stageId");

CREATE TABLE IF NOT EXISTS "KpiSet" (
  "id" TEXT NOT NULL,
  "frameworkId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "KpiSet_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "KpiSet_tenantId_role_isActive_idx" ON "KpiSet"("tenantId", "role", "isActive");

CREATE TABLE IF NOT EXISTS "KpiMetricDefinition" (
  "id" TEXT NOT NULL,
  "kpiSetId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "weight" DOUBLE PRECISION NOT NULL,
  "defaultTarget" DOUBLE PRECISION,
  CONSTRAINT "KpiMetricDefinition_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "KpiMetricDefinition_tenantId_kpiSetId_idx" ON "KpiMetricDefinition"("tenantId", "kpiSetId");
CREATE INDEX IF NOT EXISTS "KpiMetricDefinition_tenantId_key_idx" ON "KpiMetricDefinition"("tenantId", "key");

CREATE TABLE IF NOT EXISTS "GoalDefinition" (
  "id" TEXT NOT NULL,
  "frameworkId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "period" "GoalPeriod" NOT NULL,
  "metricKey" TEXT NOT NULL,
  "targetValue" DOUBLE PRECISION NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "GoalDefinition_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "GoalDefinition_tenantId_role_period_isActive_idx" ON "GoalDefinition"("tenantId", "role", "period", "isActive");

CREATE TABLE IF NOT EXISTS "GoalProgress" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "dateBucket" TIMESTAMP(3) NOT NULL,
  "period" "GoalPeriod" NOT NULL,
  "metricKey" TEXT NOT NULL,
  "targetValue" DOUBLE PRECISION NOT NULL,
  "actualValue" DOUBLE PRECISION NOT NULL,
  "status" "GoalProgressStatus" NOT NULL DEFAULT 'ON_TRACK',
  CONSTRAINT "GoalProgress_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "GoalProgress_tenantId_userId_dateBucket_idx" ON "GoalProgress"("tenantId", "userId", "dateBucket");
CREATE UNIQUE INDEX IF NOT EXISTS "GoalProgress_tenantId_userId_dateBucket_period_metricKey_key" ON "GoalProgress"("tenantId", "userId", "dateBucket", "period", "metricKey");

CREATE TABLE IF NOT EXISTS "TrophyDefinition" (
  "id" TEXT NOT NULL,
  "frameworkId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "icon" TEXT,
  "ruleJson" JSONB NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "TrophyDefinition_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "TrophyDefinition_tenantId_isActive_idx" ON "TrophyDefinition"("tenantId", "isActive");

CREATE TABLE IF NOT EXISTS "TrophyAward" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "trophyId" TEXT NOT NULL,
  "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "contextJson" JSONB,
  CONSTRAINT "TrophyAward_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "TrophyAward_tenantId_userId_trophyId_key" ON "TrophyAward"("tenantId", "userId", "trophyId");
CREATE INDEX IF NOT EXISTS "TrophyAward_tenantId_userId_awardedAt_idx" ON "TrophyAward"("tenantId", "userId", "awardedAt");

CREATE TABLE IF NOT EXISTS "RecommendationRule" (
  "id" TEXT NOT NULL,
  "frameworkId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "priority" INTEGER NOT NULL,
  "conditionJson" JSONB NOT NULL,
  "actionJson" JSONB NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "RecommendationRule_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "RecommendationRule_tenantId_role_isActive_priority_idx" ON "RecommendationRule"("tenantId", "role", "isActive", "priority");

CREATE TABLE IF NOT EXISTS "RecommendationEvent" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "dateBucket" TIMESTAMP(3) NOT NULL,
  "ruleId" TEXT NOT NULL,
  "actionJson" JSONB NOT NULL,
  "status" "RecommendationEventStatus" NOT NULL DEFAULT 'SHOWN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecommendationEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "RecommendationEvent_tenantId_userId_dateBucket_status_idx" ON "RecommendationEvent"("tenantId", "userId", "dateBucket", "status");

CREATE TABLE IF NOT EXISTS "ContactStageHistory" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "contactId" TEXT NOT NULL,
  "fromStageId" TEXT,
  "toStageId" TEXT NOT NULL,
  "changedByUserId" TEXT NOT NULL,
  "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reasonJson" JSONB,
  CONSTRAINT "ContactStageHistory_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ContactStageHistory_tenantId_contactId_changedAt_idx" ON "ContactStageHistory"("tenantId", "contactId", "changedAt");

ALTER TABLE "RubkleyFramework" ADD CONSTRAINT "RubkleyFramework_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PipelineStage" ADD CONSTRAINT "PipelineStage_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "RubkleyFramework"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StageGate" ADD CONSTRAINT "StageGate_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "PipelineStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Playbook" ADD CONSTRAINT "Playbook_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "RubkleyFramework"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlayDefinition" ADD CONSTRAINT "PlayDefinition_playbookId_fkey" FOREIGN KEY ("playbookId") REFERENCES "Playbook"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlayDefinition" ADD CONSTRAINT "PlayDefinition_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "PipelineStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "KpiSet" ADD CONSTRAINT "KpiSet_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "RubkleyFramework"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KpiMetricDefinition" ADD CONSTRAINT "KpiMetricDefinition_kpiSetId_fkey" FOREIGN KEY ("kpiSetId") REFERENCES "KpiSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GoalDefinition" ADD CONSTRAINT "GoalDefinition_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "RubkleyFramework"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GoalProgress" ADD CONSTRAINT "GoalProgress_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GoalProgress" ADD CONSTRAINT "GoalProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrophyDefinition" ADD CONSTRAINT "TrophyDefinition_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "RubkleyFramework"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrophyAward" ADD CONSTRAINT "TrophyAward_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrophyAward" ADD CONSTRAINT "TrophyAward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrophyAward" ADD CONSTRAINT "TrophyAward_trophyId_fkey" FOREIGN KEY ("trophyId") REFERENCES "TrophyDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecommendationRule" ADD CONSTRAINT "RecommendationRule_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "RubkleyFramework"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecommendationEvent" ADD CONSTRAINT "RecommendationEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecommendationEvent" ADD CONSTRAINT "RecommendationEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecommendationEvent" ADD CONSTRAINT "RecommendationEvent_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "RecommendationRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContactStageHistory" ADD CONSTRAINT "ContactStageHistory_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContactStageHistory" ADD CONSTRAINT "ContactStageHistory_fromStageId_fkey" FOREIGN KEY ("fromStageId") REFERENCES "PipelineStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ContactStageHistory" ADD CONSTRAINT "ContactStageHistory_toStageId_fkey" FOREIGN KEY ("toStageId") REFERENCES "PipelineStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContactStageHistory" ADD CONSTRAINT "ContactStageHistory_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "PipelineStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
