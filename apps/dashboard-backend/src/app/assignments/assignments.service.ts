import { Prisma } from '@generated/prisma';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateAssignmentInput } from './dto/create-assignment.input';
import { UpdateAssignmentInput } from './dto/update-assignment.input';

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /** `schoolId` comes from the course, never from the caller. */
  async create(createAssignmentInput: CreateAssignmentInput, schoolId: string) {
    const { groupDates, ...assignmentData } = createAssignmentInput;
    const assignment = await this.prisma.assignment.create({
      data: {
        ...assignmentData,
        schoolId,
        dates: groupDates?.length
          ? {
              create: groupDates,
            }
          : undefined,
      },
      include: { course: true, teacher: true, dates: { include: { classGroup: true } } },
    });

    return assignment;
  }

  findAll(organizationId: string) {
    return this.prisma.assignment.findMany({
      where: { course: { organizationId } },
      include: { course: true, teacher: true, dates: { include: { classGroup: true } } },
    });
  }

  /** `classGroupIds`: only assignments dated for these groups; undefined means all. */
  findAssignmentBySchoolId(schoolId: string, startDate: Date, endDate: Date, classGroupIds?: string[]) {
    return this.prisma.assignment.findMany({
      where: { schoolId, date: { gte: startDate, lte: endDate }, ...datedFor(classGroupIds) },
      include: {
        course: { include: { subject: true, studyPlan: true } },
        teacher: true,
        dates: { include: { classGroup: true } },
      },
      orderBy: { date: 'asc' },
    });
  }

  findAssignmentByCourseId(courseId: string, startDate: Date, endDate: Date, classGroupIds?: string[]) {
    return this.prisma.assignment.findMany({
      where: { courseId, date: { gte: startDate, lte: endDate }, ...datedFor(classGroupIds) },
      include: { course: true, teacher: true, dates: { where: inGroups(classGroupIds), include: { classGroup: true } } },
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Find assignment dates by school ID for calendar display.
   * `classGroupIds`: only these groups' dates (students, parents, or a chosen group); undefined
   * means every group (teachers, admins).
   */
  findAssignmentDatesBySchoolId(schoolId: string, startDate: Date, endDate: Date, classGroupIds?: string[]) {
    return this.prisma.assignmentDate.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        assignment: { schoolId },
        ...inGroups(classGroupIds),
      },
      include: {
        classGroup: true,
        assignment: {
          include: { course: true, teacher: true },
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Find assignment dates by course ID for calendar display.
   * `classGroupIds`: as for the school calendar.
   */
  findAssignmentDatesByCourseId(courseId: string, startDate: Date, endDate: Date, classGroupIds?: string[]) {
    return this.prisma.assignmentDate.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        assignment: { courseId },
        ...inGroups(classGroupIds),
      },
      include: {
        classGroup: true,
        assignment: {
          include: { course: true, teacher: true },
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  /** `classGroupIds`: keep only these groups' dates; undefined keeps every date. */
  findOne(id: string, classGroupIds?: string[]) {
    return this.prisma.assignment.findUnique({
      where: { id },
      include: { course: true, teacher: true, dates: { where: inGroups(classGroupIds), include: { classGroup: true } } },
    });
  }

  async update(id: string, updateAssignmentInput: UpdateAssignmentInput) {
    const input = updateAssignmentInput as UpdateAssignmentInput & {
      groupDates?: { date: Date; classGroupId: string }[];
    };
    // The course and school never change (the caller's access was checked against them).
    const { id: _id, groupDates, courseId: _courseId, schoolId: _schoolId, ...rest } = input;
    const updateData: Record<string, unknown> = { ...rest };
    if (groupDates?.length) {
      (updateData as { dates?: { create: unknown[] } }).dates = { create: groupDates };
    }
    const assignment = await this.prisma.assignment.update({
      where: { id },
      data: updateData as never,
      include: { course: true, teacher: true, dates: { include: { classGroup: true } } },
    });

    return assignment;
  }

  remove(id: string) {
    return this.prisma.assignment.delete({ where: { id } });
  }
}

function inGroups(classGroupIds?: string[]): Prisma.AssignmentDateWhereInput {
  return classGroupIds ? { classGroupId: { in: classGroupIds } } : {};
}

function datedFor(classGroupIds?: string[]): Prisma.AssignmentWhereInput {
  return classGroupIds ? { dates: { some: inGroups(classGroupIds) } } : {};
}
