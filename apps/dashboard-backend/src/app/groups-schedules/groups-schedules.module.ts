import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { GroupsSchedulesResolver } from './groups-schedules.resolver';
import { GroupsSchedulesService } from './groups-schedules.service';

@Module({
  imports: [PrismaModule],
  providers: [GroupsSchedulesResolver, GroupsSchedulesService],
})
export class GroupsSchedulesModule {}
