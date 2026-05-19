import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { GroupsSchedulesController } from './groups-schedules.controller';
import { GroupsSchedulesService } from './groups-schedules.service';

@Module({
  controllers: [GroupsSchedulesController],
  imports: [PrismaModule],
  providers: [
    GroupsSchedulesService,
  ],
})
export class GroupsSchedulesModule {}
