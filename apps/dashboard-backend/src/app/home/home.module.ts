import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { CLOCK, systemClock } from './home-time';
import { TeacherHomeController } from './teacher-home.controller';
import { TeacherHomeService } from './teacher-home.service';

/** Persona home dashboards: read models over other contexts (HOM-001). */
@Module({
  imports: [PrismaModule],
  controllers: [TeacherHomeController],
  providers: [TeacherHomeService, { provide: CLOCK, useValue: systemClock }],
})
export class HomeModule {}
