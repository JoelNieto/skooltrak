-- ACA-001-S09: a course's cover photo (BR .12), and the permission letting teachers set their own
-- courses' color and cover. Admins pass every permission check already.

-- AlterTable
ALTER TABLE "courses" ADD COLUMN "coverKey" TEXT;

-- Permission, granted to every teacher role (all organizations).
INSERT INTO "permissions" ("id", "descriptiveId", "description", "createdAt", "updatedAt")
VALUES ('perm_customize_courses', 'CUSTOMIZE_COURSES', 'Set the color and cover photo of one''s own courses', now(), now())
ON CONFLICT ("descriptiveId") DO NOTHING;

INSERT INTO "_PermissionToRole" ("A", "B")
SELECT p."id", r."id"
FROM "permissions" p
JOIN "roles" r ON upper(r."name") = 'TEACHER'
WHERE p."descriptiveId" = 'CUSTOMIZE_COURSES'
ON CONFLICT DO NOTHING;
