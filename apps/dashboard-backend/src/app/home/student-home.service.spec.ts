import { ForbiddenException } from '@nestjs/common';
import { AssignmentType, WeekDay } from '@generated/prisma';
import { StudentHomeService, workStatus } from './student-home.service';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

/** HOM-001-S04: student "Ahora / Siguiente", today's classes and work (BR-HOM-001.8, .12). */
describe('StudentHomeService (HOM-001-S04)', () => {
  const ORG = 'org-1';
  const user = { userId: 'user-student', organizationId: ORG, role: 'STUDENT' };
  // Monday 16 Nov 2026, 09:15 in Panama.
  const NOW = new Date('2026-11-16T14:15:00Z');
  const GROUP = { id: 'cg-9a', name: '9°A' };

  const slot = (id: string, startTime: string, endTime: string, extra: Record<string, unknown> = {}) => ({
    id,
    startTime,
    endTime,
    location: 'Aula 12',
    remote: false,
    remoteLink: '',
    recess: false,
    course: { id: `c-${id}`, name: `Curso ${id}`, teacher: { firstName: 'Carlos', fatherName: 'Méndez' } },
    ...extra,
  });

  function build(opts: { student?: unknown; slots?: unknown[]; dates?: unknown[] } = {}) {
    const prisma = {
      student: {
        findFirst: jest.fn().mockResolvedValue(
          opts.student === undefined
            ? {
                id: 'st-1',
                firstName: 'Sofía',
                classGroup: GROUP,
                school: { id: 'school-1', currentYear: 2026, timezone: 'America/Panama' },
              }
            : opts.student,
        ),
      },
      period: { findMany: jest.fn().mockResolvedValue([]) },
      classGroupWeeklySchedule: { findMany: jest.fn().mockResolvedValue(opts.slots ?? []) },
      assignmentDate: { findMany: jest.fn().mockResolvedValue(opts.dates ?? []) },
    };
    return { service: new StudentHomeService(prisma as never, { now: () => NOW }), prisma };
  }

  describe('today (FR-HOM-001.12)', () => {
    it("shows today's classes of the student's own group with the current and next class", async () => {
      const { service, prisma } = build({
        slots: [
          slot('a', '07:00', '07:45'),
          slot('b', '08:45', '09:00', { recess: true }),
          slot('c', '09:00', '10:30'),
          slot('d', '10:30', '11:15', { remote: true, remoteLink: 'https://meet.test/x', course: { id: 'c-d', name: 'Arte', teacher: null } }),
        ],
      });

      const today = await service.today(user);

      expect(prisma.student.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-student', organizationId: ORG } }),
      );
      expect(prisma.classGroupWeeklySchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { classGroupId: 'cg-9a', weekday: WeekDay.MONDAY, classGroup: { organizationId: ORG } },
        }),
      );
      expect(today.slots.map((s) => [s.id, s.state])).toEqual([
        ['a', 'PAST'],
        ['b', 'PAST'],
        ['c', 'NOW'],
        ['d', 'LATER'],
      ]);
      expect(today.now?.id).toBe('c');
      expect(today.now?.teacherName).toBe('Carlos Méndez');
      expect(today.next).toMatchObject({ id: 'd', teacherName: null, course: { id: 'c-d', name: 'Arte' } });
      expect(today).toMatchObject({ firstName: 'Sofía', date: '2026-11-16', time: '09:15', classGroup: GROUP });
    });

    it('has no schedule without a class group', async () => {
      const { service, prisma } = build({
        student: {
          id: 'st-1',
          firstName: 'Sofía',
          classGroup: null,
          school: { id: 'school-1', currentYear: 2026, timezone: 'America/Panama' },
        },
      });

      const today = await service.today(user);

      expect(today).toMatchObject({ classGroup: null, slots: [], now: null, next: null });
      expect(prisma.classGroupWeeklySchedule.findMany).not.toHaveBeenCalled();
    });

    it('refuses a user without a student record in the organization', async () => {
      const { service } = build({ student: null });

      await expect(service.today(user)).rejects.toThrow(
        new ForbiddenException('No student profile in this organization'),
      );
      await expect(service.today({ ...user, organizationId: null })).rejects.toThrow(ForbiddenException);
    });
  });

  describe('work (FR-HOM-001.14)', () => {
    const due = (id: string, date: string, requireSubmission = true, submittedAt?: string) => ({
      date: new Date(date),
      assignment: {
        id,
        title: id,
        type: requireSubmission ? AssignmentType.HOMEWORK : AssignmentType.EXAM,
        requireSubmission,
        course: { id: 'c-1', name: 'Matemáticas' },
        submissions: submittedAt ? [{ submittedAt: new Date(submittedAt) }] : [],
      },
    });

    it("lists the group's work from today on and overdue work, overdue first", async () => {
      const { service, prisma } = build({
        dates: [
          due('overdue', '2026-11-14T22:00:00Z'),
          due('handed-in-past', '2026-11-13T22:00:00Z', true, '2026-11-13T20:00:00Z'),
          due('handed-in-today', '2026-11-16T13:00:00Z', true, '2026-11-15T20:00:00Z'),
          due('exam', '2026-11-17T14:00:00Z', false),
          due('pending', '2026-11-19T04:59:00Z'),
        ],
      });

      const work = await service.work(user);

      expect(prisma.assignmentDate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            classGroupId: 'cg-9a',
            // 9 Nov 00:00 → 1 Dec 00:00, Panama time
            date: { gte: new Date('2026-11-09T05:00:00Z'), lt: new Date('2026-12-01T05:00:00Z') },
            assignment: { course: { organizationId: ORG } },
          },
        }),
      );
      expect(work.items.map((i) => [i.assignmentId, i.status])).toEqual([
        ['overdue', 'VENCIDA'],
        ['handed-in-today', 'ENTREGADO'],
        ['exam', 'PRESENCIAL'],
        ['pending', 'PENDIENTE'],
      ]);
      expect(work.items[1].submittedAt).toBe('2026-11-15T20:00:00.000Z');
    });

    it('has no work without a class group', async () => {
      const { service, prisma } = build({
        student: { id: 'st-1', firstName: 'Sofía', classGroup: null, school: { id: 's', currentYear: 2026, timezone: 'UTC' } },
      });

      expect((await service.work(user)).items).toEqual([]);
      expect(prisma.assignmentDate.findMany).not.toHaveBeenCalled();
    });
  });

  describe('workStatus (BR-HOM-001.12)', () => {
    const past = new Date('2026-11-15T00:00:00Z');
    const future = new Date('2026-11-17T00:00:00Z');

    it.each([
      [past, true, true, 'ENTREGADO'],
      [future, true, true, 'ENTREGADO'],
      [past, false, false, 'PRESENCIAL'],
      [past, true, false, 'VENCIDA'],
      [future, true, false, 'PENDIENTE'],
    ] as const)('due %s, requireSubmission=%s, submitted=%s → %s', (dueAt, requireSubmission, submitted, expected) => {
      expect(workStatus({ dueAt, requireSubmission, submitted }, NOW)).toBe(expected);
    });
  });
});
