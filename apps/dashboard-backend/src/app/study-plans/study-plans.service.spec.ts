import { BadRequestException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';
import { StudyPlansService } from './study-plans.service';

describe('StudyPlansService', () => {
  let service: StudyPlansService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prisma: any = {
    degree: { findUniqueOrThrow: jest.fn() },
    studyPlan: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      createManyAndReturn: jest.fn(async ({ data }) =>
        data.map((d: { name: string }, i: number) => ({ id: `n${i}`, ...d })),
      ),
    },
    course: {
      create: jest.fn(async ({ data }) => ({ id: `c-${data.subjectId}`, ...data })),
      findUnique: jest.fn().mockResolvedValue(null),
    },
    student: { findMany: jest.fn().mockResolvedValue([{ id: 'st1' }]) },
    courseEnrollment: { createMany: jest.fn() },
    $transaction: jest.fn(async (fn: (tx: unknown) => unknown) => fn(prisma)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [StudyPlansService, { provide: PrismaService, useValue: prisma }, { provide: REQUEST, useValue: {} }],
    }).compile();
    service = await module.resolve(StudyPlansService);
  });

  describe('create', () => {
    it('writes the plan and its overrides in one create', async () => {
      await service.create({
        name: ' 1° Primaria ',
        shortName: '1° P',
        level: 1,
        degreeId: 'd',
        schoolId: 's',
        gradeMetricId: '',
      });
      const { data } = prisma.studyPlan.create.mock.calls[0][0];
      expect(data).toMatchObject({
        name: '1° Primaria',
        description: '',
        gradeMetricId: null,
      });
    });
  });

  describe('bulkCreate', () => {
    beforeEach(() => {
      prisma.degree.findUniqueOrThrow.mockResolvedValue({ id: 'd', name: 'Primaria', shortName: 'P' });
    });

    it('creates one plan per grade, skipping the grades and names already taken', async () => {
      prisma.studyPlan.findMany.mockResolvedValue([
        { name: 'Primer grado', level: 2, degreeId: 'd' },
        { name: '3° primaria', level: 9, degreeId: 'other' },
      ]);

      const result = await service.bulkCreate({ schoolId: 's', degreeId: 'd', fromLevel: 1, toLevel: 4 });

      const { data } = prisma.studyPlan.createManyAndReturn.mock.calls[0][0];
      expect(data.map((d: { name: string; shortName: string }) => [d.name, d.shortName])).toEqual([
        ['1° Primaria', '1° P'],
        ['4° Primaria', '4° P'],
      ]);
      expect(result.skipped).toEqual([2, 3]);
      expect(result.created).toHaveLength(2);
    });

    it('rejects an inverted or too large range', async () => {
      await expect(service.bulkCreate({ schoolId: 's', degreeId: 'd', fromLevel: 5, toLevel: 1 })).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.bulkCreate({ schoolId: 's', degreeId: 'd', fromLevel: 0, toLevel: 20 })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('duplicate', () => {
    const source = {
      id: 'src',
      schoolId: 's',
      degreeId: 'd',
      description: 'desc',
      gradeMetricId: 'gm',
      courses: [
        {
          organizationId: 'o',
          subjectId: 'sub',
          color: 'BLUE',
          icon: 'atom',
          teacherId: 't',
          subject: { name: 'Matemáticas', code: 'MAT' },
          gradeBuckets: [{ name: 'Pruebas', weight: 60 }],
        },
      ],
    };

    beforeEach(() => {
      prisma.studyPlan.findUnique.mockResolvedValue(source);
      prisma.studyPlan.create.mockResolvedValue({ id: 'new', schoolId: 's', name: '2° Primaria', shortName: '2° P' });
    });

    it('copies the overrides and courses (without teacher) into the new plan', async () => {
      const result = await service.duplicate('src', { name: '2° Primaria', shortName: '2° P', level: 2 });

      expect(prisma.studyPlan.create.mock.calls[0][0].data).toMatchObject({
        degreeId: 'd',
        gradeMetricId: 'gm',
      });
      const course = prisma.course.create.mock.calls[0][0].data;
      expect(course).toMatchObject({
        name: 'Matemáticas - 2° Primaria',
        shortName: 'MAT - 2° P',
        code: 'MAT',
        studyPlanId: 'new',
        color: 'BLUE',
        gradeBuckets: { createMany: { data: [{ name: 'Pruebas', weight: 60 }] } },
      });
      expect(course).not.toHaveProperty('teacherId');
      expect(result.copiedCourses).toBe(1);
    });

    it('leaves the courses out when asked', async () => {
      const result = await service.duplicate('src', { name: 'x', shortName: 'x', level: 2, copyCourses: false });
      expect(prisma.course.create).not.toHaveBeenCalled();
      expect(result.copiedCourses).toBe(0);
    });
  });

  describe('copyCourses', () => {
    const course = (subjectId: string, name: string) => ({
      organizationId: 'o',
      subjectId,
      color: null,
      icon: null,
      subject: { name, code: name.slice(0, 3).toUpperCase() },
      gradeBuckets: [],
    });

    beforeEach(() => {
      prisma.studyPlan.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) =>
        where.id === 'target'
          ? { id: 'target', name: '4° Primaria', shortName: '4° P', schoolId: 's', courses: [{ subjectId: 'mat' }] }
          : { schoolId: 's', courses: [course('mat', 'Matemáticas'), course('cie', 'Ciencias')] },
      );
    });

    it('copies the subjects the target lacks, enrolls its students and reports the skipped ones', async () => {
      const result = await service.copyCourses('target', { sourceStudyPlanId: 'src' });

      expect(prisma.course.create).toHaveBeenCalledTimes(1);
      expect(prisma.course.create.mock.calls[0][0].data).toMatchObject({
        name: 'Ciencias - 4° Primaria',
        studyPlanId: 'target',
        subjectId: 'cie',
      });
      expect(prisma.courseEnrollment.createMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: [expect.objectContaining({ courseId: 'c-cie', studentId: 'st1' })] }),
      );
      expect(result).toEqual({ copied: [{ id: 'c-cie', name: 'Ciencias - 4° Primaria' }], skipped: ['Matemáticas'] });
    });

    it('filters the source courses by the chosen subjects', async () => {
      await service.copyCourses('target', { sourceStudyPlanId: 'src', subjectIds: ['cie'] });
      const sourceQuery = prisma.studyPlan.findUnique.mock.calls.find(
        ([q]: [{ where: { id: string } }]) => q.where.id === 'src',
      )[0];
      expect(sourceQuery.select.courses.where).toEqual({ subjectId: { in: ['cie'] } });
    });

    it('refuses the same plan and plans of another school', async () => {
      await expect(service.copyCourses('target', { sourceStudyPlanId: 'target' })).rejects.toThrow(BadRequestException);
      prisma.studyPlan.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) =>
        where.id === 'target'
          ? { id: 'target', name: 'x', shortName: 'x', schoolId: 's', courses: [] }
          : { schoolId: 'other', courses: [] },
      );
      await expect(service.copyCourses('target', { sourceStudyPlanId: 'src' })).rejects.toThrow(BadRequestException);
    });
  });
});
