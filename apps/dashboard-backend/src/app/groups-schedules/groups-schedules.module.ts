import { includeNestGraphQlResolvers } from '@/auth';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { GroupsSchedulesController } from './groups-schedules.controller';
import { GroupsSchedulesResolver } from './groups-schedules.resolver';
import { GroupsSchedulesService } from './groups-schedules.service';

@Module({
  controllers: [GroupsSchedulesController],
  imports: [PrismaModule],
  providers: [
    ...(includeNestGraphQlResolvers ? [GroupsSchedulesResolver] : []),
    GroupsSchedulesService,
  ],
})
export class GroupsSchedulesModule {}
