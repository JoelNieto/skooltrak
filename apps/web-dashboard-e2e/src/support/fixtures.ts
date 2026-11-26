/**
 * Known e2e dataset. `scripts/prepare-db.ts` seeds exactly this into the isolated e2e database,
 * and specs reference it by name. Keep the seed and this file in sync.
 */

export const E2E_PASSWORD = 'E2e-Passw0rd!';

export const personas = {
  admin: { email: 'admin.e2e@skooltrak.test', firstName: 'Ada', lastName: 'Admin', role: 'ORG_ADMIN' },
  teacher: { email: 'teacher.e2e@skooltrak.test', firstName: 'Tomás', lastName: 'Docente', role: 'TEACHER' },
  otherTeacher: { email: 'teacher2.e2e@skooltrak.test', firstName: 'Olga', lastName: 'Docente', role: 'TEACHER' },
  /** Logs in as the first related student (HOM-001-S04 student home). */
  student: { email: 'student.e2e@skooltrak.test', firstName: 'Ana', lastName: 'E2E', role: 'STUDENT' },
  /** Guardian of the first related student (HOM-001-S03 family thread; parent home later). */
  parent: { email: 'parent.e2e@skooltrak.test', firstName: 'Paula', lastName: 'Acudiente', role: 'PARENT' },
} as const;

export type PersonaKey = keyof typeof personas;

export const storageStatePath = (persona: PersonaKey) => `apps/web-dashboard-e2e/.auth/${persona}.json`;

/**
 * Study plan "7°" holds `teacher`'s course; study plan "8°" holds `otherTeacher`'s course.
 * `teacher` is also the homeroom teacher of the 8° group (homeroom must NOT grant channel access, BR-COM-003.2).
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
  /** Enrolled in `related` and in `teacher`'s course (HOM-001-S01 attendance). */
  relatedStudents: ['Ana', 'Beto', 'Carla'],
  /**
   * Weekly slots seeded on **every** weekday, so the teacher home has classes whatever day the
   * suite runs (HOM-001-S01). `early` has always ended (missed until attendance is taken), `late`
   * is always still ahead, except when the suite runs within those half hours.
   * `otherTeachers` course is scheduled in `homeroomOnly` and must never show on `teacher`'s home.
   */
  schedule: {
    early: { startTime: '00:00', endTime: '00:30' },
    late: { startTime: '23:30', endTime: '23:59' },
  },
  /**
   * HOM-001-S02. The school year is the current one; its period started 30 days ago and closes
   * 10 days after the seed runs (inside the 14-day banner window). In `teacher`'s course, `grade` is
   * unpublished and has a score for the first related student only (2 empty cells), and
   * `assignment` is due today for `related`, handed in by the first student and not yet reviewed.
   */
  period: { name: 'Periodo E2E', closesInDays: 10 },
  grade: { title: 'Prueba corta E2E', bucket: 'Pruebas' },
  assignment: { title: 'Proyecto E2E' },
  /**
   * HOM-001-S03. The 7° study plan uses `metric` (pass mark 3.0 of 5.0). `publishedGrade` is
   * published and fully scored with `publishedScores` (one per related student, in order), so the
   * second student is below the pass mark and the tile average is 3.5. `familyThread`'s last message
   * is from `parent`, waiting for `teacher`'s answer.
   */
  metric: { name: 'Escala 1–5 E2E', minimum: 1, maximum: 5, minimumApproval: 3, minimumExcellence: 4.5 },
  publishedGrade: { title: 'Taller E2E' },
  publishedScores: [4, 2, 4.5],
  familyThread: { parentMessage: '¿Podemos hablar sobre las notas de Ana?' },
  /**
   * HOM-001-S04 work of `related` in `teacher`'s course, relative to the seed time, plus one
   * assignment of the other teacher for `homeroomOnly` that the student must never see.
   * With `assignment` (due now, handed in by the first student) the student home lists, in order:
   * overdue, handed in, in class, pending.
   */
  studentWork: {
    overdue: { title: 'Ensayo vencido E2E', type: 'PAPER', inDays: -2, requireSubmission: true },
    inClass: { title: 'Examen E2E', type: 'EXAM', inDays: 1, requireSubmission: false },
    pending: { title: 'Tarea pendiente E2E', type: 'HOMEWORK', inDays: 3, requireSubmission: true },
    otherGroup: { title: 'Tarea 8° E2E', type: 'HOMEWORK', inDays: 1, requireSubmission: true },
  },
  /**
   * HOM-001-S06. `parent` is linked to the first two related students. The first has a charge due
   * in 3 days and overdue work (2 alerts); the second has overdue work and an average below the pass
   * mark (2 alerts), so the tie goes to the first alphabetically.
   */
  charge: { description: 'Mensualidad E2E', amount: 285, inDays: 3 },
  /**
   * HOM-001-S08 admin attention: a pending teacher join request, an overdue charge of the third related student (not linked to `parent`) and a failed
   * import. The 8° study plan has no grade metric, and the 00:00 slots give classes without attendance.
   */
  admin: {
    applicant: { email: 'applicant.e2e@skooltrak.test', firstName: 'Pedro', lastName: 'Postulante' },
    overdueCharge: { description: 'Matrícula E2E', amount: 150, inDays: -10 },
  },
  /**
   * FIN-001-S01. Ana and Beto share `parent`, so one family account ("Familia E2E", C-0001) holding
   * `charge`; Carla's own account holds `admin.overdueCharge`. The admin adds `manualCharge` to Beto.
   */
  finance: {
    familyName: 'Familia E2E',
    manualCharge: { description: 'Excursión E2E', amount: 25, inDays: 40 },
    /** The degree of both study plans (prepare-db). */
    degree: 'Premedia E2E',
    /**
     * FIN-001-S02: created by the admin, assigned for next year to `degree` at `amount` and to the
     * 7° plan at `planAmount`, then generated for Carla only (3 installments).
     */
    fee: { name: 'Transporte E2E', amount: 30, planAmount: 20, dueDay: 5 },
  },
} as const;
