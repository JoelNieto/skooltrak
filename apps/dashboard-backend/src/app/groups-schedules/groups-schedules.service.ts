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
