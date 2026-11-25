import { Test, TestingModule } from '@nestjs/testing';
import { $Enums, Prisma } from '@generated/prisma';
import { ChargesService } from './charges.service';
import { PrismaService } from '../prisma.service';

describe('ChargesService', () => {
  let service: ChargesService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prisma: any = {
    charge: {
      count: jest.fn().mockResolvedValue(0),
      createMany: jest.fn().mockResolvedValue({ count: 0 }),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    student: { findUnique: jest.fn() },
    studyPlan: { findUnique: jest.fn() },
    school: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChargesService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get<ChargesService>(ChargesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('skips generation when charges already exist for student+study plan (idempotent)', async () => {
    prisma.charge.count.mockResolvedValue(2);

    const result = await service.generateFromStudyPlan('s1', 'sp1', 'sch1', 2026);

    expect(result).toBe(0);
    expect(prisma.charge.createMany).not.toHaveBeenCalled();
  });

  it('creates enrollment and tuition charges mapped to the academic year', async () => {
    prisma.charge.count.mockResolvedValue(0);
    prisma.studyPlan.findUnique.mockResolvedValue({
      id: 'sp1',
      enrollmentCosts: [{ name: 'Inscripción', amount: new Prisma.Decimal(500), order: 1 }],
      monthlyTuitionAmount: new Prisma.Decimal(1000),
      tuitionStartMonth: 8,
      tuitionEndMonth: 10,
      degree: null,
    });
    prisma.school.findUnique.mockResolvedValue({ currentYear: 2026, schoolYearStartMonth: 8 });

    await service.generateFromStudyPlan('s1', 'sp1', 'sch1', 2026);

    expect(prisma.charge.createMany).toHaveBeenCalledTimes(1);
    const data = prisma.charge.createMany.mock.calls[0][0].data as Prisma.ChargeCreateManyInput[];
    const enrollment = data.find((c) => c.chargeType === $Enums.ChargeType.ENROLLMENT);
    const tuition = data.filter((c) => c.chargeType === $Enums.ChargeType.TUITION);
    expect(enrollment?.amount).toEqual(new Prisma.Decimal(500));
    expect(tuition).toHaveLength(3);
    // Months >= startMonth stay in the base year; earlier months roll to next year.
    expect(tuition.every((c) => (c.year as number) === 2026)).toBe(true);
  });

  it('rolls tuition months before the start month into the next year', async () => {
    prisma.charge.count.mockResolvedValue(0);
    prisma.studyPlan.findUnique.mockResolvedValue({
      id: 'sp1',
      enrollmentCosts: [],
      monthlyTuitionAmount: new Prisma.Decimal(1000),
      tuitionStartMonth: 1,
      tuitionEndMonth: 6,
      degree: null,
    });
    prisma.school.findUnique.mockResolvedValue({ currentYear: 2026, schoolYearStartMonth: 8 });

    await service.generateFromStudyPlan('s1', 'sp1', 'sch1', 2026);

    const data = prisma.charge.createMany.mock.calls[0][0].data as Prisma.ChargeCreateManyInput[];
    expect(data.every((c) => (c.year as number) === 2027)).toBe(true);
  });

  it('inherits the degree settings the plan does not override', async () => {
    prisma.charge.count.mockResolvedValue(0);
    prisma.studyPlan.findUnique.mockResolvedValue({
      id: 'sp1',
      enrollmentCosts: [],
      monthlyTuitionAmount: new Prisma.Decimal(1200),
      tuitionStartMonth: null,
      tuitionEndMonth: null,
      degree: {
        enrollmentCosts: [{ name: 'Matrícula', amount: new Prisma.Decimal(300), order: 0 }],
        monthlyTuitionAmount: new Prisma.Decimal(900),
        tuitionStartMonth: 11,
        tuitionEndMonth: 2,
      },
    });
    prisma.school.findUnique.mockResolvedValue({ currentYear: 2026, schoolYearStartMonth: 8 });

    await service.generateFromStudyPlan('s1', 'sp1', 'sch1', 2026);

    const data = prisma.charge.createMany.mock.calls[0][0].data as Prisma.ChargeCreateManyInput[];
    const enrollment = data.filter((c) => c.chargeType === $Enums.ChargeType.ENROLLMENT);
    const tuition = data.filter((c) => c.chargeType === $Enums.ChargeType.TUITION);
    expect(enrollment.map((c) => c.description)).toEqual(['Matrícula']);
    // The plan's own tuition amount wins; the period comes from the degree and wraps over New Year.
    expect(tuition.every((c) => (c.amount as Prisma.Decimal).equals(1200))).toBe(true);
    expect(tuition.map((c) => [c.description, c.year])).toEqual([
      ['Colegiatura Noviembre', 2026],
      ['Colegiatura Diciembre', 2026],
      ['Colegiatura Enero', 2027],
      ['Colegiatura Febrero', 2027],
    ]);
  });

  it('uses the plan enrollment costs over the degree ones', async () => {
    prisma.charge.count.mockResolvedValue(0);
    prisma.studyPlan.findUnique.mockResolvedValue({
      id: 'sp1',
      enrollmentCosts: [{ name: 'Propio', amount: new Prisma.Decimal(10), order: 0 }],
      monthlyTuitionAmount: null,
      tuitionStartMonth: null,
      tuitionEndMonth: null,
      degree: {
        enrollmentCosts: [{ name: 'Del nivel', amount: new Prisma.Decimal(300), order: 0 }],
        monthlyTuitionAmount: null,
        tuitionStartMonth: null,
        tuitionEndMonth: null,
      },
    });
    prisma.school.findUnique.mockResolvedValue({ currentYear: 2026, schoolYearStartMonth: 8 });

    await service.generateFromStudyPlan('s1', 'sp1', 'sch1', 2026);

    const data = prisma.charge.createMany.mock.calls[0][0].data as Prisma.ChargeCreateManyInput[];
    expect(data.map((c) => c.description)).toEqual(['Propio']);
  });

  describe('regenerateFromStudyPlan', () => {
    const student = {
      id: 's1',
      schoolId: 'sch1',
      classGroup: { studyPlanId: 'sp1' },
      school: { id: 'sch1', currentYear: 2026, schoolYearStartMonth: 8 },
    };

    it('generates charges for an existing student without them', async () => {
      prisma.charge.count.mockResolvedValue(0);
      prisma.student.findUnique.mockResolvedValue(student);
      prisma.studyPlan.findUnique.mockResolvedValue({
        id: 'sp1',
        enrollmentCosts: [{ name: 'Inscripción', amount: new Prisma.Decimal(500), order: 1 }],
        monthlyTuitionAmount: new Prisma.Decimal(1000),
        tuitionStartMonth: 8,
        tuitionEndMonth: 9,
        degree: null,
      });
      prisma.school.findUnique.mockResolvedValue({ currentYear: 2026, schoolYearStartMonth: 8 });

      const result = await service.regenerateFromStudyPlan('s1');

      expect(prisma.charge.deleteMany).not.toHaveBeenCalled();
      expect(prisma.charge.createMany).toHaveBeenCalledTimes(1);
      expect(result.created).toBe(3);
    });

    it('is idempotent without force: no new charges when they already exist', async () => {
      prisma.charge.count.mockResolvedValue(3);
      prisma.student.findUnique.mockResolvedValue(student);
      prisma.studyPlan.findUnique.mockResolvedValue({
        id: 'sp1',
        enrollmentCosts: [],
        monthlyTuitionAmount: new Prisma.Decimal(1000),
        tuitionStartMonth: 8,
        tuitionEndMonth: 8,
        degree: null,
      });
      prisma.school.findUnique.mockResolvedValue({ currentYear: 2026, schoolYearStartMonth: 8 });

      const result = await service.regenerateFromStudyPlan('s1', false);

      expect(prisma.charge.deleteMany).not.toHaveBeenCalled();
      expect(prisma.charge.createMany).not.toHaveBeenCalled();
      expect(result.created).toBe(0);
    });

    it('force-deletes non-paid charges before regenerating', async () => {
      prisma.charge.count.mockResolvedValue(3);
      prisma.charge.deleteMany.mockImplementation(async () => {
        prisma.charge.count.mockResolvedValue(0);
        return { count: 3 };
      });
      prisma.student.findUnique.mockResolvedValue(student);
      prisma.studyPlan.findUnique.mockResolvedValue({
        id: 'sp1',
        enrollmentCosts: [],
        monthlyTuitionAmount: new Prisma.Decimal(1000),
        tuitionStartMonth: 8,
        tuitionEndMonth: 8,
        degree: null,
      });
      prisma.school.findUnique.mockResolvedValue({ currentYear: 2026, schoolYearStartMonth: 8 });

      const result = await service.regenerateFromStudyPlan('s1', true);

      expect(prisma.charge.deleteMany).toHaveBeenCalledWith({
        where: { studentId: 's1', studyPlanId: 'sp1', status: { not: $Enums.ChargeStatus.PAID } },
      });
      expect(result.created).toBe(1);
    });

    it('rejects students without a study plan', async () => {
      prisma.student.findUnique.mockResolvedValue({
        id: 's1',
        schoolId: 'sch1',
        classGroup: { studyPlanId: null },
        school: { id: 'sch1', currentYear: 2026, schoolYearStartMonth: 8 },
      });

      await expect(service.regenerateFromStudyPlan('s1')).rejects.toThrow();
    });
  });

  describe('findBySchool', () => {
    const baseWhere = { schoolId: 'sch1' };

    it('returns { data, total } honoring filters and pagination', async () => {
      prisma.charge.findMany.mockResolvedValue([{ id: 'c1' }]);
      prisma.charge.count.mockResolvedValue(42);

      const result = await service.findBySchool({
        schoolId: 'sch1',
        year: 2026,
        status: 'PENDING',
        chargeType: 'TUITION',
        studentId: 's9',
        description: 'coleg',
        skip: 10,
        take: 5,
      });

      expect(result.data).toEqual([{ id: 'c1' }]);
      expect(result.total).toBe(42);
      expect(prisma.charge.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            schoolId: 'sch1',
            year: 2026,
            status: 'PENDING',
            chargeType: 'TUITION',
            studentId: 's9',
            description: { contains: 'coleg', mode: 'insensitive' },
          },
          skip: 10,
          take: 5,
        }),
      );
      expect(prisma.charge.count).toHaveBeenCalledWith({
        where: expect.objectContaining(baseWhere),
      });
    });

    it('omits optional filters when not provided', async () => {
      prisma.charge.findMany.mockResolvedValue([]);
      prisma.charge.count.mockResolvedValue(0);

      await service.findBySchool({ schoolId: 'sch1' });

      const where = prisma.charge.findMany.mock.calls[0][0].where;
      expect(where).toEqual({ schoolId: 'sch1' });
    });
  });

  describe('findByStudentScoped', () => {
    it('scopes entirely to the resolved student id (ignores any client id)', async () => {
      prisma.charge.findMany.mockResolvedValue([]);
      prisma.charge.count.mockResolvedValue(0);

      await service.findByStudentScoped('s-owner', {
        year: 2026,
        status: 'OVERDUE',
        description: 'insc',
      });

      const where = prisma.charge.findMany.mock.calls[0][0].where;
      expect(where.studentId).toBe('s-owner');
      expect(where).not.toHaveProperty('schoolId');
      expect(where.status).toBe('OVERDUE');
      expect(where.description).toEqual({ contains: 'insc', mode: 'insensitive' });
    });
  });
});
