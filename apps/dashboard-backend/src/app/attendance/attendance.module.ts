import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { AttendanceResolver } from './attendance.resolver';
import { AttendanceService } from './attendance.service';

@Module({
  providers: [AttendanceResolver, AttendanceService],
  imports: [PrismaModule],
  exports: [AttendanceService],
})
export class AttendanceModule {}
