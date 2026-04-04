-- AlterTable
ALTER TABLE "schools" ADD COLUMN "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "schools_slug_key" ON "schools"("slug");

-- Backfill slugs for existing rows (shortName-based + id suffix for uniqueness)
UPDATE "schools"
SET "slug" = regexp_replace(lower(trim("shortName")), '[^a-z0-9]+', '-', 'g') || '-' || substr("id", 1, 8)
WHERE "slug" IS NULL;
