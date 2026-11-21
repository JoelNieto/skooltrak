import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AttendanceStatus, WeekDay } from '@generated/prisma';
import { AdminHomeService } from './admin-home.service';

jest.mock('../prisma.service', () => ({ PrismaService: class {} }));

/** HOM-001-S08: admin attention tiles, period banner and KPIs (BR-HOM-001.10, .14, .15, .16). */
describe('AdminHomeService (HOM-001-S08)', () => {
  const ORG = 'org-1';
  const SCHOOL = 'school-1';
  const admin = { userId: 'user-admin', organizationId: ORG, role: 'ORG_ADMIN', permissions: [] as string[] };
  // Monday 16 Nov 2026, 09:15 in Panama.
  const NOW = new Date('2026-11-16T14:15:00Z');
  const decimal = (n: number) => ({ toNumber: () => n });
  const PERIOD = {
    id: 'p2',
    name: 'II Trimestre',
    startDate: new Date('2026-09-01T05:00:00Z'),
    endDate: new Date('2026-11-26T05:00:00Z'),
  };

  function build(o: Record<string, unknown> = {}) {
    const prisma = {
      school: {
        findFirst: jest.fn().mockResolvedValue(
          o['school'] === undefined
            ? { id: SCHOOL, name: 'Colegio', currentYear: 2026, timezone: 'America/Panama', currencyCode: 'USD' }
            : o['school'],
        ),
      },
      user: { findUnique: jest.fn().mockResolvedValue({ firstName: 'Ana', name: 'Ana Admin' }) },
      period: { findMany: jest.fn().mockResolvedValue(o['periods'] ?? [PERIOD]) },
      joinRequest: { findMany: jest.fn().mockResolvedValue(o['joinRequests'] ?? []) },
      communicationThread: { count: jest.fn().mockResolvedValue(o['broadcasts'] ?? 0) },
      classGroupWeeklySchedule: { findMany: jest.fn().mockResolvedValue(o['slots'] ?? []) },
      attendanceSession: { findMany: jest.fn().mockResolvedValue(o['sessions'] ?? []) },
      charge: {
        findMany: jest.fn().mockImplementation(({ where }) =>
          Promise.resolve(where.dueDate.gte ? (o['monthCharges'] ?? []) : (o['overdueCharges'] ?? [])),
        ),
      },
      importJob: { count: jest.fn().mockResolvedValue(o['imports'] ?? 0) },
      studyPlan: { count: jest.fn().mockResolvedValue(o['plans'] ?? 0) },
      course: {
        findMany: jest.fn().mockImplementation(({ select }) =>
          Promise.resolve(select._count ? (o['courseCounts'] ?? []) : (o['courseScales'] ?? [])),
        ),
      },
      grade: { findMany: jest.fn().mockResolvedValue(o['grades'] ?? []) },
      student: { groupBy: jest.fn().mockResolvedValue(o['statuses'] ?? []) },
      attendanceRecord: {
        groupBy: jest.fn().mockImplementation(({ where }) => {
          const from = where.attendanceSession.date.gte.toISOString().slice(0, 10);
          return Promise.resolve(from === '2026-11-16' ? (o['today'] ?? []) : (o['lastWeek'] ?? []));
        }),
      },
      $queryRaw: jest.fn().mockResolvedValue(o['averages'] ?? []),
    };
    return { service: new AdminHomeService(prisma as never, { now: () => NOW }), prisma };
  }

  describe('attention (FR-HOM-001.24)', () => {
    it('counts every tile for the school', async () => {
      const { service, prisma } = build({
        joinRequests: [
          { requestedRole: 'TEACHER', createdAt: new Date('2026-11-13T10:00:00Z') },
          { requestedRole: 'TEACHER', createdAt: new Date('2026-11-15T10:00:00Z') },
          { requestedRole: 'PARENT', createdAt: new Date('2026-11-14T10:00:00Z') },
        ],
        broadcasts: 2,
        slots: [
          { courseId: 'c1', classGroupId: 'g1' },
          { courseId: 'c1', classGroupId: 'g1' }, // same class twice today
          { courseId: 'c2', classGroupId: 'g1' },
          { courseId: 'c3', classGroupId: 'g2' },
        ],
        sessions: [{ courseId: 'c2', classGroupId: 'g1' }],
        overdueCharges: [
          // 285 − 85 = 200 owed; parents p1 + p2
          { amount: decimal(285), studentId: 's1', payments: [{ amount: decimal(85) }], student: { parents: [{ id: 'p2' }, { id: 'p1' }] } },
          // sibling of s1: same parents → same family
          { amount: decimal(100), studentId: 's2', payments: [], student: { parents: [{ id: 'p1' }, { id: 'p2' }] } },
          // no parents → one family by itself
          { amount: decimal(50), studentId: 's3', payments: [], student: { parents: [] } },
          // fully paid → not overdue
          { amount: decimal(70), studentId: 's4', payments: [{ amount: decimal(70) }], student: { parents: [{ id: 'p9' }] } },
        ],
        imports: 1,
        plans: 3,
      });

      const { tiles, firstName } = await service.attention(admin, SCHOOL);

      expect(firstName).toBe('Ana');
      expect(tiles).toEqual({
        joinRequests: { total: 3, teachers: 2, parents: 1, others: 0, oldestAt: '2026-11-13T10:00:00.000Z' },
        broadcastsToApprove: 2,
        missedAttendance: 2,
        overdueCharges: { count: 3, amount: 350, families: 2 },
        failedImports: 1,
        plansWithoutScale: 3,
      });
      expect(prisma.classGroupWeeklySchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            weekday: WeekDay.MONDAY,
            recess: false,
            startTime: { lte: '09:15' },
            classGroup: { organizationId: ORG, schoolId: SCHOOL, active: true },
          },
        }),
      );
      expect(prisma.joinRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { schoolId: SCHOOL, status: 'PENDING', school: { organizationId: ORG } } }),
      );
      expect(prisma.communicationThread.count).toHaveBeenCalledWith({
        where: { organizationId: ORG, broadcast: true, status: 'PENDING_APPROVAL', deletedAt: null },
      });
    });

    it('omits overdue charges without VIEW_FINANCIALS', async () => {
      const { service, prisma } = build();

      const { tiles } = await service.attention({ ...admin, role: 'COORDINATOR', permissions: ['VIEW_SCHOOL_DASHBOARD'] }, SCHOOL);

      expect(tiles.overdueCharges).toBeNull();
      expect(prisma.charge.findMany).not.toHaveBeenCalled();
    });

    it('shows the period banner with courses missing grades while the period closes within 14 days', async () => {
      const { service } = build({
        courseCounts: [
          { id: 'c1', _count: { enrollments: 3 } },
          { id: 'c2', _count: { enrollments: 2 } },
        ],
        grades: [
          { courseId: 'c1', _count: { studentGrades: 1 } },
          { courseId: 'c2', _count: { studentGrades: 2 } },
        ],
      });

      expect((await service.attention(admin, SCHOOL)).periodClose).toEqual({
        name: 'II Trimestre',
        endDate: '2026-11-26',
        daysLeft: 10,
        coursesWithMissingGrades: 1,
        totalCourses: 2,
      });
    });

    it('has no banner when the period ends later', async () => {
      const { service, prisma } = build({ periods: [{ ...PERIOD, endDate: new Date('2026-12-20T05:00:00Z') }] });

      expect((await service.attention(admin, SCHOOL)).periodClose).toBeNull();
      expect(prisma.grade.findMany).not.toHaveBeenCalled();
    });

    it('refuses a school of another organization and requires a schoolId', async () => {
      const { service, prisma } = build({ school: null });

      await expect(service.attention(admin, 'school-x')).rejects.toThrow(new ForbiddenException('School not in your organization'));
      expect(prisma.school.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'school-x', organizationId: ORG } }));
      await expect(service.attention(admin, undefined)).rejects.toThrow(BadRequestException);
      await expect(service.attention({ ...admin, organizationId: null }, SCHOOL)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('kpis (FR-HOM-001.25)', () => {
    const metric = (minimumApproval: number, minimumExcellence: number) => ({
      studyPlan: { gradeMetric: { maximum: 5, minimumApproval, minimumExcellence } },
    });

    it('computes students, attendance today vs last week, collection and passing', async () => {
      const { service, prisma } = build({
        statuses: [
          { enrollmentStatus: 'ACTIVE', _count: { _all: 1248 } },
          { enrollmentStatus: 'CANDIDATE', _count: { _all: 12 } },
          { enrollmentStatus: 'RETIRED', _count: { _all: 40 } },
        ],
        today: [
          { status: AttendanceStatus.PRESENT, _count: { _all: 90 } },
          { status: AttendanceStatus.LATE, _count: { _all: 3 } },
          { status: AttendanceStatus.ABSENT, _count: { _all: 7 } },
        ],
        lastWeek: [{ status: AttendanceStatus.PRESENT, _count: { _all: 10 } }],
        monthCharges: [
          { amount: decimal(285), payments: [{ amount: decimal(285) }] },
          { amount: decimal(285), payments: [{ amount: decimal(300) }] }, // overpaid counts up to the charge
          { amount: decimal(430), payments: [] },
        ],
        courseScales: [
          { id: 'c-math', ...metric(3, 4.5) },
          { id: 'c-art', studyPlan: { gradeMetric: null } },
        ],
        averages: [
          { studentId: 's1', courseId: 'c-math', average: 4.8 },
          { studentId: 's2', courseId: 'c-math', average: 2.4 },
          { studentId: 's3', courseId: 'c-math', average: { toString: () => '3.5' } },
          { studentId: 's4', courseId: 'c-art', average: 1 }, // no scale: not evaluated
          { studentId: 's5', courseId: 'c-math', average: null },
        ],
      });

      const kpis = await service.kpis(admin, SCHOOL);

      expect(kpis.students).toEqual({ active: 1248, candidates: 12 });
      expect(kpis.attendanceToday).toEqual({ rate: 0.93, absent: 7, late: 3, lastWeekRate: 1 });
      expect(kpis.collection).toEqual({ rate: 570 / 1000, collected: 570, billed: 1000 });
      expect(kpis.passing).toEqual({ evaluated: 3, rate: 2 / 3, belowPass: 1, allExcellent: 1 });
      expect(prisma.attendanceRecord.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            attendanceSession: {
              organizationId: ORG,
              classGroup: { schoolId: SCHOOL },
              date: { gte: new Date('2026-11-09T00:00:00Z'), lte: new Date('2026-11-15T00:00:00Z') },
            },
          },
        }),
      );
      expect(prisma.charge.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { schoolId: SCHOOL, dueDate: { gte: new Date('2026-11-01T00:00:00Z'), lt: new Date('2026-12-01T00:00:00Z') } },
        }),
      );
    });

    it('has no passing figures without a period and no collection without VIEW_FINANCIALS', async () => {
      const { service, prisma } = build({ periods: [] });

      const kpis = await service.kpis({ ...admin, role: 'COORDINATOR', permissions: [] }, SCHOOL);

      expect(kpis.passing).toBeNull();
      expect(kpis.collection).toBeNull();
      expect(kpis.attendanceToday).toEqual({ rate: null, absent: 0, late: 0, lastWeekRate: null });
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });
  });
});
