import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { WeekDay } from '@generated/prisma';
import { PrismaService } from '../prisma.service';
import { describeTime, firstClash, isValidRange } from './schedule-conflicts';
import { CreateGroupsScheduleInput } from './dto/create-groups-schedule.input';
import { UpdateGroupsScheduleInput } from './dto/update-groups-schedule.input';
export const INVALID_RANGE = 'La hora de fin debe ser posterior a la de inicio (formato HH:mm)';

export interface ScheduleCandidate {
  id?: string;
  classGroupId: string;
  courseId: string;
  weekday: WeekDay;
  startTime: string;
  endTime: string;
  recess?: boolean;
}

/** A slot of another group taught by one of this group's teachers (for the editor's live clash check). */
export interface TeacherBusySlot {
  id: string;
  weekday: WeekDay;
  startTime: string;
  endTime: string;
  teacherId: string;
  groupName: string;
}

@Injectable()
export class GroupsSchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Refuses a slot that clashes with another class of its group (409) or with another group's class
   * of the same teacher (409), or whose times are not a valid HH:mm range (400).
   */
  async assertNoClash(candidate: ScheduleCandidate): Promise<void> {
    if (!isValidRange(candidate.startTime, candidate.endTime)) throw new BadRequestException(INVALID_RANGE);
    if (candidate.recess) return;

    const sameDay = await this.prisma.classGroupWeeklySchedule.findMany({
      where: { classGroupId: candidate.classGroupId, weekday: candidate.weekday, recess: false },
      select: {
        id: true,
        weekday: true,
        startTime: true,
        endTime: true,
        classGroup: { select: { name: true } },
        course: { select: { name: true, subject: { select: { name: true } } } },
      },
    });
    const groupClash = firstClash(candidate, sameDay);
    if (groupClash) {
      const subject = groupClash.course.subject?.name ?? groupClash.course.name;
      throw new ConflictException(`${groupClash.classGroup.name} ya tiene ${subject} ${describeTime(groupClash)}`);
    }

    const course = await this.prisma.course.findUnique({
      where: { id: candidate.courseId },
      select: { teacherId: true, teacher: { select: { user: { select: { firstName: true, lastName: true } } } } },
    });
    if (!course?.teacherId) return;
    const teacherDay = await this.prisma.classGroupWeeklySchedule.findMany({
      where: {
        classGroupId: { not: candidate.classGroupId },
        weekday: candidate.weekday,
        recess: false,
        course: { teacherId: course.teacherId },
      },
      select: { id: true, weekday: true, startTime: true, endTime: true, classGroup: { select: { name: true } } },
    });
    const teacherClash = firstClash(candidate, teacherDay);
    if (teacherClash) {
      const user = course.teacher?.user;
      const teacher = user ? `${user.firstName} ${user.lastName}`.trim() : 'El docente';
      throw new ConflictException(
        `${teacher} ya tiene clase con ${teacherClash.classGroup.name} ${describeTime(teacherClash)}`,
      );
    }
  }

  /** Other groups' slots taught by the teachers of this group's courses (its study plan's courses). */
  async findTeacherBusy(classGroupId: string): Promise<TeacherBusySlot[]> {
    const group = await this.prisma.classGroup.findUnique({
      where: { id: classGroupId },
      select: { studyPlanId: true, organizationId: true },
    });
    if (!group) return [];
    const courses = await this.prisma.course.findMany({
      where: { studyPlanId: group.studyPlanId, organizationId: group.organizationId, teacherId: { not: null } },
      select: { teacherId: true },
    });
    const teacherIds = [...new Set(courses.map((c) => c.teacherId).filter((id): id is string => !!id))];
    if (!teacherIds.length) return [];
    const slots = await this.prisma.classGroupWeeklySchedule.findMany({
      where: { classGroupId: { not: classGroupId }, recess: false, course: { teacherId: { in: teacherIds } } },
      select: {
        id: true,
        weekday: true,
        startTime: true,
        endTime: true,
        classGroup: { select: { name: true } },
        course: { select: { teacherId: true } },
      },
    });
    return slots.map((s) => ({
      id: s.id,
      weekday: s.weekday,
      startTime: s.startTime,
      endTime: s.endTime,
      teacherId: s.course.teacherId as string,
      groupName: s.classGroup.name,
    }));
  }
  create(createGroupsScheduleInput: CreateGroupsScheduleInput) {
    return this.prisma.classGroupWeeklySchedule.create({
      data: createGroupsScheduleInput,
      include: { classGroup: true, course: true },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.classGroupWeeklySchedule.findMany({ where: { classGroup: { organizationId } } });
  }

  findAllByClassGroupId(classGroupId: string) {
    return this.prisma.classGroupWeeklySchedule.findMany({
      where: { classGroupId },
      include: {
        classGroup: true,
        course: {
          include: { subject: true, teacher: { include: { user: true } } },
        },
      },
      orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
    });
  }
  async findAllByClassGroupIdGrouped(classGroupId: string) {
    const schedules = await this.prisma.classGroupWeeklySchedule.findMany({
      where: { classGroupId },
      include: {
        classGroup: true,
        course: {
          include: { subject: true, teacher: { include: { user: true } } },
        },
      },
      orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
    });
    return schedules.reduce(
      (acc, schedule) => {
        if (!acc[schedule.weekday]) {
          acc[schedule.weekday] = [];
        }
        acc[schedule.weekday].push(schedule);
        return acc;
      },
      {} as Record<string, typeof schedules>,
    );
  }

  findAllByCourseId(courseId: string) {
    return this.prisma.classGroupWeeklySchedule.findMany({
      where: { courseId },
      include: {
        classGroup: true,
        course: {
          include: { subject: true, teacher: { include: { user: true } } },
        },
      },
      orderBy: { weekday: 'asc', startTime: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.classGroupWeeklySchedule.findUnique({ where: { id } });
  }

  update(id: string, updateGroupsScheduleInput: UpdateGroupsScheduleInput) {
    return this.prisma.classGroupWeeklySchedule.update({
      where: { id },
      data: updateGroupsScheduleInput,
    });
  }

  remove(id: string) {
    return this.prisma.classGroupWeeklySchedule.delete({ where: { id } });
  }
}
