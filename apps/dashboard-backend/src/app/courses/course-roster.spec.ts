import { EnrollmentSource } from '@generated/prisma';
import { enrolledCourses, enrolledIn, enrollPlanStudents, resyncCoursePlan, RosterDb, syncStudentPlan } from './course-roster';

/**
 * Roster rules (ACA-001 BR .15), run against an in-memory stand-in for the queries the module makes.
 *
 * Org 1: plan P (courses C1, C2), plan R (course R1), groups G (P), G2 (P), H (R).
 * Org 2: plan X (course X1), group GX (X).
 */
type Enrollment = { courseId: string; studentId: string; source: EnrollmentSource; excluded: boolean };

const { PLAN, MANUAL } = EnrollmentSource;

function world() {
  const courses = [
    { id: 'C1', studyPlanId: 'P', organizationId: 'org-1' },
    { id: 'C2', studyPlanId: 'P', organizationId: 'org-1' },
    { id: 'R1', studyPlanId: 'R', organizationId: 'org-1' },
    { id: 'X1', studyPlanId: 'X', organizationId: 'org-2' },
  ];
  const classGroups = [
    { id: 'G', studyPlanId: 'P', organizationId: 'org-1' },
    { id: 'G2', studyPlanId: 'P', organizationId: 'org-1' },
    { id: 'H', studyPlanId: 'R', organizationId: 'org-1' },
    { id: 'GX', studyPlanId: 'X', organizationId: 'org-2' },
  ];
  const students = [
    { id: 'S', organizationId: 'org-1', classGroupId: 'G' as string | null },
    { id: 'S2', organizationId: 'org-1', classGroupId: 'G' as string | null },
    { id: 'T', organizationId: 'org-1', classGroupId: 'H' as string | null },
    { id: 'Z', organizationId: 'org-2', classGroupId: 'GX' as string | null },
  ];
  const enrollments: Enrollment[] = [];

  const planOf = (groupId: string | null) => classGroups.find((g) => g.id === groupId)?.studyPlanId;
  const inList = (value: string, filter: unknown) =>
    typeof filter === 'string'
      ? value === filter
      : filter && typeof filter === 'object' && 'in' in filter
        ? (filter as { in: string[] }).in.includes(value)
        : filter && typeof filter === 'object' && 'notIn' in filter
          ? !(filter as { notIn: string[] }).notIn.includes(value)
          : true;
  const matchEnrollment = (e: Enrollment, where: Record<string, unknown>) =>
    (where['studentId'] === undefined || e.studentId === where['studentId']) &&
    (where['source'] === undefined || e.source === where['source']) &&
    inList(e.courseId, where['courseId']);

  const db = {
    student: {
      findUniqueOrThrow: jest.fn(async ({ where }: { where: { id: string } }) => {
        const s = students.find((x) => x.id === where.id);
        if (!s) throw new Error('not found');
        return s;
      }),
      findMany: jest.fn(
        async ({ where }: { where: { organizationId: string; classGroup: { studyPlanId: string }; courseEnrollments: { none: { courseId: string } } } }) =>
          students.filter(
            (s) =>
              s.organizationId === where.organizationId &&
              planOf(s.classGroupId) === where.classGroup.studyPlanId &&
              !enrollments.some((e) => e.studentId === s.id && e.courseId === where.courseEnrollments.none.courseId),
          ),
      ),
    },
    classGroup: {
      findFirst: jest.fn(
        async ({ where }: { where: { id: string; organizationId: string } }) =>
          classGroups.find((g) => g.id === where.id && g.organizationId === where.organizationId) ?? null,
      ),
    },
    course: {
      findMany: jest.fn(async ({ where }: { where: { studyPlanId: string; organizationId: string } }) =>
        courses.filter((c) => c.studyPlanId === where.studyPlanId && c.organizationId === where.organizationId),
      ),
    },
    courseEnrollment: {
      deleteMany: jest.fn(async ({ where }: { where: Record<string, unknown> }) => {
        const before = enrollments.length;
        const keep = enrollments.filter((e) => !matchEnrollment(e, where));
        enrollments.splice(0, enrollments.length, ...keep);
        return { count: before - keep.length };
      }),
      findMany: jest.fn(async ({ where }: { where: Record<string, unknown> }) => enrollments.filter((e) => matchEnrollment(e, where))),
      createMany: jest.fn(async ({ data }: { data: Omit<Enrollment, 'excluded'>[] }) => {
        let count = 0;
        for (const d of data) {
          if (enrollments.some((e) => e.courseId === d.courseId && e.studentId === d.studentId)) continue; // skipDuplicates
          enrollments.push({ ...d, excluded: false });
          count++;
        }
        return { count };
      }),
    },
  };

  const move = (studentId: string, groupId: string | null) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) throw new Error(`unknown student ${studentId}`);
    student.classGroupId = groupId;
  };
  const rosterOf = (studentId: string) =>
    enrollments
      .filter((e) => e.studentId === studentId)
      .map((e) => `${e.courseId}:${e.source}${e.excluded ? ':excluded' : ''}`)
      .sort();
  const courseRoster = (courseId: string) =>
    enrollments
      .filter((e) => e.courseId === courseId)
      .map((e) => `${e.studentId}:${e.source}${e.excluded ? ':excluded' : ''}`)
      .sort();

  return { db: db as unknown as RosterDb, enrollments, courses, move, rosterOf, courseRoster };
}

describe('course roster (ACA-001 BR .15, FR .20)', () => {
  describe('syncStudentPlan', () => {
    it("enrolls a new student in every course of their group's plan", async () => {
      const w = world();
      const active = await syncStudentPlan(w.db, 'S', 'G');
      expect(active.sort()).toEqual(['C1', 'C2']);
      expect(w.rosterOf('S')).toEqual(['C1:PLAN', 'C2:PLAN']);
    });

    it('moves PLAN enrollments to the new plan, dropping old exclusions and keeping MANUAL rows', async () => {
      const w = world();
      w.enrollments.push(
        { courseId: 'C1', studentId: 'S', source: PLAN, excluded: false },
        { courseId: 'C2', studentId: 'S', source: PLAN, excluded: true },
        { courseId: 'X1', studentId: 'S', source: MANUAL, excluded: false },
      );
      w.move('S', 'H');

      const active = await syncStudentPlan(w.db, 'S', 'H');

      expect(active).toEqual(['R1']);
      expect(w.rosterOf('S')).toEqual(['R1:PLAN', 'X1:MANUAL']);
    });

    it('keeps exclusions when the new group has the same plan', async () => {
      const w = world();
      w.enrollments.push(
        { courseId: 'C1', studentId: 'S', source: PLAN, excluded: false },
        { courseId: 'C2', studentId: 'S', source: PLAN, excluded: true },
      );
      w.move('S', 'G2');

      const active = await syncStudentPlan(w.db, 'S', 'G2');

      expect(active).toEqual(['C1']);
      expect(w.rosterOf('S')).toEqual(['C1:PLAN', 'C2:PLAN:excluded']);
    });

    it('keeps a MANUAL row as MANUAL when its course joins the student’s plan', async () => {
      const w = world();
      w.enrollments.push({ courseId: 'R1', studentId: 'S', source: MANUAL, excluded: false });
      w.move('S', 'H');

      await syncStudentPlan(w.db, 'S', 'H');

      expect(w.rosterOf('S')).toEqual(['R1:MANUAL']);
    });

    it('removes PLAN rows and keeps MANUAL rows when the group is cleared', async () => {
      const w = world();
      w.enrollments.push(
        { courseId: 'C1', studentId: 'S', source: PLAN, excluded: false },
        { courseId: 'R1', studentId: 'S', source: MANUAL, excluded: false },
      );
      w.move('S', null);

      expect(await syncStudentPlan(w.db, 'S', null)).toEqual([]);
      expect(w.rosterOf('S')).toEqual(['R1:MANUAL']);
    });

    it("never enrolls a student through another organization's class group", async () => {
      const w = world();
      expect(await syncStudentPlan(w.db, 'S', 'GX')).toEqual([]);
      expect(w.rosterOf('S')).toEqual([]);
    });
  });

  describe('enrollPlanStudents (course created)', () => {
    it("enrolls the plan's students once, in the course's organization only", async () => {
      const w = world();
      w.enrollments.push({ courseId: 'C1', studentId: 'S', source: MANUAL, excluded: false });

      const added = await enrollPlanStudents(w.db, w.courses[0]);

      expect(added).toEqual(['S2']);
      expect(w.courseRoster('C1')).toEqual(['S2:PLAN', 'S:MANUAL']);
    });
  });

  describe('resyncCoursePlan (course moved to another plan, decided 2026-11-20)', () => {
    it("replaces PLAN rows, exclusions included, with the new plan's students and keeps MANUAL rows", async () => {
      const w = world();
      w.enrollments.push(
        { courseId: 'C1', studentId: 'S', source: PLAN, excluded: false },
        { courseId: 'C1', studentId: 'S2', source: PLAN, excluded: true },
        { courseId: 'C1', studentId: 'Z', source: MANUAL, excluded: false },
      );
      const course = { ...w.courses[0], studyPlanId: 'R' };

      const added = await resyncCoursePlan(w.db, course);

      expect(added).toEqual(['T']);
      expect(w.courseRoster('C1')).toEqual(['T:PLAN', 'Z:MANUAL']);
    });
  });

  describe('read filters', () => {
    it('skip excluded rows', () => {
      expect(enrolledIn('C1')).toEqual({ courseEnrollments: { some: { excluded: false, courseId: 'C1' } } });
      expect(enrolledIn(['C1', 'C2'])).toEqual({ courseEnrollments: { some: { excluded: false, courseId: { in: ['C1', 'C2'] } } } });
      expect(enrolledCourses({ userId: 'u-1' })).toEqual({ enrollments: { some: { excluded: false, student: { userId: 'u-1' } } } });
    });
  });
});
