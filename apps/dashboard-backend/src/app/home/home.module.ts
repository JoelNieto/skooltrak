import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { CLOCK, systemClock } from './home-time';
import { ParentHomeController } from './parent-home.controller';
import { ParentHomeService } from './parent-home.service';
import { StudentHomeController } from './student-home.controller';
import { StudentHomeService } from './student-home.service';
import { TeacherHomeController } from './teacher-home.controller';
import { TeacherHomeService } from './teacher-home.service';

/** Persona home dashboards: read models over other contexts (HOM-001). */
@Module({
  imports: [PrismaModule],
  controllers: [TeacherHomeController, StudentHomeController, ParentHomeController],
  providers: [TeacherHomeService, StudentHomeService, ParentHomeService, { provide: CLOCK, useValue: systemClock }],
})
export class HomeModule {}
