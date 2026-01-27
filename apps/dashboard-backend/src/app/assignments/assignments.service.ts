import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateAssignmentInput } from './dto/create-assignment.input';
import { UpdateAssignmentInput } from './dto/update-assignment.input';

@Injectable()
export class AssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createAssignmentInput: CreateAssignmentInput) {
    const { groupDates, ...assignmentData } = createAssignmentInput;
    return this.prisma.assignment.create({
      data: {
        ...assignmentData,
        dates: groupDates?.length
          ? {
              create: groupDates,
            }
          : undefined,
      },
      include: { course: true, teacher: true, dates: { include: { classGroup: true } } },
    });
  }

  findAll() {
    return this.prisma.assignment.findMany({
      include: { course: true, teacher: true, dates: { include: { classGroup: true } } },
    });
  }

  findAssignmentBySchoolId(schoolId: string, startDate: Date, endDate: Date) {
    return this.prisma.assignment.findMany({
      where: { schoolId, date: { gte: startDate, lte: endDate } },
      include: {
        course: { include: { subject: true, studyPlan: true } },
        teacher: true,
        dates: { include: { classGroup: true } },
      },
      orderBy: { date: 'asc' },
    });
  }

  findAssignmentByCourseId(courseId: string, startDate: Date, endDate: Date) {
    return this.prisma.assignment.findMany({
      where: { courseId, date: { gte: startDate, lte: endDate } },
      include: { course: true, teacher: true, dates: { include: { classGroup: true } } },
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Find assignment dates by school ID for calendar display.
   * If classGroupId is provided, filters to only that group's dates (for students).
   * Otherwise returns all assignment dates (for teachers/admins).
   */
  findAssignmentDatesBySchoolId(
    schoolId: string,
    startDate: Date,
    endDate: Date,
    classGroupId?: string,
  ) {
    return this.prisma.assignmentDate.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        assignment: { schoolId },
        ...(classGroupId ? { classGroupId } : {}),
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
   * If classGroupId is provided, filters to only that group's dates (for students).
   * Otherwise returns all assignment dates (for teachers/admins).
   */
  findAssignmentDatesByCourseId(
    courseId: string,
    startDate: Date,
    endDate: Date,
    classGroupId?: string,
  ) {
    return this.prisma.assignmentDate.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        assignment: { courseId },
        ...(classGroupId ? { classGroupId } : {}),
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

  findOne(id: string) {
    return this.prisma.assignment.findUnique({
      where: { id },
      include: { course: true, teacher: true, dates: { include: { classGroup: true } } },
    });
  }

  update(id: string, updateAssignmentInput: UpdateAssignmentInput) {
    return this.prisma.assignment.update({
      where: { id },
      data: updateAssignmentInput,
    });
  }

  remove(id: string) {
    return this.prisma.assignment.delete({ where: { id } });
  }
}
