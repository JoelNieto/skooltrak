import { Module } from '@nestjs/common';
import { CLOCK, systemClock } from '../home/home-time';
import { PrismaModule } from '../prisma.module';
import { GroupsSchedulesController } from './groups-schedules.controller';
import { GroupsSchedulesService } from './groups-schedules.service';
import { MyScheduleService } from './my-schedule.service';

@Module({
  controllers: [GroupsSchedulesController],
  imports: [PrismaModule],
  providers: [GroupsSchedulesService, MyScheduleService, { provide: CLOCK, useValue: systemClock }],
})
export class GroupsSchedulesModule {}
