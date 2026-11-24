-- COM-003-S02, BR .13 (decided 2026-11-25): existing assignments whose Q&A channel would still be
-- open (latest date + 3 days ahead) get it, with its pinned opening post, as if just created.
-- A separate migration because Postgres can't use the new ChannelScope value in the transaction
-- that added it. Idempotent: assignments that already have a channel are skipped.
WITH open_assignments AS (
  SELECT a."id", a."title", a."schoolId", a."courseId", c."organizationId", t."userId" AS "authorId",
         MAX(d."date") + INTERVAL '3 days' AS "closesAt"
  FROM "assignments" a
  JOIN "courses" c ON c."id" = a."courseId"
  LEFT JOIN "teachers" t ON t."id" = a."teacherId"
  JOIN "assignment_dates" d ON d."assignmentId" = a."id"
  WHERE NOT EXISTS (SELECT 1 FROM "channels" ch WHERE ch."assignmentId" = a."id")
  GROUP BY a."id", a."title", a."schoolId", a."courseId", c."organizationId", t."userId"
  HAVING MAX(d."date") + INTERVAL '3 days' > NOW()
),
inserted AS (
  INSERT INTO "channels" (
    "id", "organizationId", "scope", "schoolId", "courseId", "assignmentId", "name", "description",
    "audienceStudents", "audienceParents", "studentsCanReply", "parentsCanReply", "replyVisibility",
    "createdById", "closesAt", "createdAt", "updatedAt"
  )
  SELECT gen_random_uuid()::text, o."organizationId", 'ASSIGNMENT'::"ChannelScope", o."schoolId", o."courseId", o."id",
         o."title", '', true, false, true, false, 'PUBLIC'::"ChannelReplyVisibility",
         o."authorId", o."closesAt", NOW(), NOW()
  FROM open_assignments o
  RETURNING "id", "assignmentId", "createdById"
)
INSERT INTO "channel_posts" ("id", "channelId", "authorId", "body", "requiresConfirmation", "pinned", "createdAt")
SELECT gen_random_uuid()::text, i."id", i."createdById",
       'Preguntas sobre «' || o."title" || '». Pregunten aquí; todos ven las respuestas.', false, true, NOW()
FROM inserted i
JOIN open_assignments o ON o."id" = i."assignmentId";
