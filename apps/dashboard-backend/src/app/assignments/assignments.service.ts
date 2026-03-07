import { Injectable } from '@nestjs/common';
import { ChatSyncService } from '../chats/chat-sync.service';
import { PrismaService } from '../prisma.service';
import { CreateAssignmentInput } from './dto/create-assignment.input';
import { UpdateAssignmentInput } from './dto/update-assignment.input';

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatSync: ChatSyncService,
  ) {}

  async create(createAssignmentInput: CreateAssignmentInput) {
    const { groupDates, ...assignmentData } = createAssignmentInput;
    const assignment = await this.prisma.assignment.create({
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

    for (const d of assignment.dates) {
      await this.chatSync.addClassGroupStudentsToAssignmentChat(assignment.id, d.classGroupId);
    }

    return assignment;
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

  async update(id: string, updateAssignmentInput: UpdateAssignmentInput) {
    const input = updateAssignmentInput as UpdateAssignmentInput & {
      groupDates?: { date: Date; classGroupId: string }[];
    };
    const { id: _id, groupDates, ...rest } = input;
    const updateData: Record<string, unknown> = { ...rest };
    if (groupDates?.length) {
      (updateData as { dates?: { create: unknown[] } }).dates = { create: groupDates };
    }
    const assignment = await this.prisma.assignment.update({
      where: { id },
      data: updateData as never,
      include: { course: true, teacher: true, dates: { include: { classGroup: true } } },
    });

    if (groupDates?.length) {
      for (const d of groupDates) {
        await this.chatSync.addClassGroupStudentsToAssignmentChat(id, d.classGroupId);
      }
    }

    return assignment;
  }

  remove(id: string) {
    return this.prisma.assignment.delete({ where: { id } });
  }
}
