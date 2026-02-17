-- Role normalization + hierarchy + tasks/reminders + contact photo
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'REGIONAL_MANAGER';

UPDATE "Membership" SET "role" = 'MANAGER' WHERE "role"::text = 'GERENTE';
UPDATE "Membership" SET "role" = 'AGENT' WHERE "role"::text = 'AGENTE';
UPDATE "Membership" SET "role" = 'SECRETARY' WHERE "role"::text = 'SECRETARIA';

ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "reportsToUserId" TEXT;
CREATE INDEX IF NOT EXISTS "Membership_tenantId_reportsToUserId_idx" ON "Membership"("tenantId", "reportsToUserId");
ALTER TABLE "Membership"
  ADD CONSTRAINT "Membership_reportsToUserId_fkey"
  FOREIGN KEY ("reportsToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;

CREATE TABLE IF NOT EXISTS "Task" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "notes" TEXT,
  "assignedToId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "dueAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Task_tenantId_assignedToId_createdAt_idx" ON "Task"("tenantId", "assignedToId", "createdAt");
ALTER TABLE "Task" ADD CONSTRAINT "Task_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "Reminder" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "contactId" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "channel" TEXT NOT NULL DEFAULT 'placeholder',
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Reminder_tenantId_createdAt_idx" ON "Reminder"("tenantId", "createdAt");
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
