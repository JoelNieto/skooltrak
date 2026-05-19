import { GradeReportPeriodAttendance } from './grade-report-period-attendance.entity';

export class GradeReportAttendanceRow {
    courseId: string;

    courseName: string;

    periodAttendance: GradeReportPeriodAttendance[];
}
