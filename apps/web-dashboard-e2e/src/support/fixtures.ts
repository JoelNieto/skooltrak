/**
 * Known e2e dataset. `scripts/prepare-db.ts` seeds exactly this into the isolated e2e database,
 * and specs reference it by name. Keep the seed and this file in sync.
 */

export const E2E_PASSWORD = 'E2e-Passw0rd!';

export const personas = {
  admin: { email: 'admin.e2e@skooltrak.test', firstName: 'Ada', lastName: 'Admin', role: 'ORG_ADMIN' },
  teacher: { email: 'teacher.e2e@skooltrak.test', firstName: 'Tomás', lastName: 'Docente', role: 'TEACHER' },
  otherTeacher: { email: 'teacher2.e2e@skooltrak.test', firstName: 'Olga', lastName: 'Docente', role: 'TEACHER' },
} as const;

export type PersonaKey = keyof typeof personas;

export const storageStatePath = (persona: PersonaKey) => `apps/web-dashboard-e2e/.auth/${persona}.json`;

/**
 * Study plan "7°" holds `teacher`'s course; study plan "8°" holds `otherTeacher`'s course.
 * `teacher` is also the homeroom teacher of the 8° group (homeroom must NOT grant broadcast access).
 */
export const data = {
  organization: 'Organización E2E',
  school: 'Colegio E2E',
  studyPlans: { seventh: '7° E2E', eighth: '8° E2E' },
  courses: {
    teacherOwn: { name: 'Matemáticas 7° E2E', code: 'MATE2E7' },
    otherTeachers: { name: 'Ciencias 8° E2E', code: 'CIEE2E8' },
  },
  classGroups: {
    /** Related to `teacher` (same study plan as their course). */
    related: '7°A E2E',
    /** `teacher` is homeroom only; no course of theirs in this study plan. */
    homeroomOnly: '8°A E2E',
  },
} as const;
