import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from '@/auth';
import { AssignmentSubmissionsModule } from './assignment-submissions/assignment-submissions.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ChatsModule } from './chats/chats.module';
import { ClassGroupsModule } from './class-groups/class-groups.module';
import { CommunicationModule } from './communication/communication.module';
import { CoursesModule } from './courses/courses.module';
import { DegreesModule } from './degrees/degrees.module';
import { FilesModule } from './files/files.module';
import { FinancialModule } from './financial/financial.module';
import { GradeBucketsModule } from './grade-buckets/grade-buckets.module';
import { GradeMetricsModule } from './grade-metrics/grade-metrics.module';
import { GradeReportModule } from './grade-report/grade-report.module';
import { GradebookModule } from './gradebook/gradebook.module';
import { GradesModule } from './grades/grades.module';
import { GroupsSchedulesModule } from './groups-schedules/groups-schedules.module';
import { HabitEvaluationsModule } from './habit-evaluations/habit-evaluations.module';
import { HabitMetricsModule } from './habit-metrics/habit-metrics.module';
import { ImportsModule } from './imports/imports.module';
import { MessagesModule } from './messages/messages.module';
import { NewslettersModule } from './newsletters/newsletters.module';
import { ParentsModule } from './parents/parents.module';
import { PeriodsModule } from './periods/periods.module';
import { PrismaModule } from './prisma.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { SchoolsModule } from './schools/schools.module';
import { StoreModule } from './store/store.module';
import { StudentGradesModule } from './student-grades/student-grades.module';
import { StudentsModule } from './students/students.module';
import { StudyPlansModule } from './study-plans/study-plans.module';
import { SubjectsModule } from './subjects/subjects.module';
import { TeachersModule } from './teachers/teachers.module';
import { HomeModule } from './home/home.module';

const openApiExport = process.env['OPENAPI_EXPORT'] === 'true';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    ...(openApiExport ? [] : [ScheduleModule.forRoot()]),
    PrismaModule,
    SchoolsModule,
    SubjectsModule,
    DegreesModule,
    CoursesModule,
    StudyPlansModule,
    TeachersModule,
    StudentsModule,
    AssignmentsModule,
    AssignmentSubmissionsModule,
    AttendanceModule,
    ClassGroupsModule,
    QuizzesModule,
    GradeMetricsModule,
    PeriodsModule,
    GradesModule,
    GradebookModule,
    GradeBucketsModule,
    StudentGradesModule,
    MessagesModule,
    GroupsSchedulesModule,
    FilesModule,
    ParentsModule,
    NewslettersModule,
    ChatsModule,
    CommunicationModule,
    HabitEvaluationsModule,
    HabitMetricsModule,
    GradeReportModule,
    FinancialModule,
    StoreModule,
    ImportsModule,
    HomeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
