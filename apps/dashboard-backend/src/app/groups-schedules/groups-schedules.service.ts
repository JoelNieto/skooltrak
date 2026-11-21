import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateGroupsScheduleInput } from './dto/create-groups-schedule.input';
import { UpdateGroupsScheduleInput } from './dto/update-groups-schedule.input';
@Injectable()
export class GroupsSchedulesService {
  constructor(private readonly prisma: PrismaService) {}
  create(createGroupsScheduleInput: CreateGroupsScheduleInput) {
    return this.prisma.classGroupWeeklySchedule.create({
      data: createGroupsScheduleInput,
      include: { classGroup: true, course: true },
    });
  }

  findAll() {
    return this.prisma.classGroupWeeklySchedule.findMany();
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
    return schedules.reduce((acc, schedule) => {
      if (!acc[schedule.weekday]) {
        acc[schedule.weekday] = [];
      }
      acc[schedule.weekday].push(schedule);
      return acc;
    }, {} as Record<string, typeof schedules>);
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
