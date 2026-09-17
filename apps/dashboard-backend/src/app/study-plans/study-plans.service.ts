import { FetchDataQueryDto, PaginatedResponseDto } from '@/api-contracts';
import { Prisma } from '@generated/prisma';
import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import type { UpdateStudyPlanFinancialInput } from '../financial/dto/update-study-plan-financial.input';
import { PrismaService } from '../prisma.service';
import { CreateStudyPlanInput } from './dto/create-study-plan.input';
import { UpdateStudyPlanInput } from './dto/update-study-plan.input';
@Injectable()
export class StudyPlansService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  create(createStudyPlanInput: CreateStudyPlanInput) {
    return this.prisma.studyPlan.create({
      data: createStudyPlanInput,
      include: { degree: true, school: true },
    });
  }

  findAll() {
    return this.prisma.studyPlan.findMany({
      include: {
        degree: true,
        school: true,
        gradeMetric: true,
        enrollmentCosts: { orderBy: { order: 'asc' } },
      },
    });
  }

  async findMany(fetchDataInput: FetchDataQueryDto) {
    const { skip, page, pageSize, schoolId, search, degreeId, orderBy, orderDirection } = fetchDataInput;

    const include = {
      degree: { select: { id: true, name: true } },
      gradeMetric: true,
      enrollmentCosts: { orderBy: { order: 'asc' as const } },
    };

    const orderField = orderBy ?? 'createdAt';
    const orderDir = orderDirection ?? 'asc';

    let where: Prisma.StudyPlanWhereInput = {
      schoolId,
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { shortName: { contains: search, mode: 'insensitive' } },
      ],
    };

    if (degreeId) {
      where = { ...where, degreeId };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.studyPlan.findMany({
        where,
        skip,
        take: pageSize,
        include,
        orderBy: { [orderField]: orderDir },
      }),
      this.prisma.studyPlan.count({ where }),
    ]);

    return new PaginatedResponseDto(data, total, page, pageSize);
  }

  findAllBySchoolId(schoolId: string, degreeId?: string) {
    if (!schoolId) return [];
    const include = {
      degree: true,
      school: true,
      gradeMetric: true,
      enrollmentCosts: { orderBy: { order: 'asc' as const } },
    };
    if (degreeId) {
      return this.prisma.studyPlan.findMany({
        where: { schoolId, degreeId },
        include,
      });
    }
    return this.prisma.studyPlan.findMany({
      where: { schoolId },
      include,
      orderBy: { level: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.studyPlan.findUnique({
      where: { id },
      include: {
        degree: true,
        school: true,
        gradeMetric: true,
        enrollmentCosts: { orderBy: { order: 'asc' } },
      },
    });
  }

  update(id: string, updateStudyPlanInput: UpdateStudyPlanInput) {
    return this.prisma.studyPlan.update({
      where: { id },
      data: updateStudyPlanInput,
      include: { degree: true, school: true },
    });
  }

  remove(id: string) {
    return this.prisma.studyPlan.delete({ where: { id } });
  }

  async updateFinancialConfig(input: UpdateStudyPlanFinancialInput) {
    const { studyPlanId, monthlyTuitionAmount, tuitionMonths, enrollmentCosts } = input;

    return this.prisma.$transaction(async (tx) => {
      if (enrollmentCosts !== undefined) {
        await tx.studyPlanEnrollmentCost.deleteMany({
          where: { studyPlanId },
        });
        if (enrollmentCosts.length > 0) {
          await tx.studyPlanEnrollmentCost.createMany({
            data: enrollmentCosts.map((c, i) => ({
              studyPlanId,
              name: c.name,
              amount: c.amount,
              order: c.order ?? i,
            })),
          });
        }
      }

      const data: Record<string, unknown> = {};
      if (monthlyTuitionAmount !== undefined) {
        data.monthlyTuitionAmount = monthlyTuitionAmount;
      }
      if (tuitionMonths !== undefined) {
        data.tuitionMonths = tuitionMonths;
      }

      return tx.studyPlan.update({
        where: { id: studyPlanId },
        data,
        include: {
          degree: true,
          school: true,
          gradeMetric: true,
          enrollmentCosts: true,
        },
      });
    });
  }
}
