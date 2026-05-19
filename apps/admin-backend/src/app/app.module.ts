import { AuthModule } from '@/auth';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma.module';
import { SchoolsModule } from './schools/schools.module';
import { SubjectsModule } from './subjects/subjects.module';
import { GradeMetricsModule } from './grade-metrics/grade-metrics.module';
import { PeriodsModule } from './periods/periods.module';
import { HabitMetricsModule } from './habit-metrics/habit-metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    SchoolsModule,
    SubjectsModule,
    AuthModule,
    GradeMetricsModule,
    HabitMetricsModule,
    PeriodsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
