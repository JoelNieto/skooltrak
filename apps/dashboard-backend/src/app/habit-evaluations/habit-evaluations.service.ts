import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../prisma.service';
import { SaveHabitEvaluationInput } from './dto/save-habit-evaluation.input';

@Injectable({ scope: Scope.REQUEST })
export class HabitEvaluationsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REQUEST) private readonly request: Request
  ) {}

  private async validateTeacherAccess(classGroupId: string) {
    const req = this.request;
    const { userId, role } = req.user as { userId: string; role: string };

    // Allow admins
    if (role === 'ADMIN') return;

    // Check if user is the teacher of this class group
    const classGroup = await this.prisma.classGroup.findUnique({
      where: { id: classGroupId },
      include: { teacher: true },
    });

    if (!classGroup) {
      throw new NotFoundException('Class group not found');
    }

    if (classGroup.teacher?.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to manage habit evaluations for this group'
      );
    }
  }

  async save(input: SaveHabitEvaluationInput) {
    const req = this.request;
    const { userId } = req.user as { userId: string };

    await this.validateTeacherAccess(input.classGroupId);

    // Get teacher ID from user
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found for this user');
    }

    // Get organization from class group
    const classGroup = await this.prisma.classGroup.findUnique({
      where: { id: input.classGroupId },
      select: { organizationId: true },
    });

    if (!classGroup) {
      throw new NotFoundException('Class group not found');
    }

    // Check if evaluation already exists
    const existingEvaluation = await this.prisma.habitEvaluation.findUnique({
      where: {
        habitMetricId_classGroupId_periodId: {
          habitMetricId: input.habitMetricId,
          classGroupId: input.classGroupId,
          periodId: input.periodId,
        },
      },
      include: { studentEvaluations: true },
    });

    if (existingEvaluation) {
      // Update existing evaluation
      return this.prisma.habitEvaluation.update({
        where: { id: existingEvaluation.id },
        data: {
          published: input.published ?? existingEvaluation.published,
          studentEvaluations: {
            deleteMany: {},
            create: input.studentEvaluations.map((se) => ({
              studentId: se.studentId,
              value: se.value,
              comments: se.comments,
            })),
          },
        },
        include: {
          studentEvaluations: {
            include: { student: true },
            orderBy: { student: { firstName: 'asc' } },
          },
        },
      });
    }

    // Create new evaluation
    return this.prisma.habitEvaluation.create({
      data: {
        habitMetricId: input.habitMetricId,
        classGroupId: input.classGroupId,
        periodId: input.periodId,
        teacherId: teacher.id,
        organizationId: classGroup.organizationId,
        published: input.published ?? false,
        studentEvaluations: {
          create: input.studentEvaluations.map((se) => ({
            studentId: se.studentId,
            value: se.value,
            comments: se.comments,
          })),
        },
      },
      include: {
        studentEvaluations: {
          include: { student: true },
          orderBy: { student: { firstName: 'asc' } },
        },
      },
    });
  }

  async findByGroup(classGroupId: string, periodId: string) {
    const req = this.request;
    const { userId, role } = req.user as { userId: string; role: string };

    await this.validateTeacherAccess(classGroupId);

    return this.prisma.habitEvaluation.findMany({
      where: { classGroupId, periodId },
      include: {
        habitMetric: true,
        studentEvaluations: {
          include: { student: true },
          orderBy: { student: { firstName: 'asc' } },
        },
      },
      orderBy: { habitMetric: { order: 'asc' } },
    });
  }

  async findOne(id: string) {
    const evaluation = await this.prisma.habitEvaluation.findUnique({
      where: { id },
      include: {
        habitMetric: true,
        classGroup: true,
        period: true,
        studentEvaluations: {
          include: { student: true },
          orderBy: { student: { firstName: 'asc' } },
        },
      },
    });

    if (!evaluation) {
      throw new NotFoundException('Habit evaluation not found');
    }

    await this.validateTeacherAccess(evaluation.classGroupId);

    return evaluation;
  }
}
