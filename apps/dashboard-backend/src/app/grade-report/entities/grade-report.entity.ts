import { GradeReportAttendanceRow } from './grade-report-attendance-row.entity';
import { GradeReportGradesRow } from './grade-report-grades-row.entity';
import { GradeReportHabitRow } from './grade-report-habit-row.entity';
import { GradeReportOverallRow } from './grade-report-overall-row.entity';
import { GradeReportPeriodInfo } from './grade-report-period-info.entity';

export class GradeReport {
    schoolName: string;

    schoolLogoUrl: string | null;

    periodName: string;

    studentName: string;

    documentId: string;

    classGroupName: string | null;

    teacherName: string | null;

    studyPlanName: string | null;

    level: number | null;

    periods: GradeReportPeriodInfo[];

    gradesRows: GradeReportGradesRow[];

    overallGradesRow: GradeReportOverallRow | null;

    attendanceRows: GradeReportAttendanceRow[];

    habitRows: GradeReportHabitRow[];
}
