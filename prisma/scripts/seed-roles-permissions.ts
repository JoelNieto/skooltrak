/**
 * Seed script to create global permissions and default roles.
 *
 * - Permissions are global (no org association).
 * - The 4 default roles (ORG_ADMIN, TEACHER, STUDENT, PARENT) are global
 *   (organizationId = null).
 * - Organizations can later create additional custom roles via the API.
 *
 * This script is idempotent — safe to re-run.
 *
 * Run with: bun run prisma/scripts/seed-roles-permissions.ts
 */

import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

// ── Permission & role definitions ──────────────────────────────────────────

enum Perm {
  MANAGE_SCHOOLS = 'MANAGE_SCHOOLS',
  VIEW_SCHOOLS = 'VIEW_SCHOOLS',
  MANAGE_TEACHERS = 'MANAGE_TEACHERS',
  VIEW_TEACHERS = 'VIEW_TEACHERS',
  MANAGE_STUDENTS = 'MANAGE_STUDENTS',
  VIEW_STUDENTS = 'VIEW_STUDENTS',
  MANAGE_PARENTS = 'MANAGE_PARENTS',
  VIEW_PARENTS = 'VIEW_PARENTS',
  MANAGE_COURSES = 'MANAGE_COURSES',
  VIEW_COURSES = 'VIEW_COURSES',
  MANAGE_SUBJECTS = 'MANAGE_SUBJECTS',
  VIEW_SUBJECTS = 'VIEW_SUBJECTS',
  MANAGE_CLASS_GROUPS = 'MANAGE_CLASS_GROUPS',
  VIEW_CLASS_GROUPS = 'VIEW_CLASS_GROUPS',
  MANAGE_ASSIGNMENTS = 'MANAGE_ASSIGNMENTS',
  VIEW_ASSIGNMENTS = 'VIEW_ASSIGNMENTS',
  SUBMIT_ASSIGNMENTS = 'SUBMIT_ASSIGNMENTS',
  MANAGE_ATTENDANCE = 'MANAGE_ATTENDANCE',
  VIEW_ATTENDANCE = 'VIEW_ATTENDANCE',
  MANAGE_GRADES = 'MANAGE_GRADES',
  VIEW_GRADES = 'VIEW_GRADES',
  MANAGE_MESSAGES = 'MANAGE_MESSAGES',
  VIEW_MESSAGES = 'VIEW_MESSAGES',
  MANAGE_FILES = 'MANAGE_FILES',
  VIEW_FILES = 'VIEW_FILES',
  MANAGE_QUIZZES = 'MANAGE_QUIZZES',
  VIEW_QUIZZES = 'VIEW_QUIZZES',
  MANAGE_SCHEDULES = 'MANAGE_SCHEDULES',
  VIEW_SCHEDULES = 'VIEW_SCHEDULES',
  MANAGE_STUDY_PLANS = 'MANAGE_STUDY_PLANS',
  VIEW_STUDY_PLANS = 'VIEW_STUDY_PLANS',
  MANAGE_PERIODS = 'MANAGE_PERIODS',
  VIEW_PERIODS = 'VIEW_PERIODS',
  MANAGE_ROLES = 'MANAGE_ROLES',
  MANAGE_PERMISSIONS = 'MANAGE_PERMISSIONS',
}

const PERMISSION_DESCRIPTIONS: Record<Perm, string> = {
  [Perm.MANAGE_SCHOOLS]: 'Create, update, and delete schools',
  [Perm.VIEW_SCHOOLS]: 'View school information',
  [Perm.MANAGE_TEACHERS]: 'Create, update, and delete teachers',
  [Perm.VIEW_TEACHERS]: 'View teacher information',
  [Perm.MANAGE_STUDENTS]: 'Create, update, and delete students',
  [Perm.VIEW_STUDENTS]: 'View student information',
  [Perm.MANAGE_PARENTS]: 'Create, update, and delete parents',
  [Perm.VIEW_PARENTS]: 'View parent information',
  [Perm.MANAGE_COURSES]: 'Create, update, and delete courses',
  [Perm.VIEW_COURSES]: 'View course information',
  [Perm.MANAGE_SUBJECTS]: 'Create, update, and delete subjects',
  [Perm.VIEW_SUBJECTS]: 'View subject information',
  [Perm.MANAGE_CLASS_GROUPS]: 'Create, update, and delete class groups',
  [Perm.VIEW_CLASS_GROUPS]: 'View class group information',
  [Perm.MANAGE_ASSIGNMENTS]: 'Create, update, and delete assignments',
  [Perm.VIEW_ASSIGNMENTS]: 'View assignment information',
  [Perm.SUBMIT_ASSIGNMENTS]: 'Submit assignment responses',
  [Perm.MANAGE_ATTENDANCE]: 'Record and manage attendance',
  [Perm.VIEW_ATTENDANCE]: 'View attendance records',
  [Perm.MANAGE_GRADES]: 'Create, update, and delete grades',
  [Perm.VIEW_GRADES]: 'View grade information',
  [Perm.MANAGE_MESSAGES]: 'Send and manage messages',
  [Perm.VIEW_MESSAGES]: 'View messages',
  [Perm.MANAGE_FILES]: 'Upload and manage files',
  [Perm.VIEW_FILES]: 'View and download files',
  [Perm.MANAGE_QUIZZES]: 'Create, update, and delete quizzes',
  [Perm.VIEW_QUIZZES]: 'View quizzes',
  [Perm.MANAGE_SCHEDULES]: 'Create, update, and delete schedules',
  [Perm.VIEW_SCHEDULES]: 'View schedules',
  [Perm.MANAGE_STUDY_PLANS]: 'Create, update, and delete study plans',
  [Perm.VIEW_STUDY_PLANS]: 'View study plans',
  [Perm.MANAGE_PERIODS]: 'Create, update, and delete periods',
  [Perm.VIEW_PERIODS]: 'View periods',
  [Perm.MANAGE_ROLES]: 'Create, update, and delete roles',
  [Perm.MANAGE_PERMISSIONS]: 'Manage permission assignments',
};

const ALL_PERMISSIONS = Object.values(Perm);

interface RoleDef {
  name: string;
  description: string;
  permissions: Perm[];
}

const DEFAULT_ROLES: RoleDef[] = [
  {
    name: 'ORG_ADMIN',
    description: 'Organization Administrator',
    permissions: ALL_PERMISSIONS as Perm[],
  },
  {
    name: 'TEACHER',
    description: 'Teacher',
    permissions: [
      Perm.VIEW_SCHOOLS,
      Perm.VIEW_TEACHERS,
      Perm.VIEW_STUDENTS,
      Perm.VIEW_PARENTS,
      Perm.VIEW_COURSES,
      Perm.VIEW_SUBJECTS,
      Perm.VIEW_CLASS_GROUPS,
      Perm.VIEW_STUDY_PLANS,
      Perm.VIEW_PERIODS,
      Perm.VIEW_SCHEDULES,
      Perm.VIEW_ASSIGNMENTS,
      Perm.VIEW_ATTENDANCE,
      Perm.VIEW_GRADES,
      Perm.VIEW_MESSAGES,
      Perm.VIEW_FILES,
      Perm.VIEW_QUIZZES,
      Perm.MANAGE_ASSIGNMENTS,
      Perm.MANAGE_ATTENDANCE,
      Perm.MANAGE_GRADES,
      Perm.MANAGE_MESSAGES,
      Perm.MANAGE_FILES,
      Perm.MANAGE_QUIZZES,
    ],
  },
  {
    name: 'STUDENT',
    description: 'Student',
    permissions: [
      Perm.VIEW_SCHOOLS,
      Perm.VIEW_TEACHERS,
      Perm.VIEW_STUDENTS,
      Perm.VIEW_COURSES,
      Perm.VIEW_SUBJECTS,
      Perm.VIEW_CLASS_GROUPS,
      Perm.VIEW_ASSIGNMENTS,
      Perm.SUBMIT_ASSIGNMENTS,
      Perm.VIEW_ATTENDANCE,
      Perm.VIEW_GRADES,
      Perm.VIEW_MESSAGES,
      Perm.MANAGE_MESSAGES,
      Perm.VIEW_FILES,
      Perm.VIEW_QUIZZES,
      Perm.VIEW_SCHEDULES,
      Perm.VIEW_STUDY_PLANS,
      Perm.VIEW_PERIODS,
    ],
  },
  {
    name: 'PARENT',
    description: 'Parent or Guardian',
    permissions: [
      Perm.VIEW_COURSES,
      Perm.VIEW_ASSIGNMENTS,
      Perm.VIEW_ATTENDANCE,
      Perm.VIEW_GRADES,
      Perm.VIEW_MESSAGES,
      Perm.VIEW_SCHEDULES,
    ],
  },
];

// ── Main ───────────────────────────────────────────────────────────────────

const adapter = new PrismaPg({
  connectionString: process.env['DATABASE_URL']!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding permissions and default roles...\n');

  await prisma.$transaction(async (tx) => {
    // 1. Upsert all permissions
    const permissionMap = new Map<string, string>(); // descriptiveId → id

    for (const descriptiveId of ALL_PERMISSIONS) {
      const perm = await tx.permission.upsert({
        where: { descriptiveId },
        update: { description: PERMISSION_DESCRIPTIONS[descriptiveId] },
        create: {
          descriptiveId,
          description: PERMISSION_DESCRIPTIONS[descriptiveId],
        },
      });
      permissionMap.set(descriptiveId, perm.id);
    }

    console.log(`✓ Upserted ${permissionMap.size} permissions`);

    // 2. Upsert global default roles (organizationId = null)
    // Prisma doesn't support null in composite unique where, so use findFirst + create/update
    for (const roleDef of DEFAULT_ROLES) {
      const permissionConnections = roleDef.permissions.map((p) => ({
        id: permissionMap.get(p)!,
      }));

      const existing = await tx.role.findFirst({
        where: { name: roleDef.name, organizationId: null },
      });

      if (existing) {
        await tx.role.update({
          where: { id: existing.id },
          data: {
            description: roleDef.description,
            permissions: { set: permissionConnections },
          },
        });
      } else {
        await tx.role.create({
          data: {
            name: roleDef.name,
            description: roleDef.description,
            permissions: { connect: permissionConnections },
          },
        });
      }

      console.log(`✓ Upserted global role: ${roleDef.name} (${roleDef.permissions.length} permissions)`);
    }
  });

  console.log('\n========================================');
  console.log('Permissions and default roles seeded successfully!');
  console.log('========================================');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
