import { includeNestGraphQlResolvers } from '@/auth';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { AttendanceController } from './attendance.controller';
import { AttendanceResolver } from './attendance.resolver';
import { AttendanceService } from './attendance.service';

@Module({
  controllers: [AttendanceController],
  providers: [
    ...(includeNestGraphQlResolvers ? [AttendanceResolver] : []),
    AttendanceService,
  ],
  imports: [PrismaModule],
  exports: [AttendanceService],
})
export class AttendanceModule {}
