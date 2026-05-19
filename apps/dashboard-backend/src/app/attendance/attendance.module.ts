import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';

@Module({
  controllers: [AttendanceController],
  providers: [
    AttendanceService,
  ],
  imports: [PrismaModule],
  exports: [AttendanceService],
})
export class AttendanceModule {}
