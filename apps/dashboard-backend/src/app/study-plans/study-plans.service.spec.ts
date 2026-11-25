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
      createManyAndReturn: jest.fn(async ({ data }) => data.map((d: { name: string }, i: number) => ({ id: `n${i}`, ...d }))),
    },
    course: { create: jest.fn(), findUnique: jest.fn().mockResolvedValue(null) },
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
    it('writes the plan, its overrides and its enrollment costs in one create', async () => {
      await service.create({
        name: ' 1° Primaria ',
        shortName: '1° P',
        level: 1,
        degreeId: 'd',
        schoolId: 's',
        gradeMetricId: '',
        tuitionStartMonth: 3,
        tuitionEndMonth: 12,
        enrollmentCosts: [{ name: 'Matrícula', amount: 50 }],
      });
      const { data } = prisma.studyPlan.create.mock.calls[0][0];
      expect(data).toMatchObject({
        name: '1° Primaria',
        description: '',
        gradeMetricId: null,
        tuitionStartMonth: 3,
        tuitionEndMonth: 12,
        enrollmentCosts: { createMany: { data: [{ name: 'Matrícula', amount: 50, order: 0 }] } },
      });
      expect(data).not.toHaveProperty('monthlyTuitionAmount');
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
      gradeMetricId: null,
      monthlyTuitionAmount: null,
      tuitionStartMonth: 3,
      tuitionEndMonth: 12,
      enrollmentCosts: [{ name: 'Matrícula', amount: 50, order: 0 }],
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

    it('copies the overrides, costs and courses (without teacher) into the new plan', async () => {
      const result = await service.duplicate('src', { name: '2° Primaria', shortName: '2° P', level: 2 });

      expect(prisma.studyPlan.create.mock.calls[0][0].data).toMatchObject({
        degreeId: 'd',
        tuitionStartMonth: 3,
        enrollmentCosts: { createMany: { data: [{ name: 'Matrícula', amount: 50, order: 0 }] } },
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
});
