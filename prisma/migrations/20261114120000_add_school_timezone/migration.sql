-- HOM-001-S01: school-local time for home dashboards (BR-HOM-001.4)
ALTER TABLE "schools" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'America/Panama';
