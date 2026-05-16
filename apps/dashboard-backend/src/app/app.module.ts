import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from '@/auth';
import { AssignmentsModule } from './assignments/assignments.module';
import { AssignmentSubmissionsModule } from './assignment-submissions/assignment-submissions.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ClassGroupsModule } from './class-groups/class-groups.module';
import { CoursesModule } from './courses/courses.module';
import { DegreesModule } from './degrees/degrees.module';
import { PrismaModule } from './prisma.module';
import { SchoolsModule } from './schools/schools.module';
import { StudentsModule } from './students/students.module';
import { StudyPlansModule } from './study-plans/study-plans.module';
import { SubjectsModule } from './subjects/subjects.module';
import { TeachersModule } from './teachers/teachers.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { GradeMetricsModule } from './grade-metrics/grade-metrics.module';
import { PeriodsModule } from './periods/periods.module';
import { GradesModule } from './grades/grades.module';
import { GradeBucketsModule } from './grade-buckets/grade-buckets.module';
import { StudentGradesModule } from './student-grades/student-grades.module';
import { MessagesModule } from './messages/messages.module';
import { GroupsSchedulesModule } from './groups-schedules/groups-schedules.module';
import { FilesModule } from './files/files.module';
import { NewslettersModule } from './newsletters/newsletters.module';
import { ParentsModule } from './parents/parents.module';
import { GradeReportModule } from './grade-report/grade-report.module';
import { ChatsModule } from './chats/chats.module';
import { HabitEvaluationsModule } from './habit-evaluations/habit-evaluations.module';
import { HabitMetricsModule } from './habit-metrics/habit-metrics.module';
import { FinancialModule } from './financial/financial.module';
import { StoreModule } from './store/store.module';

const openApiExport = process.env['OPENAPI_EXPORT'] === 'true';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ...(openApiExport ? [] : [ScheduleModule.forRoot()]),
    PrismaModule,
    ...(openApiExport
      ? []
      : [
          GraphQLModule.forRootAsync<ApolloDriverConfig>({
            imports: [ConfigModule],
            useFactory: async () => ({
              autoSchemaFile: join(process.cwd(), 'schema.gql'),
              sortSchema: true,
              playground: false,
              plugins: [ApolloServerPluginLandingPageLocalDefault()],
              path: '/api/graphql',
              context: ({ req, res }) => ({ req, res }),
              subscriptions: {
                'graphql-ws': true,
              },
            }),
            driver: ApolloDriver,
          }),
        ]),
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
    AuthModule,
    QuizzesModule,
    GradeMetricsModule,
    PeriodsModule,
    GradesModule,
    GradeBucketsModule,
    StudentGradesModule,
    MessagesModule,
    GroupsSchedulesModule,
    FilesModule,
    ParentsModule,
    NewslettersModule,
    ChatsModule,
    HabitEvaluationsModule,
    HabitMetricsModule,
    GradeReportModule,
    FinancialModule,
    StoreModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
