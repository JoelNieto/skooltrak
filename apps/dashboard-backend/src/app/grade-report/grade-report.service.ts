import { ForbiddenException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { CONTEXT } from '@nestjs/graphql';
import type { Request } from 'express';
import { GradesService } from '../grades/grades.service';
import { PrismaService } from '../prisma.service';
import { SchoolsService } from '../schools/schools.service';
import {
  GradeReport,
  GradeReportAttendanceRow,
  GradeReportGradesRow,
  GradeReportHabitRow,
  GradeReportOverallRow,
  GradeReportPeriodAttendance,
  GradeReportPeriodInfo,
} from './entities';

@Injectable({ scope: Scope.REQUEST })
export class GradeReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gradesService: GradesService,
    private readonly schoolsService: SchoolsService,
    @Inject(CONTEXT) private readonly context: { req: Request },
  ) {}

  async getGradeReport(studentId: string, periodId: string): Promise<GradeReport> {
    const { req } = this.context;
    const { userId, role } = req.user as { userId: string; role: string };

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        school: true,
        classGroup: {
          include: {
            teacher: { include: { user: true } },
            studyPlan: true,
          },
        },
        user: true,
        courses: {
          include: { subject: true },
          orderBy: { subject: { name: 'asc' } },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const isAdmin = role === 'ADMIN' || role === 'ORG_ADMIN' || role === 'SYSADMIN';
    if (!isAdmin) {
      if (role === 'STUDENT') {
        if (student.userId !== userId) {
          throw new ForbiddenException('You can only view your own grade report');
        }
      } else {
        const teacher = await this.prisma.teacher.findUnique({
          where: { userId },
        });
        const hasAccess =
          teacher &&
          (student.classGroup?.teacherId === teacher.id || student.courses.some((c) => c.teacherId === teacher.id));
        if (!hasAccess) {
          throw new ForbiddenException('You do not have permission to view this grade report');
        }
      }
    }

    const year = student.school.currentYear;
    const periods = await this.prisma.period.findMany({
      where: { year },
      orderBy: { startDate: 'asc' },
    });

    const selectedPeriod = periods.find((p) => p.id === periodId);
    const selectedPeriodIndex = selectedPeriod ? periods.indexOf(selectedPeriod) : -1;

    const periodInfos: GradeReportPeriodInfo[] = periods.map((p) => ({
      id: p.id,
      name: p.name,
      shortName: p.shortName,
    }));

    const gradesRows: GradeReportGradesRow[] = [];
    for (const course of student.courses) {
      const periodAverages: (number | null)[] = [];
      const validAverages: number[] = [];

      for (let i = 0; i < periods.length; i++) {
        const p = periods[i];
        const isFuture = selectedPeriodIndex >= 0 && i > selectedPeriodIndex;
        if (isFuture) {
          periodAverages.push(null);
        } else {
          const avg = await this.gradesService.getAverageScoreForStudent(course.id, p.id, studentId);
          if (avg > 0) {
            periodAverages.push(avg);
            validAverages.push(avg);
          } else {
            periodAverages.push(null);
          }
        }
      }

      const cumulativeAverage =
        validAverages.length > 0 ? validAverages.reduce((a, b) => a + b, 0) / validAverages.length : null;

      gradesRows.push({
        courseId: course.id,
        courseName: course.subject.name,
        periodAverages,
        cumulativeAverage,
      });
    }

    let overallGradesRow: GradeReportOverallRow | null = null;
    if (gradesRows.length > 0) {
      const periodAverages: (number | null)[] = [];
      const validCumulatives: number[] = [];

      for (let i = 0; i < periods.length; i++) {
        const values = gradesRows
          .map((r) => r.periodAverages[i])
          .filter((v): v is number => v !== null && v !== undefined);
        periodAverages.push(values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null);
      }

      for (const row of gradesRows) {
        if (row.cumulativeAverage !== null) {
          validCumulatives.push(row.cumulativeAverage);
        }
      }
      const cumulativeAverage =
        validCumulatives.length > 0 ? validCumulatives.reduce((a, b) => a + b, 0) / validCumulatives.length : null;

      overallGradesRow = {
        periodAverages,
        cumulativeAverage,
      };
    }

    const attendanceRows = await this.getAttendanceRows(studentId, student.courses, periods);

    const habitRows = await this.getHabitRows(studentId, student.classGroupId, periods, selectedPeriodIndex);

    const fullName =
      `${student.firstName} ${student.middleName || ''} ${student.fatherName} ${student.motherName || ''}`.trim();
    const userFullName = student.user ? `${student.user.firstName} ${student.user.lastName}`.trim() : '';
    const studentName = fullName || userFullName || 'Estudiante';

    let schoolLogoUrl: string | null = null;
    if (student.school.logo) {
      schoolLogoUrl = await this.schoolsService.getLogoUrl(student.school.logo);
    }

    return {
      schoolName: student.school.name,
      schoolLogoUrl,
      periodName: selectedPeriod?.name ?? '',
      studentName,
      documentId: student.documentId,
      classGroupName: student.classGroup?.name ?? null,
      teacherName: student.classGroup?.teacher?.user
        ? `${student.classGroup.teacher.user.firstName} ${student.classGroup.teacher.user.lastName}`.trim()
        : null,
      studyPlanName: student.classGroup?.studyPlan?.name ?? null,
      level: student.classGroup?.studyPlan?.level ?? null,
      periods: periodInfos,
      gradesRows,
      overallGradesRow,
      attendanceRows,
      habitRows,
    };
  }

  private async getAttendanceRows(
    studentId: string,
    courses: { id: string; subject: { name: string } }[],
    periods: { id: string; startDate: Date; endDate: Date }[],
  ): Promise<GradeReportAttendanceRow[]> {
    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        studentId,
        status: { in: ['ABSENT', 'LATE'] },
      },
      include: {
        attendanceSession: {
          select: { date: true, courseId: true },
        },
      },
    });

    const byCourseAndPeriod = new Map<string, Map<string, { absent: number; late: number }>>();

    for (const record of records) {
      const session = record.attendanceSession;
      const courseId = session.courseId;

      for (const period of periods) {
        const start = new Date(period.startDate);
        const end = new Date(period.endDate);
        const sessionDate = new Date(session.date);
        if (sessionDate >= start && sessionDate <= end) {
          let courseMap = byCourseAndPeriod.get(courseId);
          if (!courseMap) {
            courseMap = new Map();
            byCourseAndPeriod.set(courseId, courseMap);
          }
          let counts = courseMap.get(period.id);
          if (!counts) {
            counts = { absent: 0, late: 0 };
            courseMap.set(period.id, counts);
          }
          if (record.status === 'ABSENT') counts.absent++;
          else if (record.status === 'LATE') counts.late++;
          break;
        }
      }
    }

    const attendanceRows: GradeReportAttendanceRow[] = courses.map((course) => {
      const courseMap = byCourseAndPeriod.get(course.id);
      const periodAttendance: GradeReportPeriodAttendance[] = periods.map((p) => ({
        periodId: p.id,
        absent: courseMap?.get(p.id)?.absent ?? 0,
        late: courseMap?.get(p.id)?.late ?? 0,
      }));
      return {
        courseId: course.id,
        courseName: course.subject.name,
        periodAttendance,
      };
    });

    return attendanceRows;
  }

  private async getHabitRows(
    studentId: string,
    classGroupId: string | null,
    periods: { id: string }[],
    selectedPeriodIndex: number,
  ): Promise<GradeReportHabitRow[]> {
    if (!classGroupId) return [];

    const periodIdsUpToSelected =
      selectedPeriodIndex >= 0 ? periods.slice(0, selectedPeriodIndex + 1).map((p) => p.id) : periods.map((p) => p.id);

    const evaluations = await this.prisma.studentHabitEvaluation.findMany({
      where: {
        studentId,
        habitEvaluation: {
          classGroupId,
          periodId: { in: periodIdsUpToSelected },
          published: true,
        },
      },
      include: {
        habitEvaluation: {
          include: {
            habitMetric: true,
            period: true,
          },
        },
      },
    });

    const latestByMetric = new Map<string, { value: string; order: number }>();
    for (const ev of evaluations) {
      const metric = ev.habitEvaluation.habitMetric;
      const periodOrder = periods.findIndex((p) => p.id === ev.habitEvaluation.periodId);
      const existing = latestByMetric.get(metric.name);
      if (!existing || periodOrder >= existing.order) {
        latestByMetric.set(metric.name, {
          value: ev.value,
          order: periodOrder,
        });
      }
    }

    const habitMetrics = await this.prisma.habitMetric.findMany({
      where: { active: true },
      orderBy: { order: 'asc' },
    });

    return habitMetrics.map((m) => ({
      metricName: m.name,
      value: latestByMetric.get(m.name)?.value ?? '-',
    }));
  }
}
